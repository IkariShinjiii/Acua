# ACUA — Master Site Architecture & Detailed Plan

> This is the client-supplied definitive blueprint for the full Acua
> e-commerce application. It is the target architecture — see
> "Current implementation vs. this plan" at the bottom for how the live
> codebase compares today and what changes migrating to it would require.

## 1. Project overview & core identity

- **Brand name**: Acua (strictly "Acua" — no secondary words like "Atelier").
- **Brand identity**: high-end, handmade accessories — 1-of-1 unique
  artifacts plus repeatable collections. **Not metal jewelry**: no solid
  gold/silver, no metal casting or forging. Pieces mix synthetic and
  natural materials with premium components and non-tarnish beads/pendants
  (non-tarnish gold-tone or silver-tone alloy, not solid precious metal).
  This corrects the original blueprint text below, which described the
  brand as gold/silversmith jewelry — that was inaccurate.
- **Aesthetic**: Dribbble-inspired minimalist luxury.
- **Color palette**: warm sand/cream background (`#F9F6F0`), deep rich
  terracotta accents (`#A04723`), pure white component blocks (`bg-white`).
- **Shape & elevation**: large rounded corners (`rounded-[32px]` for major
  wrappers, `rounded-2xl` for cards), zero harsh borders, soft diffused
  drop shadows.
- **Typography**: high-end serif for display headings (Fraunces or Playfair
  Display), clean sans-serif (Inter) for body copy.

See `design.md` for the full design-system writeup, including a flagged
conflict between this single-terracotta palette and a four-color brand
board implemented in an earlier pass.

## 2. Technical stack & infrastructure

| Concern       | Choice                                                          |
| ------------- | ---------------------------------------------------------------- |
| Framework     | Next.js 16 (App Router) with TypeScript                          |
| Styling       | Tailwind CSS v4, custom CSS variables for the brand palette      |
| Animation     | Framer Motion (page transitions, marquee carousels, fade-ins)    |
| Icons         | lucide-react                                                     |
| Database/Auth | **Supabase** (Postgres, Auth, Storage) — resolved; schema in progress, see §6 |
| Deployment    | Vercel, connected to GitHub for continuous deployment            |

## 3. Directory & file structure map

```
src/
├── app/
│   ├── layout.tsx                # Root layout (fonts, global warm sand background)
│   ├── page.tsx                  # Homepage (Hero, New Arrivals Marquee, Available Grid, Archive)
│   ├── collection/
│   │   └── page.tsx              # Full dual-inventory catalog view
│   ├── commissions/
│   │   └── page.tsx              # Single-page custom commission request form
│   ├── dashboard/
│   │   └── page.tsx              # Patron / customer order & commission tracking view
│   └── admin/
│       └── page.tsx              # Restricted client admin dashboard (manage products, briefs)
├── components/
│   ├── Navbar.tsx                # Single sticky top navigation bar (logo, links, icons)
│   ├── Footer.tsx                # Terracotta bottom footer banner
│   ├── HeroSection.tsx           # Editorial hero with gradient text fade
│   ├── NewArrivalsCarousel.tsx   # Fluid review-style infinite motion marquee
│   ├── ProductGrid.tsx           # Filterable inventory grid with pill tabs
│   └── CommissionForm.tsx        # Step-by-step unboxed request form
└── lib/
    ├── concierge.ts              # Local deterministic concierge data logic
    └── mockData.ts               # Initial dual-inventory JSON products and archive data
```

## 4. Detailed component & page specifications

### A. Global layout & navigation
*(`app/layout.tsx`, `components/Navbar.tsx`, `components/Footer.tsx`)*

- **Root layout**: sets the global background to `#F9F6F0` and applies
  typography variables.
- **Navbar**: sticky top bar, transparent sand backdrop.
  - Left: links ("Shop", "Collections", "Custom Request").
  - Center: serif "ACUA" text logo (strictly no secondary branding).
  - Right: search and cart icons.
- **Footer**: full-width deep terracotta block with clean white typography
  links, copyright, and social handles.

### B. Homepage (`app/page.tsx`)

- **Hero section**: large rounded container (`rounded-[32px]`), editorial
  lifestyle image, bottom warm terracotta gradient overlay, bold display
  typography ("Tides & Time"), solid terracotta CTA button.
- **New Arrivals section**: continuous fluid horizontal motion marquee
  (Framer Motion) instead of a rigid vertical list or scrollbar — smooth
  momentum scrolling, hover-to-pause, balanced portrait aspect ratios.
- **Available Pieces section**: header titled exactly "Available Pieces";
  interactive pill filter tabs (All / Necklaces / Bracelets / Rings /
  Earrings) with terracotta active states; responsive 3-column grid of
  white cards, soft shadows, zero harsh borders, verified thumbnails.
- **The Archive section**: past sold-out 1-of-1 pieces, each with a
  "Request Similar Piece" CTA that passes its metadata straight into the
  Custom Commission form.

### C. Custom Commission form (`app/commissions/page.tsx`)

Border-free, single-page collaborative request form in clear stages:

1. **Patron Details** — full name, email, phone/Instagram handle, desired
   timeline selector.
2. **Artifact Anatomy & Materials** — accessory category pills, material
   preference (e.g. non-tarnish gold-tone alloy, natural & synthetic mix —
   see the brand identity correction in §1).
3. **Concept & Vision** — narrative text area, reference image upload.

No payment is collected at submission — see §5.1 for the full resolved
payment/auth sequence. Submitting takes the patron straight to an
account-creation/login prompt (not gated behind a quote), so the brief is
tracked from their dashboard the moment it's in.

### D. Patron dashboard (`app/dashboard/page.tsx`)

Central hub for customers and commissioners:

- **Active Purchases tab** — tracks regular e-commerce orders: processing →
  shipped → delivered.
- **Custom Commissions tab** — visual pipeline tracker:
  1. Brief Submitted
  2. Quote & Concept Approval
  3. In Production (Crafting)
  4. Final Delivery

  Each stage is driven by a specific admin action — see §5.1's pipeline
  table for the 1:1 mapping (this is where an earlier draft of the flow
  diagram was ambiguous).

  **Built** — `src/views/PatronDashboardView.jsx`, gated by real auth (any
  signed-in account; unlike AdminGate, signup is allowed here) behind the
  Navbar's Account icon (previously dead — wired to this in the same
  pass). Unlike AdminView, this one queries Supabase for real from the
  start rather than mock data first: both tabs read the patron's own rows
  (`orders`/`commission_briefs` scoped to `user_id = auth.uid()` via the
  RLS policies from §6), with a `StageTracker` dot-and-line visualization
  and proper empty states linking back to Shop / Custom Request. This only
  works because `CommissionView`'s submit handler was switched from a fake
  `setTimeout` to a real `commission_briefs` insert in the same pass —
  verified end-to-end with a live test submission, confirmed in the
  database via direct query, then cleaned up. Reference image upload to
  Supabase Storage is now wired (§6.2).

### E. Client admin dashboard (`app/admin/page.tsx`)

Secure, role-based restricted route for the business owner:

- **Commission Pipeline Manager** — review incoming briefs, send a quote,
  communicate updates, push items into production. See §5.1.
- **Order Fulfillment Center** — update tracking numbers and statuses.
- **Inventory Curation** — add new 1-of-1 artifacts, manage repeatable
  collection items, update homepage archives.

## 5. User journey flow reference

```
[Social Media Traffic (IG/TikTok)]
       │
       ├──► [Direct Product Page / Homepage] ──► [Cart] ──► [Auth Gate] ──► [Checkout] ──► [Patron Dashboard]
       │
       └──► [The Archive (Sold-Out 1-of-1)] ──► ["Request Similar"] ──► [Custom Commission Form] ──► [Auth Gate] ──► [Patron Dashboard]
```

A hand-drawn version of this flow (the "ACUA Atelier — User Flow & System
Architecture Schematic") surfaced a few gaps against the spec above. §5.1
resolves each one; treat it as the authoritative version going forward.

### 5.1 Resolved flow decisions

**Sold-out branch happens at the product page, not at "Add to Cart."**
A sold-out 1-of-1 item never renders an "Add to Cart" affordance at all —
the availability check happens where "Main Product Experience" loads, and
a sold-out item shows "Request Similar Piece" as its primary CTA in that
slot instead. (The earlier diagram showed the sold-out branch hanging off
"Add to Cart," which would let a sold-out item reach checkout.)

**"Request Similar Piece" navigates forward into the Commission form**,
pre-filled with that item's category/material metadata as a starting
point the patron can edit. (The earlier diagram's arrow read as pointing
the other way.)

**Auth timing:** the Commission form asks the patron to create an
account/log in immediately after a successful submission — before any
admin review, and before a quote exists. This is a deliberate difference
from checkout's optional guest flow: a commission is a multi-week
relationship (quote approval, production updates, delivery), which a
guest session can't reasonably persist, so an account is required rather
than optional. Regular purchases stay guest-friendly since they're a
single transaction.

**Linking a pre-auth brief to the account created afterward:** the brief
is stored against the email address already collected in "Patron
Details" (unauthenticated at that point). When the patron creates an
account or logs in immediately after, match on that email — either
auto-attach any pending briefs on account creation, or require the
signup/login email to match exactly and surface a "claim this brief"
prompt if it doesn't. Either way, this matching step needs to exist; it
wasn't specified before.

**Payment happens after the quote, not at submission.** The full sequence:

| # | Patron sees (dashboard status) | Admin does (pipeline action)              |
| - | ------------------------------- | -------------------------------------------- |
| 1 | Brief Submitted                 | Review New Brief                              |
| 2 | Quote & Concept Approval         | Send Quote (fixed price + concept sketch)     |
| 3 | *(same stage, awaiting patron)*  | *(waits for patron to approve + pay deposit)* |
| 4 | In Production (Crafting)        | Move to Production *(only after deposit clears)* |
| 5 | Final Delivery                  | Mark as Delivered *(balance collected before/at handoff)* |

A commission's price isn't known until step 2, so there's no equivalent
of checkout's "Payment Processing" step until the quote is approved — at
which point the patron pays a deposit (suggest 50%) through the same
payment processor used for regular checkout, with the balance collected
before or at delivery. This detail was simply missing from the earlier
diagram and needs to be built into the commission data model (a
commission needs its own lightweight order/payment record, distinct from
a regular e-commerce order, once step 2 completes).

### 5.3 Navbar buttons — search, cart, account, product detail

All three previously-dead navbar buttons are wired now:

- **Search** (`src/components/SearchOverlay.jsx`) — a modal over
  `AVAILABLE_PIECES`, filtering client-side by title/category/material as
  you type; selecting a result opens that product's detail page.
- **Cart** (`src/context/CartContext.jsx` + `src/components/CartDrawer.jsx`)
  — a real cart: add/remove/adjust quantity, persisted to `localStorage`
  (`acua-cart-v1`) so it survives a reload. There's no payment processor
  yet, so "checkout" is honest about that: the drawer's CTA opens a
  pre-filled `mailto:` draft listing the cart contents instead of faking a
  real checkout flow.
- **Account** — already wired in the previous pass to `PatronGate` →
  `PatronDashboardView`; unchanged here.
- **Product detail** (`src/views/ProductDetailView.jsx`) — a dedicated page
  per product (quantity selector, Add to Cart, material/shipping notes).
  Built to a generic e-commerce layout since the reference image the
  client attached couldn't be read (a session-wide image-viewing limit,
  confirmed to be independent of file size) — revisit the layout once
  they can describe or re-share it.
- Closed a gap flagged back in the flowchart review (§ before 5.1
  existed): `AVAILABLE_PIECES` items with `soldOut: true` now show
  "Request Similar Piece" instead of a live Add-to-Cart button, both on
  the grid card and the detail page — previously `soldOut` existed on the
  data but nothing read it. One item (`Woven Sand Bracelet`) is flagged
  sold out in the mock data so the path is actually reachable to test.

Verified end-to-end with a real browser: searched, opened a result, added
to cart, opened the cart drawer and confirmed the item, and confirmed the
sold-out grid card and its detail page both show "Request Similar" instead
of "Add to Cart."

## Current implementation vs. this plan

The live codebase does **not** yet match this blueprint. Concretely:

| Area          | This plan                          | What's actually in the repo today                        |
| ------------- | ------------------------------------ | ---------------------------------------------------------- |
| Framework     | Next.js 16 App Router + TypeScript  | Vite + plain React (`.jsx`, no TypeScript, no App Router)  |
| Routing       | File-based routes under `app/`      | Single `App.jsx` swapping views via `useState` — no router, no real URLs |
| Pages         | Home, `/collection`, `/commissions`, `/dashboard`, `/admin` | Home + a Commission view only; no collection, dashboard, or admin page |
| Color palette | Single terracotta `#A04723` + white cards + sand bg | Four-color brand board (Chile Rojo/Terracota/Olive/Sunset), already wired through every component |
| Data/Auth     | Supabase                            | Client installed + schema written (§6), but no project connected yet — mock arrays still in-component |
| Commission form | Redirects to auth + saves to dashboard | Simulates a submit with `setTimeout`; no auth, no persistence |

Getting from today's app to this plan is a framework migration (Vite → Next.js,
JS → TypeScript) plus four new pages and a real backend — not an incremental
tweak. Recommended sequencing once the color conflict above is resolved:

1. Scaffold the Next.js 16 + TypeScript app per the directory map in §3.
2. Port existing components (Navbar, HomeView → HeroSection/ProductGrid/
   NewArrivalsCarousel, CommissionView → CommissionForm) into the new
   structure, applying whichever palette is confirmed canonical.
3. Add `/collection`, `/dashboard`, `/admin` as new pages. `/admin` already
   has a front-end-only pass in the current Vite app (`src/views/AdminView.jsx`,
   reachable via the dev quick-switcher, no auth) — port that rather than
   rebuilding from the spec in §4E. `/dashboard` still needs building from
   scratch. Both need real auth before either is meaningfully usable.
4. Connect the Supabase project (§6) and replace the mock arrays under
   `src/data/` with real queries — they're already isolated from the
   components that render them, so this step is a swap, not a rewrite.
5. Wire the full user journey in §5 end-to-end: cart → auth gate → checkout
   → dashboard, and archive → request-similar → commission form → auth gate
   → dashboard.
6. Connect Vercel to the GitHub repo for continuous deployment.

## Current source layout (as of this reorg)

Ahead of any framework migration, the existing Vite app was reorganized so
each kind of file has one obvious home:

```
src/
├── main.jsx / App.jsx / index.css   # entry point, view switcher, global styles
├── views/                           # top-level views (HomeView, CommissionView, AdminView)
├── components/                      # shared, reusable UI (Navbar, ReviewReel, SocialIcons)
├── data/                            # mock content: products.js, archive.js, reel.js,
│                                     # commissionOptions.js, commissionBriefs.js, orders.js
│                                     # — shaped like real API responses so swapping in
│                                     # Supabase later (§6) touches these files, not the
│                                     # views that render them
└── lib/                             # supabaseClient.js + small shared helpers
```

**AdminView.jsx** (front-end only, no auth — see §4E) covers all three
sections from the spec: Commission Pipeline Management (review briefs, send
a quote, advance through production to delivery — statuses match the
patron-facing tracker via the shared `COMMISSION_STAGES` list), Order
Fulfillment Center (advance processing → shipped → delivered, auto-generates
a tracking number on ship), and Inventory & Site Curation (toggle a piece
sold out/available, add a new piece). It's reachable only via the dev
quick-switcher in `App.jsx` for now, not linked from the public Navbar.

The Archive's "Request Similar Piece" is also wired end-to-end: clicking it
on any archived item navigates to the Commission form pre-filled with that
item's category and material (via a `commissionPrefill` state lifted to
`App.jsx`), matching the resolved decision in §5.1. Availability-based
branching in "Available Pieces" (sold-out → no cart, per §5.1) is not yet
built — `AVAILABLE_PIECES` now has a `soldOut` field the admin can toggle,
but `HomeView`'s product grid doesn't yet read it.

### 5.2 1-of-1 inventory: no reservation, first-payment-wins

A 1-of-1 piece has no quantity to decrement — only one successful order can
ever exist for it. Resolved approach: **no checkout-time reservation.**
Anyone can start checkout on a 1-of-1 piece right up until a payment
succeeds for it; the item is marked sold only when a payment confirms. If
two people happen to pay for the same piece near-simultaneously (rare), the
first successful payment wins the piece and every other payment for that
same item is automatically refunded with an apology/notification.

This is simpler to build than a hold/expiry system (no background job to
release abandoned locks), traded for a small, acceptable risk of an
occasional double-sale-plus-refund on a unique item. When the backend is
built, this means: the order-write that flips a piece to `soldOut` must be
an atomic, conditional operation — implemented as the
`claim_product_if_available()` Postgres function in §6's migration, which
returns `false` (no-op) if the piece was already sold by another payment
that landed first. That `false` result is what should trigger the refund
path for the losing payment.

## 6. Backend setup (Supabase)

Status: connected to a live project; real auth wired; storefront, Patron
Dashboard, and AdminView all read/write real data now — no view left
reading `src/data/*.js` mock arrays except static UI labels
(`FILTER_TABS`, `COMMISSION_STAGES`, `ORDER_STAGES`, `commissionOptions.js`,
and the unrelated `reel.js` marquee data, which has no backing table).

- **Client**: `@supabase/supabase-js` is installed; `src/lib/supabaseClient.js`
  reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from the environment
  and exports a ready-to-use `supabase` client. It logs a clear error if
  those env vars are missing rather than failing silently.
- **Env vars**: copy `.env.example` to `.env.local` (already gitignored) and
  fill in both values from Supabase Dashboard → Project Settings → API. The
  anon key is safe to expose client-side by design (Row Level Security
  scopes it) — never put the `service_role` key in client code.
- **Schema**: `supabase/migrations/0001_init.sql` — run via `supabase db push`
  (Supabase CLI) or pasted directly into the Dashboard's SQL Editor for a
  fresh project. It implements every table this plan references:
  - `profiles` — one row per authenticated user; `is_admin` gates the admin
    dashboard (single-owner business, so a boolean is enough — no separate
    roles table).
  - `products` — the "Available Pieces" catalog; `is_one_of_one` +
    `sold_out` drive the §5.1 storefront branch.
  - `archive_items` — past sold 1-of-1 pieces; `category`/`material` seed the
    Commission form pre-fill.
  - `commission_briefs` — mirrors `COMMISSION_STAGES` from
    `src/data/commissionBriefs.js` via a Postgres enum, so the mock data's
    status values carry over unchanged.
  - `orders` — mirrors `ORDER_STAGES` from `src/data/orders.js` the same way.
  - `claim_product_if_available(product_id)` — the atomic §5.2 claim function.
  - `handle_new_user()` trigger — auto-creates a `profiles` row on signup
    *and* auto-claims any `commission_briefs` matching that email with no
    `user_id` yet, implementing §5.1's "linking a pre-auth brief to the
    account created afterward" mechanism.
  - RLS policies for all of the above: public read on products/archive,
    public insert on commission_briefs (submission happens before login),
    patrons scoped to their own rows, `is_admin` scoped to everything.
  - `0002_fix_profiles_rls_recursion.sql` — a bare `profiles`-references-
    `profiles` policy caused infinite RLS recursion (42P17); fixed with a
    `public.is_admin()` SECURITY DEFINER helper every admin policy now calls
    instead of inlining the subquery.
  - `0003_rename_metal_to_material.sql` — ACUA doesn't make metal jewelry
    (see the brand identity correction in §1); renamed `archive_items.metal`
    and `commission_briefs.metal` to `material` to match.
  - `0004_prevent_self_admin_escalation.sql` — the plain "own profile"
    UPDATE policy had no column restriction, so any signed-in user could
    have set `is_admin = true` on themselves via a direct API call. Fixed
    with column-level GRANTs: `authenticated` can update `full_name` only;
    `is_admin` is set by hand (SQL editor) exclusively.
  - `0005_advisor_fixes.sql` / `0006_revoke_execute_from_public.sql` — a
    full pass against Supabase's own security/performance advisors (run via
    direct project access, not guesswork). Found and fixed a real hole:
    `claim_product_if_available` (the §5.2 atomic sold-out claim) had no
    execute restriction at all — anyone, signed in or not, could call it
    via `/rest/v1/rpc` and mark any product sold out with zero payment
    involved. Revoked execute on it and on the `handle_new_user` trigger
    function for both `anon` and `authenticated`, **and** from `PUBLIC` —
    the first revoke alone did nothing, since Postgres grants execute to
    `PUBLIC` by default at function creation and every role inherits that
    regardless of a revoke aimed at the named role. Verified with
    `has_function_privilege()` before and after, not just by re-reading the
    advisor. Also fixed the standard RLS performance set: added the 3
    missing foreign-key indexes, wrapped `auth.uid()` calls in
    `(select ...)` so Postgres evaluates them once per query instead of
    once per row, and merged duplicate permissive SELECT policies (an
    admin-sees-all policy stacked on top of an own-row/public-read policy)
    into one per table. `is_admin()` itself stays executable by
    anon/authenticated — that one's flagged too, but it's required: RLS
    policies invoke it under the calling role, so revoking it would break
    every policy that uses it. One advisory item is a dashboard toggle, not
    SQL — **Leaked Password Protection** is off; enable it under
    Authentication → Policies in the Supabase dashboard.
- **Auth**: real email/password auth is wired —
  `src/context/AuthContext.jsx` tracks the Supabase session and the
  matching `profiles` row (exposing `user`, `profile`, `isAdmin`, `signUp`,
  `signIn`, `signOut`), and `src/components/AuthForm.jsx` is a reusable
  login/signup form in the site's own style. `AdminView` is now gated for
  real in `App.jsx`'s `AdminGate`: logged out → login form (signup hidden —
  admin accounts are provisioned by hand, never self-served); logged in but
  not `is_admin` → an explicit "not an admin" message with a log-out
  option; `is_admin` → the real dashboard. This project requires email
  confirmation on signup (verified directly against the live project), so
  the login-success and patron-signup paths still need a real inbox to
  test end-to-end — automated verification covered everything short of
  that (wrong-credentials error path, the gate's three states, no console
  errors).
- **To make your own account an admin**: sign up on the running site with
  your real email, confirm it via the email Supabase sends, then run this
  in the SQL Editor (replace the email):
  ```sql
  update public.profiles set is_admin = true where email = 'you@example.com';
  ```
- **Not yet done**: payment flows (deposit/checkout is still an honest
  `mailto:`/manual-confirmation stand-in — see §5.3), reference image
  upload to Supabase Storage for commission briefs, and real product
  photos/prices for anything beyond the initial seed (§6.1 explains why
  that content-gathering stalled).

### 6.1 Storefront + AdminView wired to real data

Everything that used to read `src/data/products.js` / `archive.js` /
`commissionBriefs.js` / `orders.js` mock arrays now reads Supabase directly:
`HomeView`, `SearchOverlay`, `ProductDetailView`, and every tab of
`AdminView` (`CommissionPipeline`, `OrderFulfillment`, `InventoryCuration`).
`src/lib/mapProduct.js` holds the two mapping functions
(`mapProductRow`/`mapArchiveRow`) that translate a Supabase row
(snake_case, `price_cents`) into the shape every view was already built
against (camelCase, a formatted price string) — the fetch is the only
thing that changed in each view, not the rendering logic.

The original mock catalog was seeded into the real tables verbatim
(`supabase/seed.sql`) so the storefront isn't empty. `products.js` and
`archive.js` are gone now except for `FILTER_TABS` (a static UI constant,
kept in `products.js`), since nothing else in them was still referenced
once every view read from Supabase.

**A real bug this surfaced**: `COMMISSION_STAGES` had hyphenated ids
(`'brief-submitted'`) while the actual Postgres enum uses underscores
(`'brief_submitted'`) — `PatronDashboardView` (built the prior pass) was
comparing a real brief's status against these ids and silently always
falling back to index 0, i.e. every real commission would have shown
"Brief Submitted" regardless of its actual stage. Fixed by making
`COMMISSION_STAGES`/`ORDER_STAGES` hold only the enum-matching ids
(deleted `COMMISSION_BRIEFS`/`ORDERS`, the mock data arrays, since nothing
referenced them anymore once AdminView stopped importing them).

**Also fixed**: `handleImageError` would set `img.src` to the literal
string `"undefined"` (a real, 404-ing URL) when no fallback exists —
`archive_items` has no fallback-image column, so every archive card's
`onError` was hitting this. Hardened the shared helper to no-op without a
fallback instead of patching each call site.

Verified end-to-end against the live database, not just the UI: seeded
data renders on the real homepage; submitted a fresh brief through the
live form, sent it a quote as a real (temporarily-promoted, since-reverted)
admin account through the actual AdminView UI, and confirmed both the
brief's new status/quote and a separate "mark sold out" toggle landed in
Postgres via direct query — then cleaned up every piece of test data
(brief, sold-out flag, admin flag) afterward.

The cart's `localStorage` key was bumped to `v2` since product ids moved
from static strings (`'ap-1'`) to real Supabase UUIDs — a cart saved under
the old scheme would otherwise point at ids that no longer exist.

Two dead file groups were removed as part of this pass: `CommissionForm.jsx`/
`ProductCarousel.jsx` (unused duplicate/experimental components) and an
entire unreachable Next.js scaffold at the project root (`app/`, root-level
`components/`) left over from the very first commit, before the project
pivoted to this Vite app — it had no `next` dependency installed and nothing
in the build pointed to it. Removing it also shrank the CSS bundle (Tailwind
had been scanning those dead files for class names).

### 6.2 Commission reference image upload (Supabase Storage)

Migration `0007` adds a private `commission-references` bucket plus three
`storage.objects` policies matching the same trust model as the
`commission_briefs` table itself: anyone can INSERT (a brief is submitted
before any auth gate), only `is_admin()` can SELECT or DELETE (AdminView is
still the only place these are ever displayed).

`CommissionView.jsx`'s `handleFiles` was retaining only a derived
`name`/`size`/`preview` (a blob URL) per dropped file — the actual `File`
object needed for `storage.upload()` was discarded. Fixed by keeping the raw
`file` alongside those fields, and `removeFile` now revokes the blob URL it
created to avoid leaking memory.

The brief's `id` is generated client-side (`crypto.randomUUID()`) *before*
either the upload or the insert, rather than inserting first and reading the
new row's id back — an anonymous submitter has no SELECT access to their own
row under the "Users can view their own briefs" RLS policy
(`auth.uid() = user_id OR is_admin()`, which a null `user_id` never
satisfies), so `.insert(...).select().single()` failed with an RLS
violation the first time this was tried. Uploading first and inserting once
with `reference_image_urls` already populated also sidesteps the fact that
briefs can only be *updated* by an admin — an anonymous patron has no way to
attach paths after the fact anyway.

`AdminView.jsx`'s `CommissionPipeline` now renders actual thumbnails instead
of a bare image count: a `useEffect` keyed on `briefs` batch-requests signed
URLs (`createSignedUrls`, 1hr expiry) for every brief with reference images,
since the bucket is private and a public URL would 403.

Verified end-to-end against the live project: submitted a brief through the
real form with an attached test image (Playwright + a synthetic PNG),
confirmed the row and storage path in Postgres directly, then logged into
AdminView as a temporarily-created confirmed admin account and confirmed the
thumbnail actually rendered (a real signed `storage/v1/object/sign/...` URL,
zero console errors) — then deleted the storage object, the test brief, and
the test admin account.

### 6.3 Design-system consolidation, a11y fix, security hardening, bundle split

A self-directed pass (no client material needed) covering frontend, backend,
and design-system work in one sitting:

- **Palette conflict resolved.** `design.md` now names the four-color brand
  board canonical over the single-terracotta spec — see the "Color palette"
  section there for the full reasoning.
- **~250 hard-coded hex colors tokenized.** `tailwind.config.js` already
  defined tokens for `#1d1c16`, `#57423b`, `#f8f3ea`, `#f2ede4`, `#ece8df`,
  and `#dec0b7` (plus a new `sand` DEFAULT added for `#F9F6F0`), but almost
  every component used the raw hex directly instead of the token. Replaced
  every occurrence across 12 files with the matching token class —
  byte-identical rendering (same hex values), verified via build + the
  bundled mechanical detector + before/after screenshots of Home and
  Commission.
- **A11y fix**: the commission form's remove-attachment button had no
  `aria-label` and a ~22px hit target (below the 44px touch-target
  guideline). Added the label and enlarged the hit area.
- **Backend security hardening**: Supabase's advisor flagged
  `public.is_admin()` as directly callable via `/rest/v1/rpc/is_admin` by
  anyone, signed in or not — it's a `SECURITY DEFINER` function meant only
  for internal use inside RLS policies, never a public endpoint. Migration
  `0008` moves it to a new `private` schema (not exposed by PostgREST) and
  repoints all 16 policies that referenced it to the fully-qualified name;
  RLS evaluation happens inside Postgres itself, so policies keep working
  even though the schema isn't API-exposed. Verified via a real signed-in
  session (not just admin SQL access): anon storefront reads still work,
  an admin account still sees all commission briefs/orders through RLS, and
  `supabase.rpc('is_admin')` now 404s instead of executing.
- **Real functional gap fixed**: the commission upload box's own copy
  promised "JPEG, PNG, HEIC or sketches up to 15MB each," but nothing
  enforced it — the `accept=""` attribute only filters the native file
  picker, not drag-and-drop, so an oversized file or an arbitrary file type
  dropped onto the box would silently attempt to upload. `CommissionView`
  now validates both type (MIME sniff with an extension fallback, since
  some browsers report no MIME type for HEIC) and the 15MB cap on every
  file, client-side, before it's ever added to the form. A submitted brief
  also now tells the patron in the confirmation screen if any of their
  attachments failed to upload, instead of silently dropping them.
- **Bundle-size warning addressed** (partially): `AdminView` and
  `PatronDashboardView` are now `React.lazy`-loaded behind their respective
  auth gates instead of bundled into the main chunk every anonymous
  storefront visitor downloads — real chunks now split out
  (`AdminView-*.js` ~17KB, `PatronDashboardView-*.js` ~5KB gzipped ~4.5KB
  and ~2KB respectively). The main chunk is still >500KB; the remainder is
  `framer-motion` and `@supabase/supabase-js`, both genuinely needed by the
  public storefront itself, so further code-splitting wasn't pursued in
  this pass.

Verified via a single combined Playwright pass: oversized-file rejection,
wrong-file-type rejection, a valid file still accepted cleanly, a full brief
submission with a real upload, and both `AdminGate`/`PatronGate` rendering
correctly through their new lazy boundaries — zero console errors. All test
data (brief, storage object, two temporary admin accounts used across the
RLS-migration smoke test and the cleanup pass) deleted afterward.

**Still open, still blocked on the client**: real payment integration
(needs a provider decision), the real product catalog (needs
photos/prices), and the product detail page layout (needs the reference
image that was never viewable this session).

### 6.4 One-of-one cart cap, cart/search a11y parity, reduced motion

Another self-directed pass, found while looking for more standalone work:

- **Real business-logic bug fixed**: `products.is_one_of_one` was mapped
  from Supabase (`mapProduct.js`) but never actually read anywhere — a
  patron could add quantity 2+ of a one-of-one piece from
  `ProductDetailView`, or increment it past 1 in `CartDrawer`, despite
  §5.2's first-payment-wins model meaning only one unit will ever exist to
  fulfill. Fixed at the source of truth (`CartContext`'s `addItem` and
  `setQuantity` now cap at 1 for `isOneOfOne` products) and in the UI
  (quantity stepper hidden entirely on the product page and in the cart
  drawer for those pieces, plus a small "One of one — once it's gone, it's
  gone" badge on the product page). No product in the seeded catalog is
  currently flagged this way, so this was unreachable in practice today —
  it protects the real 1-of-1 catalog once the client's actual products
  (some of which are meant to be 1-of-1, per the brand's two-product-line
  positioning) replace the seed data.
- **A11y parity fix**: `SearchOverlay` already closed on Escape and had
  focus management; `CartDrawer` had neither. Added the same Escape-key
  handler, plus `role="dialog"` / `aria-modal` / `aria-label` to both
  overlays.
- **`prefers-reduced-motion` support**: nothing in the app respected it
  despite Framer Motion being used everywhere (page transitions, the
  ReviewReel marquee, fade-ins). Wrapped the app root in
  `<MotionConfig reducedMotion="user">` (`main.jsx`) — a single change that
  makes every Framer Motion animation in the app respect the OS-level
  setting, rather than patching each component individually.

Verified with a combined Playwright pass: a `reducedMotion: 'reduce'`
browser context loads with zero errors; a product temporarily flagged
`is_one_of_one` (seed data has none yet) correctly hides its quantity
stepper, caps at 1 in the cart, and hides the cart's own "+" button;
Escape closes the cart drawer. The temporary flag was reverted immediately
after the test.

### 6.5 "Request Similar" prefill: two real, confirmed data bugs

Tracing every call site of `onRequestSimilar` (HomeView's sold-out grid
button, HomeView's Archive section, ProductDetailView's sold-out state)
into `CommissionView`'s `prefill` prop turned up two bugs that were both
live in production right now, not hypothetical:

- **Copy accuracy**: the prefill banner and the auto-filled narrative
  always said "from The Archive," regardless of whether the piece actually
  came from Archive (past, sold, 1-of-1 creations) or was simply a
  currently sold-out item in Available Pieces. Each call site now tags its
  payload with `source: 'catalog' | 'archive'`, and `CommissionView` picks
  the right label.
- **Material mismatch (confirmed reachable today)**: `archive_items.material`
  intentionally holds a `MATERIAL_OPTIONS` id (per the comment in
  `seed.sql`), but `products.material` holds free descriptive text for the
  storefront card — e.g. the currently sold-out "Woven Sand Bracelet" has
  `material = "Non-Tarnish Gold-Tone Beads & Waxed Cord"`. Clicking
  "Request Similar" on it fed that raw string straight into
  `formData.material`, which matched none of the three `MATERIAL_OPTIONS`
  ids — every material card would silently show as unselected, directly
  contradicting the banner's claim that material was pre-filled.
  `CommissionView` now validates `prefill.material` against the known ids
  before trusting it; when it doesn't match (i.e. it came from a product,
  not an archive item), it falls back to the default material id and
  folds the real description into the narrative instead
  (`"...(similar material: Non-Tarnish Gold-Tone Beads & Waxed Cord) — "`)
  so the information isn't lost.

Verified against the real, currently sold-out "Woven Sand Bracelet" and a
real Archive tile via Playwright: correct source label for each, exactly
one material card selected in both cases (never zero), and the fallback
narrative text reads correctly.

### 6.6 One-of-one gap in the Available Pieces grid (user-reported)

The user reported, after 6.4's cart-cap fix: "at the available pieces part
the items that are 1 of 1 doesn't have a label then u can add it multiple
times... to the cart." 6.4 only touched `ProductDetailView` and
`CartDrawer` — the `HomeView` grid card (the actual "Available Pieces"
section) had neither a "1-of-1" badge nor any indication once a one-of-one
piece was already in the cart, so its quick-add "+" button kept inviting
more clicks even though `CartContext.addItem` was already silently
no-op'ing them. That silent no-op, with no visual change, is exactly what
reads as "you can add it multiple times" even though the cart's real
quantity never moved.

Fixed:
- Added a small "1-OF-1" badge to the grid card's thumbnail (top-left,
  matching the Archive section's own badge styling), shown whenever
  `piece.isOneOfOne` and not sold out.
- Once a one-of-one piece is already in the cart, its quick-add button is
  now replaced by a permanent "already in your cart" checkmark indicator
  instead of reverting back to a clickable "+" after the momentary
  "Added" animation — so the UI stops implying another click would do
  anything.
- **Defensive fix**: `CartContext.readStoredCart()` now clamps any
  already-persisted one-of-one item down to quantity 1 on load. The
  addItem/setQuantity caps from 6.4 only guarded new writes — a cart that
  had already accumulated quantity > 1 for a one-of-one piece before that
  fix landed (or from any other bug) would otherwise stay stuck that way
  indefinitely in the user's own browser storage.

Verified with a temporarily re-flagged seed product (still none in the
live catalog are marked one-of-one) via Playwright: badge renders, the
quick-add button correctly becomes a permanent "in cart" indicator after
one click, the cart drawer shows quantity 1 (not 3) at the right subtotal,
and a simulated pre-existing corrupted cart (quantity 3, written directly
to localStorage) is clamped back to 1 on the next page load. Flag reverted
after.

### 6.7 Admin had no way to actually set is_one_of_one

Found while looking for more standalone work: every fix in 6.4–6.6 assumed
an admin could flag a piece as one-of-one, but `AdminView`'s "Add New
Piece" form and each existing piece's card had no such control anywhere —
the only way to ever set `products.is_one_of_one` was a raw SQL `UPDATE`,
which isn't something the actual business owner using this dashboard can
do. The whole cart-cap/badge system built over the last two passes was
unreachable in practice without this.

Added:
- A "This is a 1-of-1 unique piece" checkbox in the Add New Piece form,
  wired into the insert.
- A "1-of-1" badge on each existing piece's thumbnail in the Inventory tab
  (same styling as the storefront's own badge), and a second toggle button
  next to "Mark Sold Out" / "Mark Available" so admins can flag or unflag
  any existing piece after the fact too.

Verified end-to-end as a real (temporarily-provisioned, since-removed)
admin account: added a test piece with the checkbox checked, confirmed the
badge and toggle button reflected `is_one_of_one = true`, toggled it back
off, and confirmed the database row updated correctly both times before
cleaning up the test piece and account.

### 6.8 "The Archive" had zero admin management — new tab added

Found while continuing to look for standalone work: `archive_items` (the
storefront's "The Archive" section, past 1-of-1 creations, feeds "Request
Similar Piece") had no admin UI at all — `AdminView` never queried or
rendered it. The only way to add, edit, or remove an Archive piece was a
raw SQL statement, which isn't something the business owner using this
dashboard can run.

Added a fourth AdminView tab, **The Archive**, with:
- A grid of existing archive pieces (thumbnail, title, category, resolved
  material label) with a **Remove** button (confirms before deleting).
- An **Add Archive Piece** form — title, a category `<select>` constrained
  to `JEWELRY_CATEGORIES`, a material `<select>` constrained to
  `MATERIAL_OPTIONS` ids, image URL, optional alt text.

The category/material fields are constrained dropdowns rather than free
text specifically because §6.5 already found what happens when
`archive_items`/`commission_briefs` expect an exact enum-like value and get
arbitrary text instead (the material-mismatch bug) — building the same
mistake into the one form that writes this table would have undone that
fix. Every Archive piece is inherently one-of-one already (that's what
"past creation, sold, kept for inspiration" means), so there's no separate
`is_one_of_one` toggle here the way there is in Inventory.

Verified end-to-end as a real (temporarily-provisioned, since-removed)
admin account against the live database: the 4 real seeded Archive pieces
listed correctly, added a real test piece through the form (confirmed it
appeared in both the UI and Postgres), removed it through the UI's Remove
button, and confirmed via direct query that the table was back to exactly
4 rows with zero leftovers.

### 6.9 Real admin account provisioned + forgot/reset password flow

The client asked for a real, permanent admin account (`acuavibe@gmail.com`)
and, having noticed there was no way to recover a forgotten password, asked
for that to be built and verified.

**Account**: created directly via SQL (the standard provisioning path noted
throughout §6 — admin accounts are never self-signup), email pre-confirmed,
`profiles.is_admin = true`. Credentials handed to the client directly in
chat, not committed anywhere.

**Forgot/reset password** — the app has no router (everything is
`currentView` state in `App.jsx`), which shapes the whole implementation:
- `AuthContext` gained `requestPasswordReset(email)` (wraps
  `resetPasswordForEmail`, `redirectTo` pointed at the site root since
  there's nowhere else to send it), `updatePassword(password)` (wraps
  `updateUser`), and a `passwordRecovery` boolean flipped to `true` by a
  `PASSWORD_RECOVERY` event from `onAuthStateChange` — the only signal
  available that a visitor just followed a reset-password email link
  (Supabase's client parses the recovery token out of the URL fragment on
  load and re-authenticates them under a special recovery session).
- `AuthForm.jsx` gained a `'forgot'` mode: a "Forgot password?" link under
  the password field in login mode, a dedicated email-only view, and a
  "check your email" confirmation state.
- `App.jsx` gained `ResetPasswordGate` — when `passwordRecovery` is true,
  it overrides the *entire* screen (regardless of `currentView`) with a new
  Set a New Password form, since there's no dedicated route to land the
  visitor on instead.

**Verified, with an explicit limit on how far that verification could go**:
confirmed `requestPasswordReset` succeeds against the real
`acuavibe@gmail.com` account (a request-only call — it queues an email, it
doesn't touch the password, so this was safe to run against the real
account); confirmed the forgot-mode UI correctly hides the password field
and returns to login; and, using a disposable test account (never the real
one), confirmed `updatePassword` genuinely rewrites the stored password —
the old one was rejected and the new one worked on a fresh login
afterward. What could **not** be verified end-to-end: actually clicking a
real emailed link, since that requires a real inbox. That last mile
depends on Supabase's Auth "Site URL" / redirect-URL allowlist being
configured for the production domain — a dashboard setting outside what
SQL or the available MCP tools can read or change (see §6's earlier note
on the same limitation). If the reset email arrives but the link 404s or
lands somewhere unexpected, that setting is the first thing to check.

## 7. Light / dark mode

Full-site theming, added on request, plus a toggle in the navbar.

**Approach**: the neutral/surface tokens (`sand`, `on-surface`,
`on-surface-variant`, `surface-container-low/DEFAULT/high`, `outline-variant`,
and a new `surface-elevated` token) were converted from flat hex in
`tailwind.config.js` to `rgb(var(--color-x) / <alpha-value>)`, with the
actual values defined once under `:root` (light) and `.dark`
(`src/index.css`) — the `<alpha-value>` placeholder is what keeps every
existing `/NN` opacity modifier (`bg-surface-container-low/80`,
`text-on-surface/40`, etc.) working unchanged. That one change makes every
one of the ~350 existing call sites across the app theme-aware without
touching them individually — a `dark:` variant on each would have meant
editing every file that uses these tokens. Brand accent colors (chile-rojo,
terracota, olive, sunset) deliberately stay flat hex and unchanged between
themes — they're brand identity, not surface/text neutrals, and read fine
against both.

`surface-elevated` is new: cards were using raw `bg-white` (42 occurrences)
for their "elevated card" surface, which — unlike the neutrals above —
isn't a token at all, just Tailwind's built-in `white`. Converting `white`
itself would have been wrong (`text-white` on colored buttons, hero-image
overlay text, etc. must stay literally white in both themes). Instead, the
~40 *specifically card/input-surface* occurrences (`bg-white`,
`focus:bg-white`, `hover:bg-white`, `hover:bg-white/80` — never
`text-white`, `border-white`, or the two decorative `bg-white/20` divider
lines in `App.jsx`'s dev nav bar) were converted to the new token via a
scripted, reviewed pass across the 7 files that had them.

`index.html` had its own hardcoded `bg-[#F9F6F0] text-[#1d1c16]` on
`<body>`, predating the JSX-only hex-tokenization pass in §6.3 (which never
scanned this file) — fixed to `bg-sand text-on-surface`, and it also gained
a small blocking inline `<script>` in `<head>` that adds the `.dark` class
before any paint, so there's no flash of the wrong theme on load.

**Default is always light, never the OS preference** (changed on request
after the initial ship, which had followed `prefers-color-scheme` for a
first-time visitor). The inline script now only checks
`localStorage.getItem('acua-theme') === 'dark'` — nothing saved means
light, full stop, regardless of the visitor's OS setting. Dark only turns
on once someone explicitly uses the navbar toggle, and *that* choice is
what persists on their next visit. Verified with Playwright contexts
forcing both a dark and a light OS `colorScheme`: both land on light by
default, and an explicit toggle to dark still survives a reload even
under a dark OS preference.

**`ThemeContext`** (`src/context/ThemeContext.jsx`) reads that already-set
`.dark` class into React state on mount (rather than re-deriving it and
risking a mismatch with what the inline script decided), and
`toggleTheme()` flips the class, updates state, and persists the explicit
choice to `localStorage` (`acua-theme`) — once toggled, that choice is
always honored; it doesn't reactively follow further OS-level changes,
which matches ordinary manual-toggle behavior.

**Toggle placement**: `Navbar.jsx`, in the icon cluster next to Search /
Cart / Account — visible at every breakpoint (unlike Search/Account, which
are desktop-only) since it's compact enough to sit next to the mobile
hamburger button too, giving mobile visitors direct access without opening
the menu. Sun/Moon icon from `lucide-react`, `aria-label` describing the
action that will happen (e.g. "Switch to dark mode" while in light mode).

Verified end-to-end with Playwright: light mode renders pixel-identical to
before this change (same hex values, just resolved through variables now);
toggling adds/removes the `.dark` class and persists to `localStorage`;
reloading the page keeps the chosen theme with no flash (confirmed via
screenshot immediately after reload); the Commission form's cloud-card,
inputs, and category/material selection all read correctly in dark mode;
toggling back to light round-trips cleanly. Real screenshots of both
themes on the storefront and the Commission form were reviewed directly,
not just asserted via selectors.

**Known limitation, not addressed this pass**: `shadow-cloud-*` /
`shadow-input-inset` are hardcoded `rgba(38, 28, 20, ...)` — a dark shadow
meant to read against a light card. In dark mode these are still applied
but contribute little visible elevation cue against an already-dark
background (harmless, just a minor loss of depth). Making shadows
theme-aware too would need the same CSS-variable treatment applied to
`boxShadow` values in `tailwind.config.js` — straightforward if wanted, just
out of scope for this pass.

### 7.1 Dark-mode contrast regression found and fixed: `text-chile-rojo`

Self-directed QA pass on §7 right after shipping it, using the standard
WCAG relative-luminance contrast formula computed for every real
text/background pairing in both themes (not just eyeballing screenshots).
Every neutral pairing (`on-surface`/`on-surface-variant` on any
`surface-*`/`sand` background) came back well above AA (7.6:1–15.8:1) in
both themes — the CSS-variable approach held up. `text-chile-rojo`,
however, did not: it's used everywhere as small foreground text and icons
(error banners, active nav links, "Request Similar" links, the upload
box's "Click to select files") on top of the page's own background, and
while that reads at 5.4–5.8:1 against the light theme, chile-rojo is dark
enough itself that it drops to **~2.8–3.0:1** against the new dark
surfaces — a real accessibility regression introduced by §7, not a
pre-existing issue.

Fixed with a new theme-aware `accent` token (`rgb(var(--color-accent) /
<alpha-value>)`): light mode keeps flat chile-rojo (`174 67 30`, already
fine), dark mode uses a brightened `255 128 88` (`#FF8058`) tuned to clear
4.5:1 against *every* dark surface token, including the tightest real
case — the 10%-opacity tint error banners use for their background
(`bg-chile-rojo/10`), where blending a small amount of foreground color
into an already-dark background barely lifts the contrast at all. `bg-
chile-rojo` (buttons, always paired with `text-white` on top) is
untouched — that pairing was never affected by the page background and
holds at 5.8:1 in both themes. Every `text-chile-rojo` call site
(`text-`, `hover:text-`, `group-hover:text-` — 51 occurrences across 10
files) was mechanically converted to `text-accent`; verified computationally
(4.7–7.2:1 across all dark surfaces afterward, all comfortably above AA)
and visually (a real dark-mode screenshot of the Commission form).

**Noted but explicitly out of scope**: `text-terracota`, `text-olive`, and
`text-sunset` also fail AA as foreground text in **light mode**
(2.75–3.34:1) — but that's pre-existing, not something §7 introduced or
regressed, so it wasn't touched in this pass. Worth a dedicated look if
asked, separate from the dark-mode work.

## 8. UI improvement pass

Self-directed audit for standalone frontend value, independent of the
theming/auth work above. Four real, confirmed issues:

- **Mobile visitors had no way to search or reach their account at all.**
  The Search and Account icon buttons in the navbar are `hidden
  md:inline-flex` — desktop-only, not just visually deprioritized on
  mobile — and the mobile hamburger drawer only ever listed Shop /
  Collections / Custom Request. There was no path to `onOpenSearch` or
  `onAccountClick` on a phone whatsoever, meaning no mobile visitor could
  search the catalog or log in / view their orders and commissions. Fixed
  by adding "Search" and "My Account" entries to the mobile drawer, wired
  to the same handlers the desktop icons use.
- **The "LOAD MORE" button did nothing it claimed to.** `HomeView`'s
  Available Pieces grid renders every fetched product with no
  slicing/pagination anywhere in the code — the button's `onClick` just
  called `setActiveFilter('All')`, which is either a no-op (if "All" was
  already selected) or silently resets the category filter a patron could
  already change via the filter pills above it. Since there's nothing
  currently held back to reveal, and building real pagination for a
  6-product catalog would be solving a problem that doesn't exist yet, the
  button was removed rather than half-fixed. Worth revisiting once the
  real catalog (§ replacing seed data, still pending on the client) is
  large enough that pagination is a genuine need.
- **`alert()` for every admin error, 7 call sites.** A native browser
  dialog blocks the entire page and looks jarring against a dashboard with
  its own cloud-card design system. Replaced with a proper in-page toast
  (`src/components/Toast.jsx` + a `useToast` hook): a dismissible,
  auto-expiring (4.5s) notification matching the app's visual language,
  threaded through `CommissionPipeline`, `OrderFulfillment`,
  `InventoryCuration`, and `ArchiveCuration` via a `showToast` prop from
  the `AdminView` root. Success paths, which previously gave the admin no
  feedback at all beyond the form silently closing, now also show a brief
  confirmation ("Quote sent.", "Marked sold out.", "'X' added to The
  Archive.").
- **Missing `loading="lazy"` on below-the-fold images.** Added to the
  Available Pieces grid, the Archive grid, and Search results — genuinely
  off-screen image sets a visitor may never scroll to. Deliberately *not*
  added to `ProductDetailView`'s primary image (above-the-fold, would hurt
  LCP) or `ReviewReel`'s marquee (visible immediately on page load).

Verified live: a real mobile-viewport (390×844) Playwright session opened
the drawer, reached Search and "My Account" through it, and confirmed both
actually opened; confirmed "LOAD MORE" no longer renders; confirmed the
lazy `loading` attribute is present via computed DOM properties (not just
markup text) on all 6 grid images; and, as a real signed-in admin,
confirmed a toast (not a native dialog) appears on a real Supabase write
with the correct message. One mistake in that same verification pass: an
ambiguous `Mark Sold Out`/`Mark Available` button-text match in the test
script toggled the wrong two seed products — caught via direct DB query
immediately after and corrected back to the original seed state (Woven
Sand Bracelet sold out, Solitary Tidal Ear Cuff available) before finishing.

## 9. Dark-mode bug: hero photo washed out white (user-reported)

The client reported the hero looking "too bright" in dark mode via a
screenshot of the live production site. Root cause: the hero's darkening
scrim (`from-on-surface/70 via-on-surface/40 to-on-surface`, a gradient
meant to darken the beach photo enough for white text to read over it)
reused the theme-aware `on-surface` token — near-black in light mode
(correct), but near-*white* in dark mode, since that's the same token used
for readable body text everywhere else on a dark page. In dark mode the
"darkening" gradient was actually washing the photo out with a translucent
white overlay — the opposite of its purpose.

The fix: `on-surface` is the wrong tool here regardless of theme, because
darkening a fixed photograph isn't a theme concern — the photo itself
never changes between light and dark mode, so its scrim shouldn't either.
Added a new **fixed, non-theme-aware** token, `ink` (`#1d1c16`, flat hex,
no CSS variable), and swapped every place a photo-darkening scrim or its
related focus-ring offset had been (incorrectly) built on `on-surface`:

- `HomeView`'s hero section background, gradient scrim, and its two CTA
  buttons' `ring-offset`.
- `Navbar`'s `ring-offset` for the transparent state (the navbar as it
  appears over that same hero photo, before scrolling).
- The "Sold Out" badge overlay on a product photo, in all three places it
  appears: the Available Pieces grid (`HomeView`), the product detail page
  (`ProductDetailView`), and the Inventory tab's piece cards (`AdminView`)
  — all three had the exact same bug for the exact same reason.

**Deliberately left unchanged**: `CartDrawer`'s and `SearchOverlay`'s modal
backdrop scrims, and the dev nav bar's background in `App.jsx`, also use
`on-surface` at partial opacity. Those dim the *page itself* behind a
modal, not a fixed photograph, so whether they should invert with the
theme is a separate, more debatable design question the client didn't
raise — out of scope for this specific bug report.

Verified with a real dark-mode screenshot of the hero after the fix: the
photo shows the same top-to-bottom darkening treatment as before,
matching the original light-mode design intent, with the rest of the page
correctly in dark mode around it.

### 9.1 Same bug class, three more places ("the buttons too")

The client followed up with another screenshot: the category filter
pills (Available Pieces) were washing out the same way. Same root cause,
different shape — `bg-on-surface text-white`, a "solid dark pill, white
label" pattern used for active/primary buttons, not a photo scrim. In
light mode `on-surface` is near-black, so the pairing works; in dark mode
it flips to near-white, leaving white text on a near-white pill —
illegible, not washed-out-bright exactly, but the same underlying mistake
as §9 (a token meant to invert with the theme, used somewhere that must
not invert). Fixed by swapping to the new fixed `ink` token from §9
everywhere this exact pairing appeared: the Available Pieces active
filter pill, the Commission Pipeline's status filter pills, both "Save
Piece" submit buttons (Inventory and Archive tabs), the Inventory tab's
"Mark Sold Out" button, and — found while sweeping for the rest of this
pattern, not from the report — the fixed dev nav "Active View" pill in
`App.jsx`, which had the identical bug.

**A fourth, inverted variant of the same mistake**, also found in that
sweep: `ReviewReel`'s "1-of-1 Relic" badge (the New Release marquee,
visible in the client's screenshot) paired a *static* light background
(`bg-surface`, the leftover flat Material token, not the theme-aware
`surface-elevated`) with the *theme-aware* `text-on-surface`. In dark
mode the text flipped light while the background stayed light too —
white-on-white, the mirror image of the pill bug. Fixed by swapping to
`bg-surface-elevated`, which now correctly inverts together with the text
color it's paired with.

Verified computationally (the active filter pill's computed background
resolved to `rgb(29, 28, 22)` — exactly the `ink` value — with white
text, in a real dark-mode browser session) and visually via screenshot
(the "Sold Out" badge and the dev nav pill both read correctly as dark
pills with legible white text in dark mode).

### 9.2 Mobile header didn't follow the drawer's color (user-reported)

Screenshot from a real phone: with the mobile drawer open over the hero,
the header strip above it stayed translucent — still showing the beach
photo faintly through the logo/icon row — while the drawer itself was a
solid panel directly underneath. The two looked like separate, mismatched
pieces instead of one dropdown.

`Navbar`'s translucent-vs-solid header treatment was previously driven
only by `currentView === 'home' && !isScrolled` — it had no awareness of
the mobile drawer's own open/closed state. Fixed with one added
condition: `isTransparent` is now also `false` while `mobileMenuOpen` is
true, regardless of scroll position or view. That flips the header into
its existing "solid" treatment (`bg-sand/95 backdrop-blur-md`, the same
one already used when scrolled) — which in dark mode resolves to the same
near-black as the drawer's own `bg-sand` background, so the two now read
as one cohesive panel. Everything else the transparent/solid switch
already drove (text color, focus-ring offset, accent color) follows along
correctly for free, with no separate logic needed. Closing the drawer
reverts the header to fully transparent again, exactly as before — the
translucent-over-hero treatment itself was explicitly not to be touched
per the request, only made to yield while the drawer is open.

Verified with a real mobile-viewport (390×844) dark-mode session:
header background is `rgba(0,0,0,0)` (fully transparent) before opening,
switches to `rgba(26,24,21,0.95)` — the same color as the drawer's own
`rgb(26,24,21)`, just with the header's pre-existing blur/opacity
treatment — while open, and reverts to `rgba(0,0,0,0)` on close. Confirmed
visually too: a screenshot with the drawer open shows one continuous dark
panel with no seam, and a screenshot with it closed shows the original
translucent hero navbar, unchanged.

## 10. Rings and earrings removed — not a real product line

The client clarified ACUA doesn't make rings or earrings. Every trace of
those categories was still placeholder/mock content — the real catalog
has never been provided (a recurring "still blocked on the client" item
throughout this doc) — so this was safe to remove outright rather than
just relabel:

- **`products` table**: deleted "Dune Texture Ring", "Hammered Stacking
  Set" (both `category = 'Rings'`) and "Solitary Tidal Ear Cuff"
  (`category = 'Earrings'`) — confirmed zero orphaned `orders` rows
  referencing them afterward.
- **`archive_items` table**: deleted "Raw Sapphire Ring"
  (`Sculptural Ring`) and "Textured Drop Earrings" (`Artisanal Earrings`).
- **`src/data/reel.js`**: the "New Release" marquee turned out to be
  entirely disconnected from Supabase — a static mock array that was
  still showing "Dune Texture Ring," "Crag Textured Signet," and
  "Solitary Tidal Ear Cuff" regardless of what the real `products` table
  said. Removed those three; the marquee now shows only the three
  remaining necklace/bracelet entries. (Worth flagging on its own: this
  file being unconnected to the real catalog means *any* future catalog
  change won't show up in the marquee automatically — a real gap, not
  something fixed in this pass since it wasn't what was asked.)
- **Taxonomy**: removed `'Rings'`/`'Earrings'` from `FILTER_TABS`
  (`src/data/products.js`) and `'Sculptural Ring'`/`'Artisanal Earrings'`
  from `JEWELRY_CATEGORIES` (`src/data/commissionOptions.js`) — these
  drive the Available Pieces filter pills, the Commission form's category
  pills, and both AdminView category `<select>` dropdowns (Inventory and
  Archive tabs), so removing them here closes off the categories
  everywhere at once. `CommissionView`'s default category fallback
  (previously `'Sculptural Ring'`) was updated to `'Necklace / Choker'`
  since its old default no longer exists in the list.

Verified live: the Available Pieces filter pills show only
All/Necklaces/Bracelets; no ring or earring titles appear anywhere on the
storefront (grid or marquee); the Commission form's category pills and
both AdminView category dropdowns show only the remaining three
categories; and, as a real (temporary, since-removed) admin account,
confirmed no ring/earring items remain visible in either Inventory or
Archive tabs.

## 11. "New Release" marquee: clicking a product did nothing real

The client reported the carousel wasn't clickable. Root cause went one
level deeper than the click handler: `ReviewReel` was still rendering
`src/data/reel.js` — a fully static, hand-written mock array flagged as a
gap in §10 ("this file being unconnected to the real catalog means any
future catalog change won't show up in the marquee automatically") — so
its items never had a real database id to navigate to in the first place.
`HomeView`'s `onSelectProduct` handler compounded it by ignoring whatever
was passed and just scrolling to the grid below, regardless of which card
was clicked.

Fixed at the root rather than patching the symptom: `ReviewReel` now
fetches real products directly from Supabase — `sold_out = false`
(deliberately excluded; this is a "click through and buy it" highlight,
not an archive of things no longer available), most recent first, capped
at 8 (`REEL_LIMIT`) so it stays a quick skim rather than the whole
catalog. `HomeView` now wires `onSelectProduct` straight to the same
`onViewProduct` handler the Available Pieces grid already uses, so
clicking a card opens *that exact product's* real detail page — matching
the interaction pattern already established everywhere else on the site.

Two follow-on fixes that fell out of switching to real data:
- The "1-of-1 Relic" badge was shown unconditionally on every card before
  (accurate by coincidence, since the old mock titles were all named like
  one-off relics). Made it conditional on the real `is_one_of_one` flag,
  matching how the badge behaves everywhere else in the app.
- `lapWidthRef`'s measurement (needed for the seamless drag-loop math) ran
  once on mount in the old version, when the mock array was available
  synchronously. With an async fetch, mount-time measurement would read
  `scrollWidth` off an empty track. Re-measures whenever `pieces` changes
  instead.

`src/data/reel.js` is now fully unused (confirmed via a full-codebase
reference search) and was deleted.

Verified live: the marquee shows real product titles (Azure Drop Pendant,
Pearl Drop Chain, Woven Sand Bracelet — the actual remaining catalog), no
trace of the old mock titles; clicking the first card (with a forced
click, since the marquee's continuous auto-drift means Playwright's
normal "wait until stable" check never resolves — not a real issue, an
actual visitor can click a moving element fine) opens a product detail
page whose `<h1>` title matches the clicked card's title exactly.

## 12. More mock necklaces and bracelets — and a real image-accuracy bug

Requested more placeholder catalog variety in the two categories ACUA
actually makes. Added 8 new `products` rows (4 Necklaces, 4 Bracelets;
copy matches the established non-tarnish/natural-material brand voice; 2
flagged `is_one_of_one` for variety): Moonlit Shell Pendant, Coral Drift
Choker, Tidepool Layered Necklace, Salt Air Bar Necklace, Driftwood Bead
Bracelet, Sea Foam Chain Bracelet, Knotted Reef Cuff, Horizon Line Bangle.

**Every candidate stock photo was downloaded and actually viewed before
use** — a real, avoidable failure mode discovered mid-task: Unsplash
photo *titles and search context* ("gold bracelet", "necklace with
pendant") are frequently wrong. Several image ids that looked right by
association turned out, on inspection, to show rings or earrings instead.
Trusting a filename or a prior product's category association wasn't
good enough. This surfaced a real, live bug in the process: **"Pearl Drop
Chain," a real necklace product that's been on the storefront the whole
session, has been showing a photo of blue crystal earrings** the entire
time — an original seeding mistake from early in the project, only
caught now by actually looking at the pixels instead of trusting the
prior work. Fixed alongside the new products: Pearl Drop Chain now shows
a real pearl necklace image; Azure Drop Pendant's and Woven Sand
Bracelet's *fallback* images (also wrong or, in Woven Sand Bracelet's
case, a dead 404 link) were corrected too.

Every one of the 11 live products (3 original + 8 new) now has both its
primary and fallback image verified by eye to actually depict the
labeled category — no product in `Necklaces` or `Bracelets` shows a ring
or earring anywhere, primary or fallback.

Verified live: all 8 new titles render with descriptions/prices, the two
`is_one_of_one` badges show correctly, zero failed image requests, and a
full-page screenshot was reviewed directly confirming every card matches
its stated category.

## 13. Global error boundary + social sharing meta tags

Self-directed backend/frontend audit. Two real, independent gaps closed:

**No React error boundary anywhere in the app.** A render-time throw in
*any* component — a malformed Supabase row, a field the UI didn't expect
to be null — would unmount the entire React tree to a blank white screen
with zero recovery path and no message. This is the same failure class as
the earlier "white screen on Vercel" bug (§ was fixed by hardening
`supabaseClient.js` against a client-init throw), just triggered by a
render error instead of a client-init error — and nothing had closed off
that second path. Added `src/components/ErrorBoundary.jsx` (necessarily a
class component — `getDerivedStateFromError`/`componentDidCatch` have no
hook equivalent), wrapping the entire app in `main.jsx`, outside even
`MotionConfig` and the context providers, so it catches errors from
anywhere in the tree. Shows a friendly "Something went wrong" card with a
reload button, matching the site's own design system, instead of a blank
page.

Verified with a real thrown error, not just a compile check: temporarily
added a URL-flag-gated `throw` to `App.jsx`
(`?__test_throw=1`), confirmed via Playwright that the friendly error UI
renders instead of a blank screen, confirmed the normal page still works
without the flag, then fully reverted the temporary test code (`git
status` after confirms `App.jsx` has zero diff — the revert was clean).

**No Open Graph / Twitter Card meta tags.** For a small business that
sells primarily through social channels (Instagram, Facebook — the
client's own accounts were referenced earlier in this project), a link
shared in Messenger, Instagram DMs, WhatsApp, or iMessage was rendering as
a bare, imageless link with no title or description card. Added
`og:*`/`twitter:*` tags plus a `theme-color` meta (matching the primary
brand accent) to `index.html`. The preview image reuses the existing hero
photo at proper OG dimensions (1200×630) as a placeholder — noted in a
code comment that it should be swapped for dedicated branded artwork once
that exists, same caveat as the navbar's still-text-only wordmark.

Verified live: all meta tag values read correctly from the rendered page
(`og:title`, `og:image`, `twitter:card`, `theme-color`).

## 14. Initial-load preloader

Added on request: a branded splash shown for the gap between HTML parse
and React mounting — previously a blank page on a cold load, most visible
on a slow connection.

**Implementation, and why it's plain HTML/CSS instead of a React
component**: the whole point is to cover the wait for the JS bundle (and
the Tailwind CSS bundle) to download and execute, so the preloader can't
itself depend on either — it's written as inline `<style>` and static
markup directly in `index.html`, using literal hex values rather than the
app's Tailwind tokens. It respects the same two conventions those tokens
would have: dark mode, via a plain `html.dark #initial-loader` CSS
selector reading the same `.dark` class the existing no-flash theme
script already sets before paint; and `prefers-reduced-motion`, via a
plain media query disabling both animations (the pulsing wordmark, the
sliding progress bar) since neither conveys information that's lost by
going static.

**How it disappears with no removal code**: the markup sits *inside*
`<div id="root">` as `#root`'s only child. `createRoot(...).render(...)`
in `main.jsx` replaces the *entire* contents of `#root` on its first
commit — so the moment React actually mounts, the preloader is gone
automatically, with nothing on the React side needing to know it ever
existed.

Verified two ways: confirmed the preloader markup is present in the real
built `dist/index.html` output (not just the dev source); and, using a
Playwright session with Chrome DevTools Protocol network throttling
(~50kbps, simulating the slow-connection case this actually matters for),
confirmed the preloader is genuinely visible and rendered correctly
during the load, and confirmed it's fully replaced once the real
homepage content mounts afterward.

## 15. Commission material shown as a raw id, order thumbnail unused

Self-directed audit, two real display bugs in patron/admin-facing content:

- **`commission_briefs.material` displayed as its raw stored value**
  (e.g. `non-tarnish-gold-tone`) instead of its human-readable label
  (`Non-Tarnish Gold-Tone Alloy`), in both `AdminView`'s Commission
  Pipeline and `PatronDashboardView`'s Custom Commissions tab. The
  correct lookup pattern (`MATERIAL_OPTIONS.find((m) => m.id ===
  brief.material)?.label ?? brief.material`) already existed and was used
  correctly in `AdminView`'s Archive tab — it just hadn't been applied to
  the two other places a brief's material renders as text. Fixed both.
- **`PatronDashboardView`'s order query already fetched
  `product:products(title, image_url)`, but never rendered
  `image_url`** — Active Purchases showed title/price/tracking with no
  product thumbnail, despite the data already being on hand with no
  extra query needed. Added the thumbnail.

Verified with a real (temporary, since-removed) patron+admin account: a
commission brief submitted with `material = 'non-tarnish-gold-tone'`
renders as "Non-Tarnish Gold-Tone Alloy" in both dashboards, never the
raw id; a test order shows its product's thumbnail correctly in Active
Purchases.

## 16. Real logo mark: favicon, apple-touch-icon, and web manifest

The client provided ACUA's actual logo artwork (a stylized monogram +
wordmark on a circular photo badge) with the request to use it for the
favicon, background removed. This also happened to replace two
unrelated, worse problems found along the way:

- **The existing `favicon.svg` was never a placeholder — it was the
  unmodified default Vite icon** (a purple lightning bolt, `#863bff`),
  completely unrelated to the brand. `public/icons.svg` (an unused social-
  icon sprite sheet, confirmed via a full-codebase reference search) was
  also just dead weight shipping to production for no reason. Both
  deleted.
- **No `apple-touch-icon` or web manifest existed at all** — a visitor
  adding the site to their iOS/Android home screen would get an
  auto-generated screenshot thumbnail instead of anything branded.

**Background removal, since no image-editing tool is available in this
environment**: installed `jimp` (pure-JS, no native binary dependency,
so it isn't blocked by the earlier-noted absence of cwebp/sips/magick/
ffmpeg) and wrote a small one-off extraction script — not committed, this
was throwaway tooling for a one-time asset, not app code. The approach:
threshold the source JPEG for the mark's distinct cream color, then
connected-component filter to discard small isolated regions (the color
threshold alone also matched scattered bright water-texture glints in
the source photo, confirmed by generating and visually inspecting an
intermediate black-and-white mask before trusting it), then a
morphological open (erode, then dilate) to shave off the resulting
jagged edge noise. The output's remaining fine texture is the logo's own
intentional distressed/stamp art style, not extraction artifacts — and
at favicon size (16–32px) it's invisible either way, so no further
cleanup mattered for this use case.

**Two output variants, for a real reason, not redundantly**:
`favicon.png` (transparent — a browser tab supplies its own backdrop) and
`apple-touch-icon.png` (opaque, on the brand's own chile-rojo, matching
the source artwork's circular badge treatment) — iOS composites
transparent regions of a home-screen icon as solid black, so the browser-
tab version would look broken there. `manifest.json`'s icon list
references both (the second as `purpose: "maskable"`, since Android's
adaptive-icon masking also expects a full-bleed backdrop, not
transparency).

Verified: rendered all three real usage sizes (16px, 32px, 48px browser-
tab; 60px rounded-corner home-screen-style) via a headless browser and
confirmed each reads clearly; confirmed the built `dist/` output
references the new files (not stale `favicon.svg` paths) and that
`/favicon.png` actually serves with a 200 in a live dev session.

**Not done, and worth asking about as a natural follow-up**: this same
logo mark could also replace the Navbar's still-text-only "ACUA"
wordmark (a standing `TODO` since early in the project) and the
placeholder hero-photo Open Graph image from §13 — both out of scope for
what was actually asked (the favicon specifically), so left untouched
rather than assumed.

### 16.1 Re-extracted from a cleaner source photo

The client supplied the same logo mark again, on a different circular
badge photo (agave/cactus foliage instead of the water-texture one) and
asked for the extraction to be redone against it, expecting a cleaner
result. It was: the color-threshold step alone found **6 total connected
regions in the new photo, all real, versus 594 in the water-texture photo
(of which only ~13 survived the size/noise filtering)** — foliage green is
just a much bigger, more consistent color distance from the logo's cream
than the water photo's bright golden highlights were. No connected-
component filtering or morphological cleanup was even needed to get a
clean result this time, though the same pipeline from §16 was reused
as-is rather than special-cased.

Same two output files (`favicon.png` transparent, `apple-touch-icon.png`
on chile-rojo), same filenames — so no code changes were needed, only the
two PNGs themselves were replaced. Verified the new `dist/favicon.png` is
byte-identical to the new `public/favicon.png` (confirms the build picked
up the replacement, not a cached copy) and re-rendered all four real
usage sizes to confirm the sharper edges are visible at every one, not
just at full resolution.

## 17. Real logo mark used across the site, not just the favicon

The client confirmed this is the official logo and asked for it to be
used more broadly. Extracted two persistent, reusable assets into
`src/assets/` this time (`logo-mark-cream.png`, `logo-mark-ink.png`) —
same background-removal pipeline as §16/§16.1, reused as a real project
asset rather than a one-off temp file, since three separate places now
need it.

**Why two colors, and the logic behind which one shows where**: the mark
is a single flat color, so unlike a `text-*` Tailwind class it can't
invert itself against whatever's behind it — each usage site has to pick
the right variant explicitly, based on what's actually behind it there:

- **Navbar, transparent/hero state**: sits over the fixed-dark hero photo
  (the `bg-ink` scrim from §9) — always needs the cream mark, regardless
  of site theme, matching the `text-white` treatment already used for the
  wordmark text in this state.
- **Navbar, solid/scrolled state**: sits on `bg-sand/95`, which is
  theme-aware (light sand in light mode, near-black in dark mode) — needs
  the ink mark in light mode, cream mark in dark mode. `Navbar.jsx`
  already had `useTheme()` wired in for the dark-mode toggle button, so
  the logic is one line: `isTransparent || theme === 'dark' ? cream :
  ink`.
- **Footer**: sits on `bg-chile-rojo`, a brand color fixed regardless of
  site theme — always the cream mark, no conditional needed. This also
  let the cream-colored box that used to sit *behind* the plain "ACUA"
  text (there for contrast, since dark text needed a light backdrop) go
  away entirely — the real mark is already legible directly on the
  terracotta background, which reads cleaner than a text-in-a-box
  treatment.
- **Preloader** (`index.html`, plain HTML/CSS, no framework or `useTheme`
  available at that point): same light/dark split as the rest of the
  preloader, done the same way — two `<img>` tags, toggled via the
  existing `html.dark` selector convention the preloader already
  established in §14, rather than one image with a runtime color swap.

Confirmed Vite correctly processes and content-hashes image references
written directly in `index.html` (not just ones imported from JS/JSX) —
checked the built output and both `logo-mark-*.png` references were
rewritten to their hashed `/assets/` paths, not left pointing at the raw
dev-only `/src/assets/...` path that would 404 in production.

Verified live across every real combination: navbar over the hero photo
(cream, legible), navbar scrolled in light mode (ink, legible), navbar
scrolled in dark mode (cream, legible), and the footer (cream, directly
on the terracotta background, no box) — four screenshots, one per state,
all reviewed directly.

## 18. Footer rebuilt as one shared, professional component

The client asked for the footer to look like it came from an established
company, and for its links to actually work. Auditing what existed turned
up real, confirmed problems, not just a thin design:

- **Three broken links**: `href="#sustainability"`, `#shipping`,
  `#returns` pointed at page sections that don't exist anywhere on the
  site — clicking them did nothing.
- **A stale hardcoded copyright**: `© 2024 ACUA` in `HomeView`'s footer,
  two years wrong, while `CommissionView`'s *separate* footer already
  computed `{new Date().getFullYear()}` correctly — the two footers had
  drifted from each other.
- **Two different footers already existed** (`HomeView`'s full one,
  `CommissionView`'s much thinner text-only one), and **two real pages had
  no footer at all** — `ProductDetailView` and `PatronDashboardView`.
- **A related, previously-undiscovered navigation bug**, found while
  building the new footer's own "Collections" link and wanting to reuse
  a *working* pattern rather than copy a broken one: the navbar's
  "Collections" button called `setCurrentView('home')` and then
  `document.getElementById('available-pieces')` in the same tick. That
  only works if you're already on the home page — from anywhere else, the
  element isn't in the DOM yet when the lookup runs (React's state update
  hasn't committed), so the scroll silently no-ops. Confirmed live before
  fixing: navigating to Custom Request, then clicking Collections, landed
  correctly on Home but left `scrollY` at `0` instead of scrolling down.
  Fixed with the same `setTimeout` delay pattern `ProductDetailView`
  already used correctly elsewhere, applied to both the desktop nav
  button and the mobile drawer's copy — and used correctly from the start
  in the new footer's version.

**Fix**: a single `src/components/Footer.jsx`, rendered once from
`App.jsx` for every view except `admin` (an internal business tool, not
a public storefront page, doesn't carry the marketing footer — matching
ordinary practice), rather than duplicated per-view. Four columns, all
linking to real, working destinations only — nothing invented:
Brand (real logo mark, tagline, Instagram/Facebook), Shop (Shop,
Collections, Custom Request), Account (My Account, Track a Commission),
Get in Touch (real email, real Instagram handle, real city). A bottom bar
with the dynamic copyright year and the brand tagline.

**"Track a Commission" is a real deep link, not a disguised duplicate of
"My Account"**: both used to point at the exact same thing with no
distinction. Added a `dashboardInitialTab` piece of state in `App.jsx`
(reset on every other navigation, the same rule `commissionPrefill`
already follows) and a `goToDashboardTab` handler, threaded through
`PatronGate` to `PatronDashboardView`'s `activeTab` initial state — so
this link now opens directly to the Custom Commissions tab, not just the
account page in general.

**Deliberately not invented**: Sustainability/Shipping/Returns/Privacy/
Terms pages. There's no real content for any of them, and shipping
windows, return policies, and legal terms are the kind of thing a real
business needs to decide and can carry real consequences if guessed
wrong — removed the broken links rather than filling them with
plausible-sounding but unverified policy text.

Verified live end-to-end, not just visually: the footer is present on
Home, Commission, and the product detail page, and absent on Admin;
the dynamic year reads correctly (2026, not stale); no broken anchor
text remains; the footer's own Shop, Collections (including the
just-fixed cross-page scroll), and Custom Request links were each
clicked and confirmed to land in the right place; the email link
resolves to a real `mailto:` address.

**Follow-up fix — missing keyboard focus indicator**: only the two
social icon links (copied from the old footer code) carried the app's
standard `focus-visible:ring-2 ... focus-visible:ring-offset-chile-rojo`
treatment. The other seven interactive elements sharing the new
`linkClass` — Shop, Collections, Custom Request, My Account, Track a
Commission, the email link, and the @acua_ph link — had no custom focus
styling at all, inconsistent with every other interactive element in the
app (navbar buttons/icons, CTAs). Added the same ring treatment to
`linkClass` itself. Verified live: tabbing to the "Shop" button and to
the mailto link both now compute a visible two-layer box-shadow ring
(`chile-rojo` inner ring, `sunset`-tinted offset) instead of no ring.

## 19. Site-wide keyboard accessibility audit

Chasing the footer's missing focus ring one level further turned up the
same gap almost everywhere: it wasn't a footer-specific oversight, it was
never applied consistently anywhere except a handful of icon buttons in
the navbar. Two categories of problem, of different severity:

**Cosmetic — dozens of interactive elements had no visible focus
indicator at all.** Buttons/links across `Navbar` (the actual primary
"Shop / Collections / Custom Request" nav links, both desktop and the
mobile drawer — the site's main navigation), `SearchOverlay`,
`CartDrawer`, `Toast`, `ProductDetailView` (including the Add to Cart and
quantity-stepper buttons — the core purchase actions), `PatronDashboardView`,
`AuthForm`, `CommissionView`, `AdminView`, and the shared `.btn-terracotta`
class itself (the site's primary CTA button, used in 6 different files —
checkout email link, form submits, the error boundary's reload button)
had zero `focus-visible` styling. Fixed the shared class once in
`index.css`; fixed every other spot individually, choosing a
`ring-offset` color that matches whatever surface each element actually
sits on (`sand` for page-level, `surface-elevated` for cards) so the ring
reads correctly in both themes.

**Functional — two real "can't operate this at all" gaps, not just
missing polish:**

- **The Available Pieces product cards** (the primary way to reach any
  product's detail page from the home grid) were a `motion.div` with only
  an `onClick` — no `tabIndex`, no keyboard handler, no ARIA role. A
  keyboard-only or screen-reader user could not open a single product's
  detail page from the grid at all. Same defect, same fix needed, in the
  "New Release" reel (`ReviewReel.jsx`) — its cards had the identical
  click-only pattern (a leftover from the reel rewrite in §11 that fixed
  *mouse* clicks but not keyboard ones). Fixed both by adding
  `role="button"`, `tabIndex={0}`, an `aria-label`, and an `onKeyDown`
  that activates on Enter/Space. The home grid card also nests two real
  `<button>`s (Add to Cart, Request Similar) that call `stopPropagation`
  on click — but `keydown` bubbles regardless of that, so without a
  guard, pressing Enter on either nested button would *also* fire the
  outer card's navigation. Guarded the outer handler with
  `if (e.target !== e.currentTarget) return;` and verified live that
  Enter on the Add to Cart button now correctly stays on the page instead
  of navigating away.
- **The commission form's Material Selection control** was a plain
  `<div onClick>` per option — the only way to set a required field on
  the form, and completely unreachable by keyboard. Converted each card
  to a real `<button type="button" role="radio" aria-checked>` inside a
  `role="radiogroup"` container, preserving the existing visual design
  and selection logic.

Verified live end-to-end with a temporary Playwright script (installed
and removed afterward, no trace left behind): a product card is
focusable and Enter opens its detail page; pressing Enter on the nested
Add to Cart button does not navigate away; the material radio group is
focusable and Enter selects it (`aria-checked` flips to `true`). Also
fixed one more related bug found in the same pass: the Archive section's
"Request Similar Piece" button only became visible on `:hover` (`opacity-0
group-hover:opacity-100`), so a keyboard user tabbing onto it got no
visual feedback at all — added `group-focus-within:opacity-100` so
focusing the button reveals the overlay the same way hovering does.

## 20. Cart never revalidated against live stock or price

The cart persists to `localStorage` (`acua-cart-v2`) as a full snapshot
of each product at the moment it was added — title, price, image,
`isOneOfOne` — and never touches the database again until checkout.
Since most of ACUA's catalog is 1-of-1 pieces, and "checkout" is really
just emailing the cart contents to the shop to confirm and pay, this had
a real, live consequence: if a customer added a one-of-one piece to their
cart, left it there, and the piece sold to someone else in the
meantime (marked `sold_out` by staff in Admin), the cart would still
show it as orderable, include it in the subtotal, and let the "Email to
Order" button draft an email requesting a piece that's already gone.

**Fix**: `CartDrawer` now re-queries the `products` table for
`id, sold_out` for every item currently in the cart each time the drawer
opens (not continuously — no need to poll a closed drawer). Any item
that's since sold out is shown dimmed, labeled "No longer available,"
loses its quantity stepper, and is excluded from both the displayed
subtotal and the emailed order — with a banner explaining why so the
exclusion isn't silent. The subtotal math was moved out of `CartContext`
(which has no way to know about live stock) and computed locally from
just the still-available items.

Verified without touching the real production database: mocked the
Supabase REST response via Playwright's network interception (the
classifier correctly blocked a direct `UPDATE` against the live
`products` table, since it's a shared, real-money-adjacent resource —
appropriately so) to simulate one of two seeded cart items having sold
out, then confirmed live: the sold item shows "No longer available" and
loses its stepper, the banner appears, the subtotal reflects only the
available item (₱4,000 for 2× a ₱2,000 piece, correctly excluding the
sold ₱1,000 one), and the "Email to Order" `mailto:` link's body includes
the available item's title but not the sold-out one's.

## 21. Every page showed the same browser tab title

The whole site is one SPA view-switch, and `document.title` was never
touched after the initial static `<title>` in `index.html` — every view
(Home, Commission, My Account, Admin, every single product) showed the
exact same "ACUA | Handcrafted by the Coast" tab title. Added a
`useEffect` in `App.jsx` keyed on `currentView` that sets a distinct
title per view (`Custom Request | ACUA`, `My Account | ACUA`,
`Admin | ACUA`), and a separate effect in `ProductDetailView` that sets
the tab title to the actual piece's name once it loads (falling back to
the site default while loading or if the product isn't found), since
`App.jsx` has no way to know which product is showing.

Verified live: Home shows the default brand title, Custom Request shows
"Custom Request | ACUA", and opening a piece from Available Pieces
updates the tab to that piece's real name (e.g. "Horizon Line Bangle |
ACUA") once its data loads.

## 22. Mobile nav menu had no Escape or outside-tap dismissal

`CartDrawer` and `SearchOverlay` both close on Escape and (via their
click-catching backdrop) on an outside click — the mobile hamburger
drawer in `Navbar` had neither. Once opened, the only way to close it was
the toggle button itself or tapping one of its own links; pressing
Escape did nothing, and tapping anywhere else on the page (the hero
image, the logo) left it sitting open. Added the same pattern: an Escape
listener, and a `pointerdown` listener on `document` that closes the menu
if the tap/click lands outside the `<header>` element (guarded with a
ref so clicks on the header's own toggle button or the drawer's own
links — which already close it themselves — aren't double-handled).

Verified live on a mobile viewport: opening via the toggle, then
pressing Escape, closes it; reopening, then tapping the hero section
well outside the header, also closes it.

## 23. Image loading performance pass

- **The home hero image was invisible to the browser's preload
  scanner.** It's a CSS `background-image` on a `<div>`, not an `<img>`,
  so — unlike an `<img src>` the scanner can start fetching the moment it
  sees the raw HTML — the browser only requests it once CSS is parsed and
  styles are resolved, well after the fact for what's almost certainly
  the page's largest contentful paint element. Added
  `<link rel="preload" as="image" fetchpriority="high">` in `index.html`
  pointing at the same URL, so the fetch starts immediately.
- **The product detail page's main image** (the largest visible element
  the instant that page loads) had no `fetchPriority`, so it competed
  for bandwidth on equal footing with everything else on the page.
  Added `fetchPriority="high"`.
- **The "New Release" reel's images** — below the fold on every load,
  since the reel sits right after a full-viewport-height hero — were
  loading eagerly, unlike every other below-fold image in the app
  (product grid cards, the Archive section). Added `loading="lazy"`,
  along with a few smaller misses found in the same sweep: the cart
  drawer's item thumbnails, the footer's logo, and admin's commission
  reference-image thumbnails.
- Added a minimal `public/robots.txt` (`Allow: /`) — standard practice
  for a real deployed site, and one of the only two things worth having
  for a single-URL SPA like this one (a `sitemap.xml` wouldn't add
  anything, since there are no other crawlable URLs to list without
  real routing).

Verified via a temporary Playwright check: no new console errors or
warnings after the change, the preload `<link>` and the image's
`fetchpriority="high"` both render correctly in the live DOM, and the
hero section still renders pixel-identical to before.

## 24. Commission and product-detail views bundled into every visitor's initial load

`AdminView` and `PatronDashboardView` were already code-split with
`React.lazy` — reasonably, since both are gated behind a login/admin
check that most visitors never pass. `CommissionView` and
`ProductDetailView` weren't, despite the exact same logic applying: a
first-time visitor lands on Home by default and, most of the time,
never even opens either of those views in that session — yet the build
was shipping both to every single visitor regardless. Every build had
also been quietly warning about this the whole session
("Some chunks are larger than 500 kB after minification") without it
being addressed.

**Fix**: converted both to the same `lazy()` + `<Suspense
fallback={<ViewLoadingFallback />}>` pattern already used for
Admin/Dashboard — no behavior change, just moved out of the eagerly-
bundled main chunk.

**Result**: the main JS chunk dropped from 651 KB to 400 KB (186 KB to
122 KB gzipped) — a real ~35% cut to what every visitor downloads and
has to parse/execute before Home is interactive — and the build's
"chunk too large" warning is gone entirely. `CommissionView` (17 KB) and
`ProductDetailView` (7 KB) now fetch on demand instead.

Verified live: navigating to Custom Request and to a product's detail
page both still render correctly (their lazy chunks load and mount with
no console errors), confirmed via a temporary Playwright check.

## 25. Form fields with no real accessible label

`AuthForm` (the login/signup form — arguably the single most important
form on the site) had zero `<label>` elements at all, relying entirely
on `placeholder` text for Full Name, Email, and Password. Placeholder
text is not a substitute for a label: it disappears the moment someone
starts typing and isn't reliably exposed as the field's accessible name
by screen readers. `CommissionView`'s main fields (Full Name, Email,
Phone, Timeline, the narrative textarea, and the file upload) did have
visible `<label>` elements, but none of them were actually wired up —
they were visually adjacent `<label>` tags with no `htmlFor`/`id` pair
and not wrapping the input, so despite looking correct on screen, a
screen reader had no programmatic way to associate the label text with
its field. Several of `AdminView`'s compact quick-add-piece inputs
(Title, Category, Material, Price, Image URL, quote price) had the same
placeholder-only problem, and `SearchOverlay`'s search input had an
`aria-label` on its dialog *wrapper* but not on the input itself — an
ancestor's `aria-label` doesn't cascade down, so the input was still
unnamed.

**Fix**: added `aria-label` to `AuthForm`'s three fields (matching the
existing placeholder copy, so nothing about the compact, label-less
visual design the site already uses had to change); added real
`id`/`htmlFor` pairs to every `CommissionView` field that had a visible
but disconnected label; added `aria-label` to `AdminView`'s admin-only
quick-add inputs and selects; added `aria-label` directly to
`SearchOverlay`'s input.

Verified live with a targeted check: Playwright's `getByLabel()` only
resolves when the accessible-name computation actually succeeds (not
just when text looks adjacent on screen) — confirmed it now correctly
finds Full Name, Email Address, the narrative textarea, and the file
upload field in Commission, and Email Address / Password in the login
form.

## 26. Automated axe-core audit: nested interactive controls + real contrast failures

Ran a proper automated accessibility audit (`@axe-core/playwright`)
across Home in both themes, Commission, the cart drawer, and search —
a more systematic pass than manual spot-checking, on top of everything
already covered in §19–§25. It surfaced two real, "serious"-impact
findings:

- **Nested interactive controls** on the Available Pieces product
  cards: the whole card had `role="button"` while also containing two
  real `<button>`s (Add to Cart, Request Similar) — the exact pattern
  §19 flagged as a known, documented trade-off, but axe correctly rates
  it "serious" since screen readers don't reliably announce or navigate
  interactive elements nested inside other interactive elements.
  Restructured properly instead of leaving it as accepted debt: the
  card is no longer itself a button. A separate, absolutely-positioned
  "stretched link" `<button>` now covers the whole card at the lowest
  z-index (`aria-label="View {title}"`), the visual content sits above
  it with `pointer-events-none` so clicks fall through to that button,
  and the two real action buttons individually opt back into
  `pointer-events-auto` so they keep working on their own. This also
  made the earlier keydown-bubbling guard (§19) unnecessary — there's no
  longer an ancestor click handler for a nested button's Enter/Space to
  bubble into, so the whole class of bug is gone, not just guarded
  against. (`ReviewReel`'s cards use the same `role="button"` pattern
  but have no nested interactive children, so axe didn't flag them —
  no change needed there.)
- **Color contrast failures in the new Footer** (§18): the tagline,
  social icons, and every text-link (`text-white/75`/`/80`/`/70`) fell
  just short of WCAG AA's 4.5:1 against the footer's `chile-rojo`
  background, and the section headings (`Shop`/`Account`/`Get in
  Touch`, using the shared `sunset` brand hex at 11px) measured only
  3.63:1. Bumped the white-based text to `/85`–`/90` opacity (all now
  pass), and — rather than editing the shared `sunset` token itself,
  which is a flat brand-color hex used in ~20 other places across the
  app (nav indicator, focus rings, buttons) that are non-text UI and
  not required to hit the same ratio — gave just these footer heading
  labels a one-off, slightly lighter tint (`#f9e6c2`) scoped to that
  single `headingClass`, arrived at by iterating against the live axe
  check until it cleared 4.5:1.

**Found but deliberately not changed**: every product price
(`text-terracota`, `#d68224`) measures only ~2.75–2.96:1 against both
white and sand backgrounds, on the Available Pieces grid and the "New
Release" reel alike — a real, serious-impact failure, but on a flat
brand accent color used for pricing everywhere, established well
before this session, not something introduced by any of this session's
work. Repainting the brand's price color is a visual-identity decision,
not a bug fix, so it's flagged here rather than changed unilaterally.

Verified live: the scoped axe audit against the footer alone dropped
from 4 violating nodes to 0; the full Home (dark) page audit dropped to
0 violations entirely; the restructured product cards were re-verified
end-to-end — clicking the card body, and pressing Enter while it's
focused, both still navigate to the product page, while clicking or
Enter-ing the Add to Cart button still adds to cart without navigating
away, with no console errors.

## 27. Modals declared aria-modal but never actually trapped focus

`CartDrawer` and `SearchOverlay` both mark their dialog panel
`role="dialog" aria-modal="true"` — a promise to assistive tech that
focus stays inside the dialog while it's open — but neither actually
enforced it. Tabbing past the last focusable element (or Shift+Tabbing
past the first) let focus escape into the page behind the dialog, which
is still visually present (if dimmed) and, without a trap, still
reachable by keyboard even though the modal is meant to have full
attention.

**Fix**: added a small reusable `useFocusTrap(containerRef, active)`
hook (`src/hooks/useFocusTrap.js`) — on open, moves focus to the first
focusable element inside the dialog (unless the dialog already focused
something itself, like `SearchOverlay`'s own input-focus effect);
intercepts Tab/Shift+Tab at the dialog's boundary so it wraps around
inside the dialog instead of escaping; and on close, restores focus to
whatever triggered the dialog (the cart or search icon), instead of
leaving focus wherever it happened to land or resetting to `<body>`.
Wired into both `CartDrawer` and `SearchOverlay` via a ref on their
dialog panel.

Verified live: tabbing 15 times inside an open cart (seeded with a real
item so there's more than just the close button to cycle through) never
left the dialog; Shift+Tab from the first focusable element correctly
wrapped to the last; closing via Escape returned focus to the cart
button that opened it. Same three checks passed for `SearchOverlay`,
which also still auto-focuses its search input as before.

## 28. "New Release" reel ignored prefers-reduced-motion

`main.jsx` sets `<MotionConfig reducedMotion="user">`, which makes every
declarative Framer Motion animation in the app (entrances, `whileHover`,
`AnimatePresence` exits) automatically respect the OS-level
prefers-reduced-motion setting. The "New Release" reel's continuous
auto-scroll drift is not one of those — it's a manual `useAnimationFrame`
loop that imperatively nudges a motion value every frame, entirely
outside `MotionConfig`'s reach. That meant the one truly continuous,
non-essential animation on the whole site — exactly the kind most likely
to bother someone with a vestibular disorder, which is the actual reason
this OS setting exists — was the one animation immune to it.

**Fix**: read the same preference directly with Framer's
`useReducedMotion()` hook and skip the auto-scroll advance each frame
when it's set, leaving drag-to-browse (user-initiated, not automatic)
completely unaffected.

Verified live: measured the reel's actual computed `translateX` before
and after a 1.5s window under Playwright's `reducedMotion: 'no-preference'`
vs `'reduce'` emulation — normal preference drifted ~50px as expected,
reduced motion drifted exactly 0px.

## 29. Toast's aria-live region was inserted, not updated

`Toast` (AdminView's feedback for actions like "quote sent" or "couldn't
save that piece") put `role="status" aria-live="polite"` directly on the
`motion.div` that `AnimatePresence` mounts and unmounts per toast — so
the live region itself only ever existed in the DOM for the same instant
its message appeared. Assistive tech is meant to announce changes to an
*already-present* live region; a live region that's freshly inserted at
the same moment as its content is a well-known pattern several
browser/screen-reader combinations don't reliably announce, per the ARIA
Authoring Practices' own guidance to keep live regions present in the
DOM from the start.

**Fix**: moved `role="status"`, `aria-live="polite"`, and added
`aria-atomic="true"` onto the outer wrapper `<div>`, which was already
unconditionally rendered regardless of whether a toast is active — only
its child (the actual message) mounts and unmounts now, which is the
recommended shape for a reliable live region.

A small, mechanical change (relocating three JSX attributes, no logic
touched) — verified via a clean build and a general console-error check,
since exercising it live would need a real admin login I don't have
credentials for and it wasn't worth creating one just for this.

## 30. Commission form's uploaded-image previews never released their memory

Each reference-image preview is a `blob:` URL from
`URL.createObjectURL(file)`, which keeps that file's data alive in
memory until something explicitly calls `URL.revokeObjectURL` on it —
the browser never reclaims it on its own. `removeFile` already revoked
one at a time, but that was the only path that did: a successful
submission left every preview's blob alive indefinitely (the images
were already durably uploaded to Supabase Storage by that point, so
there was nothing left needing the local copies); clicking "Submit
Another Commission" cleared the state array holding the URLs without
revoking them first, at which point they became unreachable and
therefore truly unrecoverable for the rest of the tab's lifetime; and
simply navigating away mid-form with images still attached (e.g.
clicking "Shop" in the navbar) unmounted the view with no cleanup at
all.

**Fix**: revoke every outstanding preview immediately after a successful
submit (right before showing the confirmation screen, since they're no
longer needed at that point); and added an unmount-only cleanup effect,
backed by a ref kept in sync with the latest `uploadedImages` on every
render, that revokes whatever's left if the patron navigates away
without submitting.

Verified live: uploaded a real file, confirmed its blob URL was
fetchable (i.e. genuinely alive) beforehand, navigated away without
submitting, and confirmed that exact same URL was no longer fetchable
afterward — the unmount cleanup fired and released it.

## 31. Dependency maintenance + a lint-flagged ref pattern

`npm audit` came back clean (0 vulnerabilities, dependencies and
dev-dependencies alike). `npm outdated` showed two packages with safe,
in-range updates available under their existing `^` version
constraints — `oxlint` 1.83.0 → 1.85.0 and `tailwindcss` 3.4.17 → 3.4.19
— applied via `npm update`. Left Tailwind's actual "latest" (v4.3.3)
alone: that's a major version with real breaking changes across config
and utility behavior, not something to pull in as a drive-by dependency
bump without dedicated migration testing.

The updated `oxlint` surfaced a real finding in §30's fix: assigning
`uploadedImagesRef.current = uploadedImages` directly in the render body
is a working pattern (React's own docs describe it as valid for
"always current" refs like this), but not the form static analysis
tools expect, and it's just as easy to write as the idiomatic version.
Moved the assignment into its own `useEffect(() => {...}, [uploadedImages])`
instead of mutating the ref during render. Re-verified live afterward
that the blob-URL cleanup from §30 still works exactly the same
(fetchable before navigating away, unfetchable immediately after).

The remaining lint output is pre-existing, inherent to deliberate
patterns used consistently across the codebase, not bugs: `only-export-
components` on every context file (`AuthContext`/`CartContext`/
`ThemeContext`/`Toast`) is a Fast Refresh (dev-only hot-reload) nitpick
about colocating a provider and its hook in one file — a standard,
common React pattern, not worth splitting across 4 files to silence;
`set-state-in-effect` on the three async-data-fetching effects
(`AuthContext`, `ProductDetailView`, `SearchOverlay`) flags exactly the
pattern effects exist for — there's no way to derive an async network
result during render instead; and the `Math.random()` "impure function"
warning in `AdminView`'s tracking-number generator is a false positive,
since that code only ever runs inside an `onClick` handler, never during
render.

## 32. Commission form drafts, and a stale-refill bug in "Submit Another Commission"

The commission brief is a long form — contact details, category,
material, budget, timeline, a multi-sentence narrative — and none of it
survived an accidental refresh or back-button press. The cart already
solves exactly this problem via `localStorage`; the commission form had
nothing.

**Fix**: added the same pattern. `formData` now saves to
`localStorage` (`acua-commission-draft`) on every change, restored on
mount — unless a fresh `prefill` is present (a "Request Similar" click
is a deliberate action just taken, and should always win over a stale
draft from some unrelated earlier visit), and cleared the moment a brief
is successfully submitted, since it's durably saved server-side by then
and shouldn't still be sitting in local storage the next time this form
opens.

**Found in the same area**: clicking "Submit Another Commission" never
actually reset `formData` — it only cleared the uploaded-image state, so
the just-submitted brief's own category, material, and full narrative
stayed sitting in the form. A patron trying to submit a second, different
commission would have had to manually clear every field themselves, or
risk resubmitting a near-duplicate of the request they'd just sent.
Fixed by extracting the initial-state logic into a `getBlankFormData()`
helper (reused for the initial `useState`, so there's one source of
truth) and calling it from the reset button.

Verified live end-to-end, including cleaning up the real rows this
created: filled in the name and narrative fields, did a genuine full
page reload (not just an in-app navigation), reopened Custom Request,
and confirmed both fields restored exactly; submitted the brief for
real and confirmed the draft key was cleared from `localStorage`
afterward; clicked "Submit Another Commission" and confirmed the form
came back completely blank instead of still showing the prior
submission's details. Both real test rows this created in the live
`commission_briefs` table were deleted immediately after, confirmed via
a follow-up count query.

## 33. Submit handlers had no safety net against an unexpected throw

`CommissionView.handleSubmit` and `AuthForm.handleSubmit` both set a
`isSubmitting`/`submitting` flag to disable their button, then relied on
every subsequent `setIsSubmitting(false)` being reached individually
along each success/failure branch. Supabase's query and storage builders
normally resolve with `{ error }` rather than throwing even on a network
failure — but that's not an absolute guarantee for every edge case, and
neither handler had a fallback for one. If anything in between ever
threw instead of resolving normally, every `setIsSubmitting(false)` on
every other branch would be skipped, leaving the submit button
permanently disabled until the visitor thought to reload the page —
with a login form or a commission brief, exactly the two forms an actual
customer (not staff) depends on working.

**Fix**: wrapped both handlers in `try { ... } catch (err) { setError(...)
} finally { setSubmitting(false) }`, so the loading flag always clears
and the visitor always sees a real error message, regardless of how the
operation failed.

Verified live in two parts: forced a genuine synchronous throw (not just
the ordinary `{ error }` path already handled before this change) by
overriding `crypto.randomUUID` — the same call `handleSubmit` makes as
its very first line — to throw, and confirmed the submit button
re-enabled with its normal label instead of staying stuck, and the
thrown error's own message rendered in the visible error banner; then
confirmed the ordinary successful-submission path still works exactly
as before. The one real row this second check created in
`commission_briefs` was deleted immediately after, confirmed via a
follow-up query.

## 34. Disclosure and dialog-opening buttons didn't expose their state

None of the app's toggle buttons that show/hide something told assistive
tech what state they were in. The mobile hamburger menu and both of
AdminView's "Add New Piece"/"Add Archive Piece" inline-form toggles are
real disclosure widgets (they show/hide content in place) but had no
`aria-expanded`, so a screen reader user had no way to know whether
activating them would open or close something, or which state they were
currently in. Separately, the header's Search and Cart buttons (and the
mobile drawer's Search entry) open real modal dialogs but had no
`aria-haspopup`, the standard way to signal that upfront rather than
leaving it a surprise once activated.

**Fix**: added `aria-expanded={state}` to the three disclosure toggles
(mobile menu, both admin add-forms) and `aria-haspopup="dialog"` to the
three dialog-opening buttons (desktop Search, Cart, and the mobile
drawer's Search entry — My Account isn't a dialog, it navigates to a
view, so it didn't need one).

Verified live: toggling the mobile menu three times (closed → open →
closed) showed `aria-expanded` correctly reading `false` → `true` →
`false` at each step.

## 35. Same safety net extended to AdminView's async actions

§33 added try/catch/finally to the two customer-facing submit forms
(login/signup, commission brief). AdminView had the identical
"setSaving(true)/(false) on every individual branch, nothing catching a
throw" pattern across all seven of its own async actions — advancing a
commission or order's stage, sending a quote, toggling sold-out/1-of-1,
and adding or removing a piece from Available Pieces or The Archive.
Wrapped every one in the same `try { ... } catch (err) { showToast(...) }
finally { setSaving/setDeletingId(...) }` shape, so an unexpected failure
surfaces a real toast instead of either silently failing or leaving a
button stuck disabled.

Verified via a clean build and lint pass (no new warnings) — exercising
these live would need a real admin login I don't have credentials for,
same as §29's Toast fix. The change itself is the same mechanical,
low-risk pattern already verified twice this session (§33's forced-throw
test on `CommissionView`/`AuthForm`), just applied consistently rather
than left as an isolated fix on two forms and skipped on the rest.

## 36. Replaced the one remaining native confirm() with the app's own dialog style

`Toast.jsx`'s own comment explicitly frames it as replacing "native
alert()/confirm()-adjacent error popups" — but that pass missed one spot:
`ArchiveCuration`'s "Remove" button still used a raw `window.confirm()`
before permanently deleting a piece from The Archive. A native browser
dialog is unstyled, blocks the whole page, and doesn't match the rest of
this app's design language at all — exactly the inconsistency the Toast
work was meant to eliminate everywhere.

**Fix**: added a small, reusable `ConfirmDialog` component matching
`CartDrawer`/`SearchOverlay`'s established modal shape — same backdrop,
Escape-to-cancel, and the real focus trap from §27's `useFocusTrap` hook
(rather than just `aria-modal` with nothing enforcing it), with
`role="alertdialog"`, the semantically correct role for a confirm/cancel
prompt. Wired it into `ArchiveCuration`: the Remove button now opens the
dialog (tracked via a `pendingRemoval` state holding the item awaiting a
decision) instead of calling `confirm()` directly, and the actual delete
only runs once the dialog's own Confirm button is clicked.

Verified via a clean build and lint pass. The component reuses the exact
same `useFocusTrap` hook, Escape handler, and backdrop-click pattern
already verified live for `CartDrawer`/`SearchOverlay` earlier this
session (§27); exercising this specific call site live would need the
real admin login I don't have credentials for, same constraint as
§29/§35.
