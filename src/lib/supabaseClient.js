import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Loud in dev so a missing .env.local is obvious immediately, rather than
  // failing later with a cryptic network error on the first query.
  console.error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to ' +
      '.env.local and fill in your Supabase project\'s values (Project Settings > API).'
  );
}

// The anon/public key is safe to ship to the browser by design — it's
// restricted entirely by Row Level Security policies on each table.
// NEVER use the service_role key here or in any client-side code.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
