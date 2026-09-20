// Past sold-out 1-of-1 pieces shown in "The Archive" showcase. `category`
// and `metal` (when set) seed the Commission form when a patron clicks
// "Request Similar Piece" on that item — see plan.md §5.1.
export const ARCHIVE_ITEMS = [
  {
    id: 'arch-1',
    title: 'Raw Sapphire Ring',
    aspect: 'aspect-square',
    mt: '',
    image:
      'https://images.unsplash.com/photo-1603561596112-0a132b757442?auto=format&fit=crop&w=800&q=80',
    alt: 'Custom ring featuring an uncut raw sapphire set in rough, textured silver on dark slate rock',
    category: 'Sculptural Ring',
    metal: '925-silver',
  },
  {
    id: 'arch-2',
    title: 'Molten Gold Pendant',
    aspect: 'aspect-[3/4]',
    mt: 'mt-0 md:mt-8',
    image:
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80',
    alt: 'Sculptural gold pendant looking like melted wax or molten metal',
    category: 'Necklace / Choker',
    metal: '18k-gold',
  },
  {
    id: 'arch-3',
    title: 'Sea Glass Chain',
    aspect: 'aspect-square',
    mt: '',
    image:
      'https://images.unsplash.com/photo-1598560917505-59a3ad559071?auto=format&fit=crop&w=800&q=80',
    alt: 'Delicate silver chain with sea-green seaglass charm resting on textured linen',
    category: 'Necklace / Choker',
    metal: '925-silver',
  },
  {
    id: 'arch-4',
    title: 'Hammered Brass Earrings',
    aspect: 'aspect-[3/4]',
    mt: 'mt-0 md:mt-8',
    image:
      'https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=800&q=80',
    alt: 'Statement earrings made of hammered brass and irregular freshwater pearls on warm sand',
    category: 'Artisanal Earrings',
    // No metal set: brass isn't one of METAL_OPTIONS, so the form's own
    // default stands rather than guessing a mismatched substitute.
  },
];
