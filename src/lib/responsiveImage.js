const WIDTHS = [200, 400, 600, 800];

// Unsplash resizes on the fly from its `w` query param, so the same photo
// can be offered at several widths and the browser picks the smallest one
// that's sharp enough for the slot (per the `sizes` each caller passes).
// The largest candidate is always the original URL, unchanged: never
// offering anything bigger than what the stored URL already asks for, and
// reusing the exact string other components load, so the browser serves it
// from cache instead of downloading the same photo at two sizes.
// Anything not on Unsplash (e.g. photos in Supabase Storage) returns
// undefined and the <img> just uses its plain src.
export function unsplashSrcSet(url) {
  if (!url) return undefined;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  if (parsed.hostname !== 'images.unsplash.com') return undefined;
  const originalWidth = Number(parsed.searchParams.get('w'));
  if (!originalWidth) return undefined;
  const smaller = WIDTHS.filter((w) => w < originalWidth).map((w) => {
    const sized = new URL(parsed);
    sized.searchParams.set('w', String(w));
    return `${sized.toString()} ${w}w`;
  });
  return [...smaller, `${url} ${originalWidth}w`].join(', ');
}
