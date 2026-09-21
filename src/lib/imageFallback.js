// Swaps a broken/slow-loading product photo for its fallback URL. No-ops
// when there isn't one (e.g. archive_items has no fallback column) rather
// than setting src to the literal string "undefined", which resolves to a
// real (404ing) URL and can retrigger onError in a loop.
export function handleImageError(e, fallbackUrl) {
  if (fallbackUrl && e.currentTarget.src !== fallbackUrl) {
    e.currentTarget.src = fallbackUrl;
  }
}
