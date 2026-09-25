// Fallback defaults for the Custom Commission request form's accessory
// categories and material options -- the actual, admin-editable lists now
// live in the commission_categories/commission_materials tables
// (0019_commission_options.sql, seeded with these exact same values) and
// are fetched via lib/commissionOptionsFetch.js. These arrays are what
// every consuming view renders with before that fetch resolves (or if it
// ever fails), so the form is never left with nothing to show.
export const JEWELRY_CATEGORIES = [
  'Necklace / Choker',
  'Statement Cuff',
  'Ceremonial / Suite',
];

export const MATERIAL_OPTIONS = [
  { id: 'non-tarnish-gold-tone', label: 'Non-Tarnish Gold-Tone Alloy', note: 'Warm luster, won\'t fade or tarnish' },
  { id: 'non-tarnish-silver-tone', label: 'Non-Tarnish Silver-Tone Alloy', note: 'Cool, clean finish that stays bright' },
  { id: 'natural-synthetic-mix', label: 'Natural & Synthetic Mix', note: 'Premium beads, natural stone, and resin combined' },
];

export const BUDGET_TIERS = [
  { id: 'tier-1', range: '₱22,000 – ₱45,000', label: 'Single Stone / Band' },
  { id: 'tier-2', range: '₱45,000 – ₱84,000', label: 'Handcrafted Assembly' },
  { id: 'tier-3', range: '₱84,000 – ₱168,000', label: 'Raw Pearl / Gem' },
  { id: 'tier-4', range: '₱168,000+', label: 'Heirloom Suite' },
];

// A dropdown, not free text — a patron typing their own timeline had no
// steer toward what's actually realistic for a handmade piece, and no way
// to know "Wednesday" isn't a real option. A hard deadline (a wedding date,
// an anniversary) still has somewhere to go: the narrative field below.
export const TIMELINE_OPTIONS = [
  'Rush (1-2 Weeks)',
  'Standard (2-4 Weeks)',
  'Flexible (4-6 Weeks)',
  'No Rush (6-8+ Weeks)',
  'Specific Date (mention it in the notes below)',
];
