import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // Loud in the console either way, but never fatal: createClient() throws
  // synchronously on a missing URL, and since this module is imported from
  // main.jsx (to provide auth app-wide), that throw would blank the entire
  // site — including the homepage, which doesn't even use Supabase yet.
  // A placeholder URL keeps the client inert instead: real queries/auth
  // calls will fail (network error), but everything else still renders.
  console.error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — auth and any ' +
      'Supabase-backed features are disabled. Copy .env.example to .env.local ' +
      'locally (Project Settings > API), or set both in your host\'s environment ' +
      'variables (e.g. Vercel Project Settings > Environment Variables) and redeploy.'
  );
}

// "Remember me" on the login form controls where the session token
// physically lives, not just a preference flag: checked (the default,
// matching how the site already behaved before this existed) persists it
// in localStorage, so it survives closing the browser; unchecked keeps it
// in sessionStorage only, so it's gone the moment the tab/window closes —
// the meaningfully more private option for a shared or public device.
// supabase-js only accepts a storage adapter at client-creation time, not
// per sign-in call, so AuthContext.signIn sets this flag just before
// calling signInWithPassword, and this adapter reads it at the moment it
// actually writes the resulting session.
export const REMEMBER_ME_KEY = 'acua-remember-me';

function rememberMeIsOn() {
  try {
    return localStorage.getItem(REMEMBER_ME_KEY) !== 'false';
  } catch {
    return true;
  }
}

const hybridSessionStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key) ?? sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      if (rememberMeIsOn()) {
        localStorage.setItem(key, value);
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, value);
        localStorage.removeItem(key);
      }
    } catch {
      // Storage unavailable (private browsing, blocked, etc.) — the
      // session just won't persist across anything, same as before.
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      // Nothing to clean up if storage was inaccessible in the first place.
    }
  },
};

// The anon/public key is safe to ship to the browser by design — it's
// restricted entirely by Row Level Security policies on each table.
// NEVER use the service_role key here or in any client-side code.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  { auth: { storage: hybridSessionStorage } }
);
