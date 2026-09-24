// Lets a view keep the full-screen wave preloader up until its own first
// content has loaded, so the preloader fades straight onto a finished page
// instead of onto that view's own loading state. A view calls
// holdPreloader() while it's still loading and the returned function once
// it's done (or on unmount). Views that don't hold aren't waited on.
let holds = 0;
const listeners = new Set();

export function holdPreloader() {
  holds += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    holds -= 1;
    listeners.forEach((listener) => listener());
  };
}

export function whenPreloaderUnheld() {
  return new Promise((resolve) => {
    if (holds === 0) {
      resolve();
      return;
    }
    const check = () => {
      if (holds === 0) {
        listeners.delete(check);
        resolve();
      }
    };
    listeners.add(check);
  });
}
