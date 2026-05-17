/**
 * Vite sets import.meta.env.BASE_URL from vite.config base (e.g. /lms/ in production).
 */

export function routerBasename() {
  const base = import.meta.env.BASE_URL || '/';
  if (base === '/') return undefined;
  return base.replace(/\/$/, '');
}

export function withBasePath(path) {
  const base = import.meta.env.BASE_URL || '/';
  const segment = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${segment}`.replace(/\/{2,}/g, '/');
}

export function getApiBaseURL() {
  const origin = import.meta.env.VITE_API_ORIGIN;
  if (origin) return `${String(origin).replace(/\/$/, '')}/api`;
  return withBasePath('api');
}
