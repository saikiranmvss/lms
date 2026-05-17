import { withBasePath } from './basePath.js';

/**
 * Resolve lesson video URLs for the browser.
 * Uploads are stored under `/uploads/...` (relative) or legacy absolute URLs on the API host.
 * Playback must use the **current page origin** + path so Vite / reverse proxies / WAMP can serve files.
 */
function uploadsPathname(pathname) {
  if (pathname.startsWith('/uploads/')) return pathname;
  return null;
}

function shouldRewriteUploadsToPageOrigin(url, parsed) {
  if (!uploadsPathname(parsed.pathname)) return false;
  if (url.startsWith('/')) return true;
  const h = parsed.hostname;
  const loop = h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
  if (loop) return true;
  const api = import.meta.env.VITE_API_ORIGIN?.replace(/\/$/, '');
  if (!api) return false;
  try {
    return new URL(api).hostname === h;
  } catch {
    return false;
  }
}

export function resolveLessonVideoUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (typeof window === 'undefined') return url;

  try {
    const parsed = new URL(url, window.location.href);
    if (!shouldRewriteUploadsToPageOrigin(url, parsed)) return url;
    const path = withBasePath(parsed.pathname.replace(/^\//, ''));
    return `${window.location.origin}${path}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}
