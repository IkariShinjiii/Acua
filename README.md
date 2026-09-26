# ACUA

A storefront for ACUA, a handmade coastal accessories brand hand-assembled in
Iloilo City, Philippines — a catalog of 1-of-1 and small-batch jewelry pieces,
a custom commission request/quote pipeline, patron accounts with order and
commission tracking, an admin dashboard, and an AI storefront concierge.

React 19 + Vite on the frontend, [Supabase](https://supabase.com) (Postgres,
Auth, Storage, Edge Functions) for everything server-side. There's no router —
navigation is a single `currentView` state in `src/App.jsx`.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase project's values
npm run dev
```

`.env.local` needs two values, both under **Supabase Dashboard → Project
Settings → API**:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

The anon key is safe to expose client-side — every table is locked down by
Row Level Security, not by that key's secrecy. Without these two set, the app
still renders (see `src/lib/supabaseClient.js`), but auth and every
Supabase-backed feature are inert and log an error to the console.

## Scripts

| Command           | Does what                              |
| ------------------ | --------------------------------------- |
| `npm run dev`       | Start the Vite dev server               |
| `npm run build`     | Production build to `dist/`             |
| `npm run preview`   | Serve the last `npm run build` locally  |
| `npm run lint`      | Run Oxlint                              |

## Supabase project setup

Schema lives in `supabase/migrations/`, applied in order (via the Supabase
CLI's `supabase db push`, or pasted into the Dashboard's SQL Editor for a
fresh project). It defines `profiles`, `products`, `archive_items`,
`commission_briefs`, `orders`, the RLS policies gating all of them, and a
handful of `security definer` functions (an atomic 1-of-1 "sold out" claim,
an admin-role check, a signup trigger that links a pre-auth commission brief
to the account created afterward by email).

**To make an account an admin** (admin accounts are provisioned by hand, never
self-service): sign up on the running site, confirm the email Supabase sends,
then in the SQL Editor:

```sql
update public.profiles set is_admin = true where email = 'you@example.com';
```

### Edge Functions

`supabase/functions/concierge-chat` powers the storefront's AI concierge
(Gemini-backed, public/unauthenticated by design, rate-limited server-side).
Deploy it with `supabase functions deploy concierge-chat --no-verify-jwt`, and
set its one required secret:

```bash
supabase secrets set GEMINI_API_KEY=your-key-here
```

Without that secret set, the concierge chat responds with a clear "not set up
yet" message rather than failing silently.

## Known gaps

- **Leaked Password Protection** is off in Supabase Auth — a one-click toggle
  under Authentication → Policies in the Dashboard, not something this repo
  can set for you.
- Real in-app checkout and commission deposit/balance payments (via PayMongo
  GCash) are built but not yet merged to `main` — see the
  `feature/paymongo-checkout` branch.
