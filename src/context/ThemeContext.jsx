import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'acua-theme';

export function ThemeProvider({ children }) {
  // index.html's inline script already set the `dark` class on <html>
  // before first paint (reading the same storage key, falling back to the
  // OS preference) — reading it back here just syncs React state to that
  // already-correct DOM state, rather than re-deriving it and risking a
  // mismatch.
  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Storage can throw in private-browsing/blocked-storage contexts —
        // the toggle still works for this page load, just won't persist.
      }
      return next;
    });
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
