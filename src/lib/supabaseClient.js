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

// The anon/public key is safe to ship to the browser by design — it's
// restricted entirely by Row Level Security policies on each table.
// NEVER use the service_role key here or in any client-side code.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
