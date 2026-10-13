/// <reference types="vite/client" />

// Public assets must follow Vite's base when hosted under a Pages repository.
export function assetUrl(path: string) {
  return path.startsWith('/') && !path.startsWith('//')
    ? `${import.meta.env.BASE_URL}${path.slice(1)}`
    : path;
}
