import { useState, type RefObject } from 'react';
import type { Project } from './content';
import { assetUrl } from './assets';

function PreviewImage({ src, alt, first }: { src: string; alt: string; first: boolean }) {
  const [failed, setFailed] = useState(false);
  return <figure className={`project-image ${failed ? 'image-failed' : ''}`}>
    {failed ? <div className="project-image-error" role="img" aria-label={alt}>Image unavailable</div> :
      <img src={assetUrl(src)} alt={alt} loading={first ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />}
  </figure>;
}

export function ProjectPreview({ project, dialogRef, sheetRef, onClose, flying, phase }: {
  project: Project;
  dialogRef: RefObject<HTMLDivElement | null>;
  sheetRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  flying: boolean;
  phase: 'idle'|'opening'|'open'|'closing';
}) {
  const images = project.images?.length ? project.images : [project.cover];
  return <div className={`project-overlay ${flying ? 'is-flying' : ''}`} data-phase={phase} ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="project-title" tabIndex={-1}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <button className="project-close" type="button" onClick={onClose} aria-label="Close artwork preview">×</button>
    <div className="project-sheet" ref={sheetRef}>
      <div className="project-copy">
        <span className="project-eyebrow">{project.category}</span>
        <h2 id="project-title">{project.title}</h2>
        <p>{project.description || 'Description coming soon.'}</p>
        <div className="project-tags">
          {project.href && <a className="project-visit" href={project.href} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${project.title} website`}>↗</a>}
          {project.client && <span>{project.client}</span>}
          {project.year && <span>{project.year}</span>}
        </div>
        {project.source && <a className="project-source" href={project.source.href} target="_blank" rel="noopener noreferrer">Source: {project.source.label} ↗</a>}
        <span className="project-image-count">{String(images.length).padStart(2, '0')} IMAGE{images.length === 1 ? '' : 'S'}</span>
      </div>
      <div className="project-images" aria-label={`${project.title} images`}>
        {images.map((src,i) => <PreviewImage key={`${src}-${i}`} src={src} alt={`${project.title} — image ${i+1}`} first={i===0} />)}
      </div>
    </div>
  </div>;
}
