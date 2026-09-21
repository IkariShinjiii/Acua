// Mock catalog data for the "Available Pieces" grid. Shaped the way a real
// products API response would look, so swapping this for a fetch later is a
// drop-in replacement rather than a rewrite.
export const AVAILABLE_PIECES = [
  {
    id: 'ap-1',
    title: 'Pearl Drop Chain',
    category: 'Necklaces',
    material: 'Non-Tarnish Gold-Tone Chain & Freshwater Pearl',
    description:
      'A single, luminous freshwater pearl suspended on a hand-finished non-tarnish gold-tone chain.',
    price: '₱10,000',
    soldOut: false,
    image:
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80',
    fallback:
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'ap-2',
    title: 'Hammered Stacking Set',
    category: 'Rings',
    material: 'Non-Tarnish Silver-Tone Alloy',
    description:
      'Trio of slim, organically textured stacking bands finished in non-tarnish silver-tone to evoke gentle coastal tide lines.',
    price: '₱8,500',
    soldOut: false,
    image:
      'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1000&q=80',
    fallback:
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'ap-3',
    title: 'Woven Sand Bracelet',
    category: 'Bracelets',
    material: 'Non-Tarnish Gold-Tone Beads & Waxed Cord',
    description:
      'Intricately braided waxed cord with a sculptural non-tarnish gold-tone clasp inspired by windswept coastal grass.',
    price: '₱16,000',
    soldOut: false,
    image:
      'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=1000&q=80',
    fallback:
      'https://images.unsplash.com/photo-1611591475887-f8232bfdf1fb?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'ap-4',
    title: 'Solitary Tidal Ear Cuff',
    category: 'Earrings',
    material: 'Non-Tarnish Silver-Tone Alloy',
    description:
      'Textured non-tarnish silver-tone ear cuff designed to hug the upper ear curve comfortably without piercing.',
    price: '₱8,000',
    soldOut: false,
    image:
      'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1000&q=80',
    fallback:
      'https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'ap-5',
    title: 'Dune Texture Ring',
    category: 'Rings',
    material: 'Non-Tarnish Gold-Tone Alloy',
    description:
      'Substantially weighted band hand-finished with hammered-texture facets that catch the ocean light.',
    price: '₱27,000',
    soldOut: false,
    image:
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=80',
    fallback:
      'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'ap-6',
    title: 'Azure Drop Pendant',
    category: 'Necklaces',
    material: 'Natural Aquamarine Chip & Non-Tarnish Silver-Tone Setting',
    description:
      'Raw natural aquamarine chips set by hand in a non-tarnish silver-tone pendant setting.',
    price: '₱13,500',
    soldOut: false,
    image:
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80',
    fallback:
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=80',
  },
];

export const FILTER_TABS = ['All', 'Necklaces', 'Bracelets', 'Rings', 'Earrings'];
