/**
 * Resolve lesson video URLs for the browser.
 * Uploads are stored under `/uploads/...` (relative) or legacy absolute URLs on the API host.
 * Playback must use the **current page origin** + path so Vite / reverse proxies / WAMP can serve files.
 */
function shouldRewriteUploadsToPageOrigin(url, parsed) {
  if (!parsed.pathname.startsWith('/uploads/')) return false;
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
    return `${window.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}
