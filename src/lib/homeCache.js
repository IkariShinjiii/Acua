// The homepage's last successfully loaded data, kept for the life of the
// page. HomeView unmounts whenever another view is open, so without this,
// coming back (e.g. Back from a product) refetched everything behind a
// splash before the page could even scroll back to where the visitor was.
// Views render from here instantly and still refresh in the background.
export const homeCache = {
  pieces: null,
  archive: null,
  reel: null,
  hero: null,
};
