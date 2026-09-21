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
