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

| Token         | Hex       | Role                                              |
| ------------- | --------- | -------------------------------------------------- |
| `sand`        | `#F9F6F0` | Global background (warm sand/cream)                |
| `terracotta`  | `#A04723` | Primary accent — CTAs, active states, footer block |
| `white`       | `#FFFFFF` | Component block background (cards, forms)          |

This is a deliberately narrow palette: one warm neutral, one deep accent, and
white for elevated surfaces. Don't introduce additional accent hues without
updating this document first.

> **Conflict to resolve**: an earlier pass on this project implemented a
> four-color brand board (Chile Rojo `#AE431E`, Terracota `#D68224`, Olive
> `#8A8B35`, Sunset `#EAC891`) across every component, replacing a previously
> inconsistent color set. This master spec calls for a single terracotta
> (`#A04723`) instead. These are two different, specific hex values for
> "terracotta" from two different instructions — pick one before the next
> implementation pass. See the note at the bottom of this file.

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

The live codebase (Vite + React, plain CSS/JS — see `plan.md`) currently
implements a **different, four-color** palette end-to-end (Chile Rojo,
Terracota, Olive, Sunset) rather than the single-terracotta `#A04723` system
described above, and its hero/cards use a mix of cream (`#F9F6F0`) and
tinted-neutral surfaces rather than strict `bg-white` component blocks. The
structural conventions (rounded corners, soft shadows, borderless cards,
serif + Inter type, lucide icons, Framer Motion) already match this spec.

Before the next implementation pass touches color, confirm with the client
which palette is canonical — the four-color brand board or the single
`#A04723` terracotta — since they were given as two separate, conflicting
instructions.
