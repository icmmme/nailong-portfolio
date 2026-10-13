import * as THREE from 'three';
import gsap from 'gsap';
import { damp, wrap, pointerPosition } from './math.mjs';
import { surfaceColumn, smooth } from './surface.mjs';
import { GalleryMotion } from './GalleryMotion';
import { PostEffects } from './PostEffects';
import type { Project } from '../content';
import { assetUrl } from '../assets';

export type SceneMode = 'featured' | 'full';
export type PanelMode = 'profile' | 'contact' | null;
export type Rect = { left: number; top: number; width: number; height: number };
export type Flight = { id: string; progress: number; panel: Rect; hero: Rect; landed: boolean };
type Mesh = THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
type Card = { mesh: Mesh; poster: THREE.Texture; label: THREE.CanvasTexture; loaded: boolean; video?: HTMLVideoElement; videoTexture?: THREE.VideoTexture; attempted: boolean; starting: boolean; visible: boolean; bounds: Rect; columns: Float64Array };

function material(map: THREE.Texture, label: THREE.Texture) {
  return new THREE.ShaderMaterial({ transparent: true, side: THREE.DoubleSide, depthTest: false, depthWrite: false,
    uniforms: { map: { value: map }, label: { value: label }, labelOpacity: { value: 1 }, white: { value: 0 }, paper: { value: new THREE.Color('#f6f5f1') }, alpha: { value: 1 }, corner: { value: .045 }, ratio: { value: 1.7 }, crop: { value: new THREE.Vector2(1, 1) }, raw: { value: 0 } },
    vertexShader: `varying vec2 vUv;varying vec3 vSurface;void main(){vUv=uv;vSurface=(modelViewMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*vec4(vSurface,1.);}`,
    fragmentShader: `uniform sampler2D map,label;uniform vec2 crop;uniform vec3 paper;uniform float white,alpha,corner,ratio,labelOpacity,raw;varying vec2 vUv;varying vec3 vSurface;
    void main(){vec2 q=abs(vUv-.5)*vec2(ratio,1.)-vec2(ratio*.5-corner,.5-corner);float d=length(max(q,0.))+min(max(q.x,q.y),0.)-corner;float edge=1.-smoothstep(-.002,.002,d);if(edge<=0.)discard;
      vec3 color=texture2D(map,(vUv-.5)*crop+.5).rgb;vec3 n=normalize(cross(dFdx(vSurface),dFdy(vSurface)));if(n.z<0.)n=-n;
      float sheen=pow(max(dot(n,normalize(normalize(-vSurface)+normalize(vec3(-.22,.8,1.)))),0.),38.);color+=vec3(.075)*sheen*(.35+.65*smoothstep(.05,.95,vUv.y))*(1.-raw)*(1.-white);
      color*=1.-(1.-smoothstep(0.,.4,vUv.y))*.6*labelOpacity;
      if(vUv.y<.425){vec4 ink=texture2D(label,vec2(vUv.x,vUv.y/.425));color=mix(color,ink.rgb,ink.a*labelOpacity);}
      color=mix(color,paper,white);gl_FragColor=vec4(color,alpha*edge);
      #include <colorspace_fragment>
    }`,
  });
}

export class PortfolioScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(53.4, 1, .1, 2000);
  private cards: Card[] = [];
  private flyer: Mesh;
  private floor: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private post: PostEffects | null = null;
  private postFailed = false;
  private observer: ResizeObserver;
  private frame = 0;
  private lastTime = 0;
  private disposed = false;
  private contextLost = false;
  private movement = new GalleryMotion();
  private motion = { gallery: 1, dim: 1, hole: 0 };
  private mouse = { x: 0, y: 0 };
  private smoothMouse = { x: 0, y: 0 };
  private width = 1;
  private height = 1;
  private halfW = 1;
  private halfH = 1;
  private cardW = 1;
  private cardH = 1;
  private gap = 1;
  private bend = 0;
  private view: SceneMode = 'featured';
  private panel: PanelMode = null;
  private previewOpen = false;
  private flight: Flight | null = null;
  private heroTexture: THREE.Texture | null = null;
  private flightX = 0;
  private reduced: boolean;
  private initialized = false;
  private scratch = new THREE.Vector3();
  private ray = new THREE.Raycaster();

  constructor(private host: HTMLElement, private projects: Project[], private anchors: HTMLElement[], reduced: boolean, private fail: () => void, onReady: () => void, private effectsFallback: () => void = () => {}) {
    this.reduced = reduced;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));this.renderer.outputColorSpace = THREE.SRGBColorSpace;this.renderer.setClearColor(0x050505, 1);
    this.renderer.domElement.setAttribute('aria-hidden', 'true');this.renderer.domElement.addEventListener('webglcontextlost', this.onContextLost);
    host.prepend(this.renderer.domElement);this.camera.position.z = 41.18;
    const loader = new THREE.TextureLoader();
    projects.forEach((project, i) => {
      const poster = this.placeholder(i), label = this.makeLabel(project);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 40, 24), material(poster, label));mesh.frustumCulled = false;this.scene.add(mesh);
      const card: Card = { mesh, poster, label, loaded: false, attempted: false, starting: false, visible: false, bounds: { left: 0, top: 0, width: 0, height: 0 }, columns: new Float64Array(41 * 4) };this.cards.push(card);
      loader.load(assetUrl(project.cover), texture => {
        if (this.disposed) { texture.dispose();return; }texture.colorSpace = THREE.SRGBColorSpace;texture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
        card.poster.dispose();card.poster = texture;card.loaded = true;if (!card.videoTexture) mesh.material.uniforms.map.value = texture;this.updateAspect(card, texture.image.width, texture.image.height);
      }, undefined, () => { /* Keep the procedural poster on failure. */ });
    });
    this.flyer = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 40, 24), material(this.cards[0].poster, this.cards[0].label));
    this.flyer.frustumCulled = false;this.flyer.visible = false;this.flyer.renderOrder = 5;this.flyer.material.uniforms.labelOpacity.value = 0;this.flyer.material.uniforms.raw.value = 1;this.scene.add(this.flyer);
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(300, 300, 48, 24), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { cell: { value: 4 }, opacity: { value: 1 }, halfW: { value: 1 } },
      vertexShader: `uniform float halfW;varying vec3 w;void main(){w=(modelMatrix*vec4(position,1.)).xyz;float s=clamp(w.x/halfW,-1.,1.);w.z-=halfW*.12*s*(1.5-.5*s*s);gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}`,
      fragmentShader: `uniform float cell,opacity;varying vec3 w;void main(){vec2 edge=abs(fract(w.xz/cell-.5)-.5)/fwidth(w.xz/cell);float line=1.-min(min(edge.x,edge.y),1.);float fade=1.-smoothstep(5.,100.,-w.z);gl_FragColor=vec4(vec3(.012),line*fade*opacity*.75);}`,
    }));this.floor.rotation.x = -Math.PI / 2;this.floor.position.z = -90;this.floor.renderOrder = -1;this.scene.add(this.floor);
    try { if (new URLSearchParams(location.search).get('effects') === 'off') throw new Error('Simplified effects requested');this.post = new PostEffects(); } catch { this.disableEffects(); }
    this.renderer.debug.onShaderError = () => { this.postFailed = true; };
    this.observer = new ResizeObserver(this.resize);this.observer.observe(host);
    document.addEventListener('visibilitychange', this.onVisibility);window.addEventListener('pointermove', this.onMouse);
    document.documentElement.addEventListener('pointerleave', this.onMouseLeave);window.addEventListener('blur', this.onBlur);
    document.fonts.ready.then(() => { if (this.disposed) return;this.cards.forEach((card, i) => { const label = this.makeLabel(this.projects[i]);card.label.dispose();card.label = label;card.mesh.material.uniforms.label.value = label; }); });
    this.resize();this.start();onReady();
  }

  private makeLabel(project: Project) {
    const canvas = document.createElement('canvas');canvas.width = 1024;canvas.height = 256;
    const ctx = canvas.getContext('2d')!, font = getComputedStyle(this.host).fontFamily;
    let size = 39, lines: string[] = [];
    do {
      ctx.font = `${size}px ${font}`;lines = [];let line = '';
      for (const word of project.title.split(' ')) {
        const next = line ? `${line} ${word}` : word;
        if (line && ctx.measureText(next).width > 850) { lines.push(line);line = word; } else line = next;
      }
      lines.push(line);if (lines.length <= 2) break;size--;
    } while (size > 22);
    ctx.fillStyle = '#ffffffb0';ctx.font = `16px ${font}`;ctx.fillText(project.category, 38, lines.length > 1 ? 143 : 167);
    ctx.font = `${size}px ${font}`;ctx.fillStyle = '#fff';lines.forEach((line,i) => ctx.fillText(line,38,lines.length > 1 ? 192 + i * 44 : 220));
    ctx.fillStyle = '#060606';ctx.beginPath();ctx.arc(954, 205, 28, 0, Math.PI * 2);ctx.fill();
    ctx.font = '26px Arial';ctx.textAlign = 'center';ctx.fillStyle = '#fff';ctx.fillText('↗', 954, 214);
    const texture = new THREE.CanvasTexture(canvas);texture.colorSpace = THREE.SRGBColorSpace;return texture;
  }
  private placeholder(i: number) {
    const canvas = document.createElement('canvas');canvas.width = 600;canvas.height = 400;const ctx = canvas.getContext('2d')!, gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, ['#627660', '#d0a570', '#a09c95', '#807092'][i % 4]);gradient.addColorStop(1, '#242628');ctx.fillStyle = gradient;ctx.fillRect(0, 0, 600, 400);
    ctx.fillStyle = '#ffffff70';ctx.font = '14px sans-serif';ctx.fillText('IMAGE / UNAVAILABLE', 24, 38);
    const texture = new THREE.CanvasTexture(canvas);texture.colorSpace = THREE.SRGBColorSpace;return texture;
  }
  private updateAspect(card: Card, width: number, height: number) { const aspect = width / height;card.mesh.material.uniforms.crop.value.set(Math.min(1.7 / aspect, 1), Math.min(aspect / 1.7, 1)); }
  private disableEffects() { this.post?.dispose();this.post = null;this.postFailed = false;this.effectsFallback(); }
  private resize = () => {
    if (this.disposed) return;
    const oldGap = this.gap;this.width = Math.max(1, this.host.clientWidth);this.height = Math.max(1, this.host.clientHeight);
    this.renderer.setSize(this.width, this.height);this.camera.aspect = this.width / this.height;this.camera.updateProjectionMatrix();
    this.halfH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * 41.18;this.halfW = this.halfH * this.camera.aspect;
    this.cardH = this.halfH * 2 * .435;this.cardW = this.cardH * 1.7;this.gap = this.cardW + this.halfW * 2 / 150;this.movement.maxInputSpeed = this.halfW * 2 * 2.5;
    if (this.initialized) { const ratio = this.gap / oldGap;this.movement.reset(this.movement.position * ratio);this.flightX *= ratio; }this.initialized = true;
    this.floor.position.y = -this.cardH / 2 - this.halfH * .06;this.floor.material.uniforms.cell.value = this.halfH * .22;this.floor.material.uniforms.halfW.value = this.halfW;this.camera.updateMatrixWorld();
    try { this.post?.resize(this.width, this.height, this.renderer); } catch { this.disableEffects(); }
  };
  setState(view: SceneMode, panel: PanelMode, previewOpen = false) {
    this.view = view;this.panel = panel;this.previewOpen = previewOpen;if (previewOpen || panel === 'profile' || view === 'full') this.movement.stop();
    gsap.killTweensOf(this.motion);gsap.to(this.motion, { gallery: view === 'featured' ? 1 : 0, dim: previewOpen && !this.flight ? .16 : 1, hole: panel ? 1 : 0, duration: this.reduced ? 0 : panel ? 1 : .75, ease: 'power3.inOut' });
    if (previewOpen || panel === 'profile' || view === 'full') this.cards.forEach(c => c.video?.pause());
  }
  setReduced(reduced: boolean) { this.reduced = reduced;this.movement.stop();this.post?.resetPointer();this.setState(this.view, this.panel, this.previewOpen); }
  private canBrowse() { return !this.previewOpen && this.view === 'featured' && this.panel !== 'profile'; }
  grab(time: number) { if (this.canBrowse()) this.movement.grab(time); }
  dragBy(pixels: number, time: number) { if (!this.canBrowse()) return;this.movement.dragBy(pixels * this.halfW * 2 / this.width, time);if (this.reduced) this.movement.position = this.movement.target; }
  release(time: number, cancel = false) { this.movement.release(time, cancel || this.reduced); }
  wheel(pixels: number, time: number) { if (!this.canBrowse()) return;if (this.reduced) this.move(pixels * 1.25);else this.movement.wheelBy(pixels, this.halfW * 2 / this.width, time); }
  move(pixels: number) { if (!this.canBrowse()) return;this.movement.nudge(pixels * this.halfW * 2 / this.width);if (this.reduced) this.movement.position = this.movement.target; }
  step(direction: number) { if (!this.canBrowse()) return;this.movement.nudge(direction * this.gap);if (this.reduced) this.movement.position = this.movement.target; }
  canFly(id: string) { const i = this.projects.findIndex(p => p.id === id);return !this.reduced && i >= 0 && this.cards[i].loaded && this.view === 'featured'; }
  hitTest(id: string, clientX: number, clientY: number) {
    const card=this.cards[this.projects.findIndex(p=>p.id===id)];if(!card?.mesh.visible)return false;
    const bounds=this.host.getBoundingClientRect();this.ray.setFromCamera(new THREE.Vector2((clientX-bounds.left)/this.width*2-1,1-(clientY-bounds.top)/this.height*2),this.camera);
    const uv=this.ray.intersectObject(card.mesh)[0]?.uv;if(!uv)return false;
    const radius=.045,qx=Math.abs(uv.x-.5)*1.7-(.85-radius),qy=Math.abs(uv.y-.5)-(.5-radius);
    return Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)<=radius;
  }
  beginFlight(id: string, panel: Rect, hero: Rect, image: HTMLImageElement): Flight | null {
    if (!this.canFly(id) || !image.complete || !image.naturalWidth) return null;
    const i = this.projects.findIndex(p => p.id === id);this.movement.stop();this.flightX = wrap(i * this.gap - this.movement.position, this.projects.length * this.gap);
    this.flight = { id, progress: 0, panel, hero, landed: false };this.heroTexture = new THREE.Texture(image);this.heroTexture.colorSpace = THREE.SRGBColorSpace;this.heroTexture.needsUpdate = true;
    this.flyer.material.uniforms.map.value = this.heroTexture;this.host.classList.add('flight-active');gsap.killTweensOf(this.motion);this.motion.dim = 1;this.motion.gallery = 1;this.motion.hole = 0;return this.flight;
  }
  finishFlight() { if(this.disposed)return;this.flight = null;this.heroTexture?.dispose();this.heroTexture = null;this.host.classList.remove('flight-active');this.flyer.visible = false;this.setState(this.view, this.panel, this.previewOpen); }
  private onMouse = (event: PointerEvent) => { if (event.pointerType === 'touch') return;const bounds = this.host.getBoundingClientRect();this.mouse = pointerPosition(event.clientX, event.clientY, bounds);if (!this.previewOpen) this.post?.pointer(event.clientX - bounds.left, event.clientY - bounds.top); };
  private onMouseLeave = () => { this.mouse = { x: 0, y: 0 };this.post?.resetPointer(); };
  private onBlur = () => { this.onMouseLeave();this.movement.stop(); };
  private onContextLost = (event: Event) => { event.preventDefault();this.contextLost = true;cancelAnimationFrame(this.frame);this.fail(); };
  private onVisibility = () => { if (document.hidden) { cancelAnimationFrame(this.frame);this.frame = 0;this.movement.stop();this.post?.resetPointer();this.cards.forEach(c => { c.video?.pause();c.visible = false;c.attempted = false; }); } else this.start(); };
  private start() { if (this.frame || this.disposed || this.contextLost || document.hidden) return;this.lastTime = performance.now();this.frame = requestAnimationFrame(this.tick); }

  private geometry(mesh: Mesh, card: Card, cx: number, flight: Flight | null, hero = false): Rect {
    const positions = mesh.geometry.attributes.position, uvs = mesh.geometry.attributes.uv;
    for (let column = 0; column < 41; column++) { const x = cx + (column / 40 - .5) * this.cardW, s = surfaceColumn(x, this.halfW, this.bend), k = column * 4;card.columns[k] = s.sin;card.columns[k + 1] = s.cos;card.columns[k + 2] = s.y;card.columns[k + 3] = s.z; }
    const p = flight?.progress ?? 0, amount = hero ? smooth(.12, 1, p) : p, dest = flight ? hero ? flight.hero : flight.panel : null;
    const projectedZ = this.scratch.set(0, 0, 0).project(this.camera).z;
    let tl: THREE.Vector3 | null = null, tr: THREE.Vector3 | null = null, bl: THREE.Vector3 | null = null;
    if (dest) { tl = new THREE.Vector3(dest.left / this.width * 2 - 1, 1 - dest.top / this.height * 2, projectedZ).unproject(this.camera);tr = new THREE.Vector3((dest.left + dest.width) / this.width * 2 - 1, 1 - dest.top / this.height * 2, projectedZ).unproject(this.camera);bl = new THREE.Vector3(dest.left / this.width * 2 - 1, 1 - (dest.top + dest.height) / this.height * 2, projectedZ).unproject(this.camera); }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let j = 0; j < positions.count; j++) {
      const u = uvs.getX(j), v = uvs.getY(j), k = (j % 41) * 4, localY = (v - .5) * this.cardH;
      let x = cx + (u - .5) * this.cardW, y = localY * card.columns[k + 1] + card.columns[k + 2], z = localY * card.columns[k] + card.columns[k + 3];
      if (tl && tr && bl) { x += (tl.x + (tr.x - tl.x) * u + (bl.x - tl.x) * (1 - v) - x) * amount;y += (tl.y + (tr.y - tl.y) * u + (bl.y - tl.y) * (1 - v) - y) * amount;z += (tl.z + (tr.z - tl.z) * u + (bl.z - tl.z) * (1 - v) - z) * amount;z += Math.sin(Math.PI * p) * this.halfH * .1 * (1 - (2 * v - 1) ** 2); }
      positions.setXYZ(j, x, y, z);const row = Math.floor(j / 41), column = j % 41;
      if (!hero && ((row === 0 || row === 24) && column % 4 === 0 || column === 0 || column === 40)) { const point = this.scratch.set(x, y, z).project(this.camera), px = (point.x + 1) * this.width / 2, py = (1 - point.y) * this.height / 2;minX = Math.min(minX, px);maxX = Math.max(maxX, px);minY = Math.min(minY, py);maxY = Math.max(maxY, py); }
    }
    positions.needsUpdate = true;mesh.geometry.boundingSphere??=new THREE.Sphere();mesh.geometry.boundingSphere.center.set(0,0,0);mesh.geometry.boundingSphere.radius=(this.halfW+this.halfH)*4;return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
  }

  private syncVideo(card: Card, project: Project, visible: boolean) {
    if (!project.video) return;if (!visible) { card.video?.pause();return; }
    if (!card.video) { const video = document.createElement('video');video.muted = true;video.loop = true;video.playsInline = true;video.preload = 'metadata';video.src = assetUrl(project.video);card.video = video;
      video.addEventListener('error', () => { card.mesh.material.uniforms.map.value = card.poster;card.videoTexture?.dispose();card.videoTexture = undefined;this.updateAspect(card, card.poster.image.width, card.poster.image.height); }); }
    if (card.starting || card.attempted || !card.video.paused) return;card.starting = true;card.attempted = true;
    card.video.play().then(() => { card.starting = false;if (this.disposed || !card.visible || this.previewOpen || this.panel === 'profile' || this.view !== 'featured' || document.hidden || this.reduced) { card.video?.pause();return; }
      if (!card.videoTexture) { card.videoTexture = new THREE.VideoTexture(card.video!);card.videoTexture.colorSpace = THREE.SRGBColorSpace; }card.mesh.material.uniforms.map.value = card.videoTexture;this.updateAspect(card, card.video!.videoWidth, card.video!.videoHeight);
    }).catch(() => { card.starting = false; });
  }

  private tick = (now: number) => {
    if (this.disposed || this.contextLost) return;const dt = Math.min((now - this.lastTime) / 1000, .05);this.lastTime = now;
    if (!this.flight) { this.smoothMouse.x = this.reduced ? 0 : damp(this.smoothMouse.x, this.previewOpen ? 0 : this.mouse.x, 4.5, dt);this.smoothMouse.y = this.reduced ? 0 : damp(this.smoothMouse.y, this.previewOpen ? 0 : this.mouse.y, 4.5, dt);this.camera.position.set(this.smoothMouse.x * .65, -this.smoothMouse.y * .5, 41.18);this.camera.lookAt(-this.smoothMouse.x * .2, this.smoothMouse.y * .16, 0); }
    this.camera.updateMatrixWorld();if (this.canBrowse() && !this.reduced) this.movement.step(dt);
    const desiredBend = this.reduced ? 0 : this.flight ? this.bend : Math.tanh(this.movement.speed * this.width / (2 * this.halfW) / 900);this.bend = damp(this.bend, desiredBend, 10, dt);
    const cycle = this.projects.length * this.gap;if (!this.flight && Math.abs(this.movement.position) > cycle * 4) { const offset = wrap(this.movement.position, cycle) - this.movement.position;this.movement.position += offset;this.movement.target += offset; }
    this.cards.forEach((card, i) => {
      const chosen = this.flight?.id === this.projects[i].id ? this.flight : null, x = chosen ? this.flightX : wrap(i * this.gap - this.movement.position, cycle), p = this.flight?.progress ?? 0;
      card.mesh.visible = chosen ? !chosen.landed : this.motion.gallery > .001 && Math.abs(x) < this.halfW + this.cardW && (!this.flight || p < .999);
      const u = card.mesh.material.uniforms;u.alpha.value = chosen ? 1 : this.motion.gallery * this.motion.dim * (1 - p);u.white.value = chosen ? smooth(.1, .75, p) : 0;u.labelOpacity.value = chosen ? 1 - p : 1;
      u.ratio.value = chosen ? 1.7 + (chosen.panel.width / chosen.panel.height - 1.7) * p : 1.7;u.corner.value = chosen ? .045 * (1 - p) + 28 / Math.max(1, chosen.panel.height) * p : .045;
      if (card.mesh.visible) { card.bounds = this.geometry(card.mesh, card, x, chosen);card.mesh.renderOrder = chosen ? 3 : 0; }
      const anchor = this.anchors[i], b = card.bounds;
      if (anchor) { const visible = card.mesh.visible && this.view === 'featured' && b.left + b.width > 0 && b.left < this.width;anchor.style.width = `${b.width}px`;anchor.style.height = `${b.height}px`;anchor.style.transform = `translate3d(${b.left}px,${b.top}px,0)`;anchor.style.visibility = visible ? 'visible' : 'hidden';anchor.tabIndex = visible && !this.panel && !this.previewOpen ? 0 : -1; }
      if (chosen && !chosen.landed) { this.flyer.visible = p > .02;this.flyer.material.uniforms.alpha.value = smooth(.02, .18, p);this.flyer.material.uniforms.ratio.value = 1.7 + (chosen.hero.width / Math.max(1, chosen.hero.height) - 1.7) * p;this.flyer.material.uniforms.corner.value = .045 * (1 - p);const crop=u.crop.value as THREE.Vector2,amount=smooth(.12,1,p);this.flyer.material.uniforms.crop.value.set(crop.x+(1-crop.x)*amount,crop.y+(1-crop.y)*amount);this.geometry(this.flyer, card, x, chosen, true); }
      const visible = card.mesh.visible && !this.previewOpen && this.panel !== 'profile' && this.view === 'featured' && !document.hidden && !this.reduced;if (visible !== card.visible) { card.visible = visible;card.attempted = false; }this.syncVideo(card, this.projects[i], visible);
    });
    if (!this.flight || this.flight.landed) this.flyer.visible = false;this.floor.material.uniforms.opacity.value = this.motion.gallery * this.motion.dim * (1 - (this.flight?.progress ?? 0));
    if (this.postFailed) this.disableEffects();
    try { if (this.post) this.post.render(this.renderer, this.scene, this.camera, dt, this.previewOpen ? 0 : this.motion.hole, this.reduced, !this.previewOpen);else this.renderer.render(this.scene, this.camera); }
    catch { this.disableEffects();this.renderer.setRenderTarget(null);this.renderer.render(this.scene, this.camera); }
    this.frame = requestAnimationFrame(this.tick);
  };
  dispose() {
    this.disposed = true;cancelAnimationFrame(this.frame);this.observer.disconnect();gsap.killTweensOf(this.motion);
    document.removeEventListener('visibilitychange', this.onVisibility);window.removeEventListener('pointermove', this.onMouse);document.documentElement.removeEventListener('pointerleave', this.onMouseLeave);window.removeEventListener('blur', this.onBlur);this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLost);
    this.cards.forEach(c => { c.poster.dispose();c.label.dispose();c.videoTexture?.dispose();if (c.video) { c.video.pause();c.video.removeAttribute('src');c.video.load(); }c.mesh.geometry.dispose();c.mesh.material.dispose(); });
    this.heroTexture?.dispose();this.flyer.geometry.dispose();this.flyer.material.dispose();this.floor.geometry.dispose();this.floor.material.dispose();this.post?.dispose();this.renderer.dispose();this.renderer.domElement.remove();this.host.classList.remove('flight-active');
  }
}
