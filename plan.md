# ACUA — Master Site Architecture & Detailed Plan

> This is the client-supplied definitive blueprint for the full Acua
> e-commerce application. It is the target architecture — see
> "Current implementation vs. this plan" at the bottom for how the live
> codebase compares today and what changes migrating to it would require.

## 1. Project overview & core identity

- **Brand name**: Acua (strictly "Acua" — no secondary words like "Atelier").
- **Brand identity**: high-end, artisanal handmade jewelry — 1-of-1 unique
  artifacts plus repeatable collections.
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
| Database/Auth | Firebase (Firestore, Auth, Cloud Storage) or Supabase — prepared for, not yet implemented |
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
2. **Artifact Anatomy & Metals** — jewelry category pills, precious metal
   preference (e.g. Fairmined Gold, Recycled Silver).
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

## Current implementation vs. this plan

The live codebase does **not** yet match this blueprint. Concretely:

| Area          | This plan                          | What's actually in the repo today                        |
| ------------- | ------------------------------------ | ---------------------------------------------------------- |
| Framework     | Next.js 16 App Router + TypeScript  | Vite + plain React (`.jsx`, no TypeScript, no App Router)  |
| Routing       | File-based routes under `app/`      | Single `App.jsx` swapping views via `useState` — no router, no real URLs |
| Pages         | Home, `/collection`, `/commissions`, `/dashboard`, `/admin` | Home + a Commission view only; no collection, dashboard, or admin page |
| Color palette | Single terracotta `#A04723` + white cards + sand bg | Four-color brand board (Chile Rojo/Terracota/Olive/Sunset), already wired through every component |
| Data/Auth     | Firebase or Supabase                | No backend at all — mock arrays in-component               |
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
4. Stand up Firebase or Supabase for auth, products, orders, and commission
   briefs; replace the mock arrays under `src/data/` (see below) — they're
   already isolated from the components that render them, so this step is a
   swap, not a rewrite.
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
│                                     # Firebase/Supabase later touches these files, not the
│                                     # views that render them
└── lib/                             # small shared helpers (imageFallback.js, utils.js)
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
item's category and metal (via a `commissionPrefill` state lifted to
`App.jsx`), matching the resolved decision in §5.1. Availability-based
branching in "Available Pieces" (sold-out → no cart, per §5.1) is not yet
built — `AVAILABLE_PIECES` now has a `soldOut` field the admin can toggle,
but `HomeView`'s product grid doesn't yet read it.

Two dead file groups were removed as part of this pass: `CommissionForm.jsx`/
`ProductCarousel.jsx` (unused duplicate/experimental components) and an
entire unreachable Next.js scaffold at the project root (`app/`, root-level
`components/`) left over from the very first commit, before the project
pivoted to this Vite app — it had no `next` dependency installed and nothing
in the build pointed to it. Removing it also shrank the CSS bundle (Tailwind
had been scanning those dead files for class names).
