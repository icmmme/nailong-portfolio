import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import gsap from 'gsap';
import { profile, projects, collection, type Project } from './content';
import { wasDrag } from './gallery/math.mjs';
import type { PortfolioScene, PanelMode, SceneMode, Flight } from './gallery/Scene';
import { sheetEase } from './gallery/sheetEase';
import { ProjectPreview } from './ProjectPreview';
import { assetUrl } from './assets';

type PreviewHandler = (project: Project, opener: HTMLElement) => void;

function useMedia(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);
  return matches;
}

function useReducedMotion() {
  const systemReduced = useMedia('(prefers-reduced-motion: reduce)');
  return systemReduced || new URLSearchParams(location.search).get('motion') === 'reduce';
}

function Cover({ project, active }: { project: Project; active: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    const element = video.current;
    if (!element || !container.current || reduced || !active) { element?.pause(); setPlaying(false); return; }
    let alive = true, visible = false;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !document.hidden) element.play().then(() => {
        if (alive && visible && !document.hidden) setPlaying(true); else element.pause();
      }).catch(() => setPlaying(false));
      else element.pause();
    }, { threshold: 0.2 });
    observer.observe(container.current);
    const visibility = () => {
      if (document.hidden) element.pause();
      else if (visible) element.play().then(() => { if (alive && visible) setPlaying(true); }).catch(() => setPlaying(false));
    };
    document.addEventListener('visibilitychange', visibility);
    return () => { alive = false; observer.disconnect(); element.pause(); document.removeEventListener('visibilitychange', visibility); };
  }, [project.video, reduced, active]);
  return <div className="cover" ref={container}>
    <img src={assetUrl(project.cover)} alt={`${project.title} — cover`} loading="lazy" onError={event => { event.currentTarget.style.visibility = 'hidden'; }} />
    {project.video && <video ref={video} src={assetUrl(project.video)} poster={assetUrl(project.cover)} className={playing ? 'is-playing' : ''} muted loop playsInline preload="none" onError={() => setPlaying(false)} aria-hidden="true" />}
  </div>;
}

function HtmlGallery({ items, active, onPreview }: { items: Project[]; active: boolean; onPreview: PreviewHandler }) {
  return <div className="html-gallery" aria-label="Featured works">
    {items.map((project, i) => <article className="html-card" key={project.id}>
      <Cover project={project} active={active} />
      <div className="html-card-gradient" />
      <div className="card-copy"><span className="project-type">{project.category}</span><h2>{project.title}</h2></div>
      <span className="card-number">{String(i + 1).padStart(2, '0')}</span>
      <button className="html-card-open" data-project-id={project.id} type="button" onClick={event => onPreview(project,event.currentTarget)} aria-label={`Preview ${project.title}`}><span className="project-arrow" aria-hidden="true">↗</span></button>
    </article>)}
    <p className="mobile-note">SELECTED WORK / {collection.note}</p>
  </div>;
}

function WebGallery({ view, panel, previewOpen, reduced, onFallback, onPreview, sceneRef, onEffectsFallback }: { view: SceneMode; panel: PanelMode; previewOpen: boolean; reduced: boolean; onFallback: () => void; onPreview: PreviewHandler; sceneRef: RefObject<PortfolioScene | null>; onEffectsFallback: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const scene = sceneRef;
  const anchors = useRef<HTMLElement[]>([]);
  const currentState = useRef({ view, panel, previewOpen, reduced }); currentState.current = { view, panel, previewOpen, reduced };
  const drag = useRef({ active: false, x: 0, y: 0, pending: 0, distance: 0, pointer: -1 });
  const [ready, setReady] = useState(false);
  const items = projects.filter(project => project.featured);
  useEffect(() => {
    if (!host.current) return;
    let cancelled = false;
    import('./gallery/Scene').then(({ PortfolioScene }) => {
      if (cancelled || !host.current) return;
      try {
        scene.current = new PortfolioScene(host.current, items, anchors.current, currentState.current.reduced, onFallback, () => setReady(true), onEffectsFallback);
        scene.current.setState(currentState.current.view, currentState.current.panel,currentState.current.previewOpen);
      } catch (error) { console.warn('WebGL unavailable; using the HTML gallery.', error); onFallback(); }
    }).catch(onFallback);
    return () => { cancelled = true; scene.current?.dispose(); scene.current = null; };
  }, []);
  useEffect(() => { scene.current?.setState(view, panel,previewOpen); }, [view, panel,previewOpen]);
  useEffect(() => { scene.current?.setReduced(reduced); }, [reduced]);
  useEffect(() => {
    const cancel=()=>{drag.current.active=false;drag.current.pending=0;host.current?.classList.remove('is-dragging');scene.current?.release(performance.now(),true);const id=drag.current.pointer;if(host.current?.hasPointerCapture(id))host.current.releasePointerCapture(id);};
    const visibility=()=>{if(document.hidden)cancel();};
    window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',visibility);
    return()=>{window.removeEventListener('blur',cancel);document.removeEventListener('visibilitychange',visibility);};
  },[]);
  useEffect(() => {
    const element = host.current; if (!element) return;
    const wheel = (event: WheelEvent) => {
      if (currentState.current.previewOpen || currentState.current.panel === 'profile' || currentState.current.view !== 'featured' || event.ctrlKey) return;
      event.preventDefault();
      const value = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? element.clientWidth : element.clientHeight) : 1;
      scene.current?.wheel(value * unit, event.timeStamp);
    };
    window.addEventListener('wheel', wheel, { passive: false });
    return () => window.removeEventListener('wheel', wheel);
  }, []);
  return <div className={`web-gallery ${ready ? 'ready' : ''} ${view === 'full' || panel || previewOpen ? 'locked' : ''}`} ref={host}
    role="region" tabIndex={view === 'featured' && !panel && !previewOpen ? 0 : -1}
    aria-label="Featured gallery. Scroll, drag, or use the left and right arrow keys to explore."
    onPointerDown={event => {
      if (event.button !== 0 || view !== 'featured' || panel || previewOpen) return;
      drag.current = { active: true, x: event.clientX, y: event.clientY, pending: 0, distance: 0, pointer: event.pointerId };
      scene.current?.grab(event.timeStamp);
      host.current?.classList.add('is-dragging');
    }}
    onPointerMove={event => {
      if (!drag.current.active) return;
      const dx = event.clientX - drag.current.x, dy = event.clientY - drag.current.y;
      drag.current.distance += Math.hypot(dx, dy);
      drag.current.pending += dx;
      drag.current.x = event.clientX; drag.current.y = event.clientY;
      if (wasDrag(drag.current.distance)) {
        if (!host.current?.hasPointerCapture(event.pointerId)) host.current?.setPointerCapture(event.pointerId);
        scene.current?.dragBy(-drag.current.pending, event.timeStamp);
        drag.current.pending = 0;
      }
    }}
    onPointerUp={event => {
      drag.current.active = false; host.current?.classList.remove('is-dragging');
      scene.current?.release(event.timeStamp, !wasDrag(drag.current.distance));
      if (host.current?.hasPointerCapture(event.pointerId)) host.current.releasePointerCapture(event.pointerId);
    }}
    onPointerCancel={event => { drag.current.active = false; scene.current?.release(event.timeStamp,true); host.current?.classList.remove('is-dragging'); }}
    onLostPointerCapture={event => { if (drag.current.active) { drag.current.active=false; scene.current?.release(event.timeStamp,true); host.current?.classList.remove('is-dragging'); } }}
    onPointerLeave={event => { if (!wasDrag(drag.current.distance)) { drag.current.active = false; scene.current?.release(event.timeStamp,true); host.current?.classList.remove('is-dragging'); } }}
    onClickCapture={event => { if (wasDrag(drag.current.distance) && event.detail > 0) { event.preventDefault(); event.stopPropagation(); } }}
    onKeyDown={event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); scene.current?.step(event.key === 'ArrowRight' ? 1 : -1); }
    }}>
    {!ready && <div className="scene-loading" role="status"><span className="loading-line" />LOADING SELECTED WORK</div>}
    <div className="gallery-labels" aria-hidden={view !== 'featured' || !!panel || previewOpen} inert={view !== 'featured' || !!panel || previewOpen}>
      {items.map((project, i) => {
        const copy = <span className="sr-only">{project.title}</span>;
        return <button className="gallery-card-anchor" data-project-id={project.id} ref={el => { if (el) anchors.current[i]=el; }} key={project.id} type="button" aria-label={`Preview ${project.title}`} onClick={event => {if(event.detail>0 && !scene.current?.hitTest(project.id,event.clientX,event.clientY))return;onPreview(project,event.currentTarget);}}>{copy}</button>;
      })}
    </div>
  </div>;
}

export function App() {
  const desktop = useMedia('(min-width: 768px)');
  const reduced = useReducedMotion();
  // Explicit HTML mode is also useful for validating the WebGL fallback.
  const [fallback, setFallback] = useState(() => new URLSearchParams(location.search).get('render') === 'html');
  const [view, setView] = useState<SceneMode>('featured');
  const [panel, setPanel] = useState<PanelMode>(null);
  const [selectedProject,setSelectedProject] = useState<Project|null>(null);
  const [effectsFallback,setEffectsFallback] = useState(false);
  const scene = useRef<PortfolioScene | null>(null);
  const [previewFlying,setPreviewFlying] = useState(false);
  const [previewPhase,setPreviewPhase] = useState<'idle'|'opening'|'open'|'closing'>('idle');
  const phase = useRef(previewPhase);
  const flight = useRef<Flight | null>(null);
  const transition = useRef<gsap.core.Timeline | null>(null);
  const pendingClose = useRef(false);
  const closePreviewRef = useRef<() => void>(() => {});
  const previewDialog = useRef<HTMLDivElement>(null);
  const previewSheet = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const dialogCopy = useRef<HTMLDivElement>(null);
  const index = useRef<HTMLDivElement>(null);
  const panelButton = useRef<HTMLButtonElement>(null);
  const contactButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const mobileScroll = useRef(0);
  const featured = projects.filter(project => project.featured);
  const htmlMode = !desktop || fallback || featured.length < 3;
  const overlayOpen=!!panel || !!selectedProject;
  const overlayActive=useRef(overlayOpen); overlayActive.current=overlayOpen;
  const finishPreview = () => {
    transition.current?.kill(); transition.current=null;
    scene.current?.finishFlight(); flight.current=null; pendingClose.current=false;
    phase.current='idle';setPreviewPhase('idle');setPreviewFlying(false);setSelectedProject(null);
  };
  closePreviewRef.current = () => {
    if (!selectedProject || phase.current==='closing') return;
    if (phase.current==='opening') { pendingClose.current=true;return; }
    const active=flight.current, node=previewDialog.current, sheet=previewSheet.current;
    if (!active || !scene.current || htmlMode || reduced || !node || !sheet) { finishPreview();return; }
    const image=node.querySelector<HTMLImageElement>('.project-image img');
    if (!image) { finishPreview();return; }
    active.panel=sheet.getBoundingClientRect();active.hero=image.getBoundingClientRect();active.landed=false;
    phase.current='closing';setPreviewPhase('closing');
    transition.current?.kill();
    const t=gsap.timeline({onComplete:finishPreview});transition.current=t;
    t.to(node.querySelectorAll('.project-copy,.project-close'),{opacity:0,duration:.16},0);
    t.to(active,{progress:0,duration:1,ease:sheetEase},0);
  };
  useEffect(() => { document.title = `${profile.name} — Portfolio`; }, []);
  useLayoutEffect(() => {
    if (view === 'full' && index.current) {
      const context = gsap.context(() => gsap.fromTo(index.current, { opacity: 0, y: reduced ? 0 : 22 }, { opacity: 1, y: 0, duration: reduced ? 0 : 0.7, delay: reduced ? 0 : 0.2 }), index);
      return () => context.revert();
    }
  }, [view, reduced]);
  useLayoutEffect(() => {
    const node=selectedProject ? previewDialog.current : dialog.current;
    const animated=selectedProject ? previewSheet.current : dialogCopy.current;
    if (!overlayOpen || !node || !animated) return;
    const context = gsap.context(() => {
      if (selectedProject && previewFlying) return;
      gsap.fromTo(animated, { opacity: 0, y: reduced ? 0 : selectedProject ? 38 : 12 }, { opacity: 1, y: 0, duration: reduced ? 0 : 0.65, delay: reduced || selectedProject ? 0 : 0.4,ease:'power3.out' });
    }, node);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    node.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); if(selectedProject) closePreviewRef.current(); else setPanel(null); return; }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(node.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex="0"]'));
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (!first) { event.preventDefault(); node.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === node)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === node)) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { context.revert(); document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKey); if (!overlayActive.current) { const opener=returnFocus.current,id=opener?.dataset.projectId;const replacement=Array.from(document.querySelectorAll<HTMLButtonElement>('.html-card-open,.gallery-card-anchor,.index-item button')).find(button=>id && button.dataset.projectId===id);const target=opener?.isConnected ? opener : replacement ?? (view==='full' ? index.current?.querySelector<HTMLButtonElement>('button') : document.querySelector<HTMLButtonElement>('.html-card-open,.gallery-card-anchor'));target?.focus({preventScroll:true}); } };
  }, [panel,selectedProject,reduced,previewFlying]);

  useLayoutEffect(() => {
    if (!selectedProject || !previewFlying) return;
    const node=previewDialog.current, sheet=previewSheet.current, renderer=scene.current;
    if (!node || !sheet) return;
    const image=node.querySelector<HTMLImageElement>('.project-image img');
    let cancelled=false;
    const landed=() => { phase.current='open';setPreviewPhase('open');if(pendingClose.current) closePreviewRef.current(); };
    const fallbackPreview=() => { if(cancelled) return;renderer?.finishFlight();flight.current=null;setPreviewFlying(false);landed(); };
    const start=() => {
      if(cancelled || !renderer || !image || htmlMode || reduced) { fallbackPreview();return; }
      const active=renderer.beginFlight(selectedProject.id,sheet.getBoundingClientRect(),image.getBoundingClientRect(),image);
      if(!active) { fallbackPreview();return; }
      flight.current=active;
      const t=gsap.timeline({onComplete:()=>{active.landed=true;landed();}});transition.current=t;
      t.to(active,{progress:1,duration:1.25,ease:sheetEase},0);
      t.fromTo(node.querySelector('.project-copy'),{opacity:0},{opacity:1,duration:.7,ease:'power3.out'},.35);
      t.fromTo(node.querySelector('.project-close'),{opacity:0},{opacity:1,duration:.45},.5);
    };
    if(image?.complete) start(); else { image?.addEventListener('load',start,{once:true});image?.addEventListener('error',fallbackPreview,{once:true}); }
    const measure=() => { if(flight.current && image){flight.current.panel=sheet.getBoundingClientRect();flight.current.hero=image.getBoundingClientRect();} };
    const observer=new ResizeObserver(measure);observer.observe(sheet);if(image) observer.observe(image);
    node.addEventListener('scroll',measure,{passive:true});window.addEventListener('resize',measure);
    return()=>{cancelled=true;transition.current?.kill();observer.disconnect();node.removeEventListener('scroll',measure);window.removeEventListener('resize',measure);image?.removeEventListener('load',start);image?.removeEventListener('error',fallbackPreview);renderer?.finishFlight();flight.current=null;};
  },[selectedProject,previewFlying,htmlMode,reduced]);

  const openPanel = (next: Exclude<PanelMode, null>, button: HTMLButtonElement | null) => {
    returnFocus.current = button; setSelectedProject(null); setPanel(next);
  };
  const openProject: PreviewHandler = (project,opener) => {
    const flying=!htmlMode && view==='featured' && !!scene.current?.canFly(project.id);
    pendingClose.current=false;phase.current=flying?'opening':'open';setPreviewPhase(phase.current);setPreviewFlying(flying);
    returnFocus.current=opener; setPanel(null); setSelectedProject(project);
  };
  const changeView = (next: SceneMode) => {
    if (overlayOpen) return;
    if (htmlMode && next !== view) {
      if (next === 'full') { mobileScroll.current = window.scrollY; window.scrollTo({ top: 0, behavior: 'instant' }); }
      else requestAnimationFrame(() => window.scrollTo({ top: mobileScroll.current, behavior: 'instant' }));
    }
    setView(next);
  };

  return <div className={`portfolio ${htmlMode ? 'html-mode' : 'webgl-mode'} ${view === 'full' ? 'full-mode' : ''} ${overlayOpen ? 'panel-open' : ''} ${reduced ? 'reduced-motion' : ''}`}>
    <header className="site-header" inert={overlayOpen}>
      <button className="wordmark" onClick={() => changeView('featured')} aria-label="Back to featured works">{profile.name}</button>
      <button className="nav-button" ref={panelButton} onClick={() => openPanel('profile', panelButton.current)} aria-haspopup="dialog" aria-expanded={panel === 'profile'}>PROFILE</button>
    </header>

    <main id="main-content" inert={overlayOpen}>
      <h1 className="sr-only">{profile.name} — Portfolio</h1>
      {!htmlMode && <WebGallery view={view} panel={panel} previewOpen={!!selectedProject} reduced={reduced} onFallback={() => setFallback(true)} onPreview={openProject} sceneRef={scene} onEffectsFallback={()=>setEffectsFallback(true)} />}
      {htmlMode && view === 'featured' && <HtmlGallery items={featured} active={!overlayOpen} onPreview={openProject} />}
      {view === 'full' && <div className="full-index" ref={index}>
        <div className="index-heading"><span>INDEX / {String(projects.length).padStart(2, '0')}</span><span>ALL WORKS</span></div>
        <div className="index-projects" aria-label="All works index">{projects.map(project => <span className="index-item" key={project.id}>
          <button type="button" data-project-id={project.id} onClick={event => openProject(project,event.currentTarget)} aria-label={`Preview ${project.title}`}>{project.title}</button>
        </span>)}</div>
        <p className="index-note">{collection.intro}<br /><span>{collection.note}</span></p>
      </div>}
    </main>

    <footer className="site-footer" inert={overlayOpen}>
      <nav aria-label="Gallery views"><button className={view === 'featured' ? 'active' : ''} aria-pressed={view === 'featured'} onClick={() => changeView('featured')}>FEATURED</button><span className="nav-slash">/</span><button className={view === 'full' ? 'active' : ''} aria-pressed={view === 'full'} onClick={() => changeView('full')}>FULL</button></nav>
      <span className="browse-hint" aria-hidden="true">{view === 'featured' ? (htmlMode ? 'SCROLL TO EXPLORE' : 'SCROLL OR DRAG TO EXPLORE') : 'A COLLECTION OF IDEAS'}</span>
      <button className="nav-button" ref={contactButton} onClick={() => openPanel('contact', contactButton.current)} aria-haspopup="dialog" aria-expanded={panel === 'contact'}>CONTACT <span className="contact-dot" /></button>
    </footer>

    {panel && <div className={`panel ${htmlMode || effectsFallback ? 'panel-html' : ''} ${panel === 'contact' ? 'contact-panel' : ''}`} ref={dialog} role="dialog" aria-modal="true" aria-labelledby="panel-title" tabIndex={-1}>
      <div className="panel-top"><span>{profile.name}</span>{panel === 'profile' && <button className="nav-button" onClick={() => setPanel(null)} aria-label="Close panel">CLOSE <span aria-hidden="true">×</span></button>}</div>
      {panel === 'contact' && <button className="nav-button contact-close" onClick={() => setPanel(null)} aria-label="Close panel">CLOSE <span aria-hidden="true">×</span></button>}
      {(htmlMode || effectsFallback) && <div className="css-ring" aria-hidden="true" />}
      <div className="panel-copy" ref={dialogCopy}>
        {panel === 'profile' && <span className="eyebrow">A LITTLE ABOUT ME</span>}
        <h2 id="panel-title">{panel === 'profile' ? profile.title : collection.contactTitle}</h2>
        <p>{panel === 'profile' ? profile.intro : collection.contactIntro}</p>
        {panel === 'profile' && <span className="profile-note">{profile.note}</span>}
        {panel === 'contact' && profile.email && <a className="contact-email" href={`mailto:${profile.email}`}>{profile.email}<span>↗</span></a>}
        <div className="social-links">
          {profile.socials.map(social => <a href={social.href} target="_blank" rel="noopener noreferrer" key={social.label}>{social.label.toUpperCase()} ↗</a>)}
          {panel === 'profile' && profile.email && <a href={`mailto:${profile.email}`}>EMAIL ↗</a>}
        </div>
      </div>
      <span className="panel-bottom">INDEPENDENT PORTFOLIO / PERSONAL EDITION</span>
    </div>}
    {selectedProject && <ProjectPreview project={selectedProject} dialogRef={previewDialog} sheetRef={previewSheet} flying={previewFlying} phase={previewPhase} onClose={()=>closePreviewRef.current()} />}
  </div>;
}
