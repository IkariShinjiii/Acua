import { useEffect } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Both CartDrawer and SearchOverlay declare aria-modal="true" — a promise
// to assistive tech that focus stays inside the dialog — but neither
// actually enforced it: Tab could escape to the page underneath, which is
// still visible (and, without this, still interactive) behind the
// semi-transparent backdrop. This traps Tab/Shift+Tab within the container,
// moves focus in on open, and restores it to whatever triggered the dialog
// on close, matching the standard modal dialog pattern.
export function useFocusTrap(containerRef, active) {
  useEffect(() => {
    if (!active) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;

    const previouslyFocused = document.activeElement;

    const focusables = () => Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));

    // Only moves focus in if nothing inside is already focused — several
    // callers (SearchOverlay) focus a specific element themselves right
    // after opening and shouldn't be overridden.
    if (!container.contains(document.activeElement)) {
      focusables()[0]?.focus();
    }

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', onKeyDown);
    return () => {
      container.removeEventListener('keydown', onKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [active, containerRef]);
}
