// Swaps a broken/slow-loading product photo for its fallback URL.
export function handleImageError(e, fallbackUrl) {
  if (e.currentTarget.src !== fallbackUrl) {
    e.currentTarget.src = fallbackUrl;
  }
}
