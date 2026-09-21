# ACUA — Design System

> Source of truth: the "ACUA — Master Site Architecture & Detailed Plan"
> supplied by the client. This file distills the visual language from that
> blueprint. See `plan.md` for the technical/architecture side, and the
> "Current implementation vs. this spec" note at the bottom — the codebase
> does not yet match this document in full.

## Brand identity

- **Brand name**: **Acua** — strictly "Acua", no secondary words appended
  (e.g. no "Acua Atelier", no taglines baked into the wordmark).
- **Positioning**: high-end, artisanal handmade jewelry. Two product lines:
  1-of-1 unique artifacts, and repeatable collections.
- **Aesthetic**: Dribbble-inspired minimalist luxury — warm, quiet, editorial.

## Color palette

**Resolved**: the codebase's four-color brand board is canonical, not the
single `#A04723` terracotta this master spec originally called for. The
client supplied both as separate instructions at different points; the
four-color board was implemented consistently across every component
(navbar, cards, buttons, forms, footer, carousels) over many later passes,
while the single-terracotta version was never built. Reverting to one flat
accent color at this point would be a real regression — it would strip the
olive/sunset variation that now carries filter states, secondary accents,
and gradient warmth throughout the site — for no benefit the client has
asked for. This entry replaces the single-color table below as the source
of truth; treat any future single-terracotta reference in older docs as
superseded.

| Token         | Hex       | Role                                                |
| ------------- | --------- | ---------------------------------------------------- |
| `sand`        | `#F9F6F0` | Global background (warm sand/cream)                  |
| `chile-rojo`  | `#AE431E` | Primary accent — CTAs, active states, footer block   |
| `terracota`   | `#D68224` | Secondary accent — hover states, gradient warmth     |
| `olive`       | `#8A8B35` | Tertiary accent — "done" states, quiet emphasis      |
| `sunset`      | `#EAC891` | Soft highlight — gradient warmth, subtle fills       |
| `white`       | `#FFFFFF` | Component block background (cards, forms)            |

Don't introduce additional accent hues without updating this document first.

## Shape & elevation

- **Large rounded corners**: `rounded-[32px]` for major wrapping containers
  (hero, page sections), `rounded-2xl` for cards.
- **Zero harsh borders** — the "cloud UI" convention: no visible 1px borders
  on cards or containers; separation comes from background contrast and shadow.
- **Soft, diffused drop shadows** for elevation — always with offset + blur,
  never a flat/hard-edged shadow.

## Typography

- **Display / headings**: a high-end serif — Fraunces or Playfair Display.
- **Body / UI**: Inter (clean sans-serif).

## Icons

`lucide-react` exclusively, one consistent stroke weight across the app.

## Motion

Framer Motion for:
- Buttery-smooth page/view transitions.
- Review-style infinite marquee carousels (New Arrivals) — continuous
  momentum motion, not a scrollbar-driven list; pauses on hover.
- Fade-in reveals for section entrances.

## Layout patterns referenced in the blueprint

- **Navbar**: sticky, transparent sand backdrop; left = nav links (Shop,
  Collections, Custom Request), center = serif "ACUA" wordmark only
  (no secondary branding), right = search + cart icons.
- **Footer**: full-width, deep terracotta block, white typography, links +
  copyright + social handles.
- **Hero**: large rounded container, editorial lifestyle photo, bottom
  terracotta gradient overlay, bold display heading, solid terracotta CTA.
- **Product cards**: pure white background, soft shadow, zero border.
- **Filter pills**: terracotta active state, neutral inactive state.

## Current implementation vs. this spec

The live codebase (Vite + React — see `plan.md`) implements the four-color
palette above end-to-end, and its hero/cards use a mix of cream (`#F9F6F0`)
and tinted-neutral surfaces rather than strict `bg-white` component blocks —
both now treated as intentional rather than gaps. The structural conventions
(rounded corners, soft shadows, borderless cards, serif + Inter type, lucide
icons, Framer Motion) already matched this spec and still do.
