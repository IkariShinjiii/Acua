// Mock regular e-commerce orders for the admin's Order Fulfillment Center.
export const ORDERS = [
  {
    id: 'ord-1001',
    customerName: 'Priya Santos',
    items: ['Pearl Drop Chain', 'Solitary Tidal Ear Cuff'],
    total: '₱18,000',
    placedAt: '2026-09-16',
    status: 'processing',
    trackingNumber: null,
  },
  {
    id: 'ord-1000',
    customerName: 'Diego Reyes',
    items: ['Dune Texture Ring'],
    total: '₱27,000',
    placedAt: '2026-09-13',
    status: 'shipped',
    trackingNumber: 'PHLPOST-88213741',
  },
  {
    id: 'ord-999',
    customerName: 'Bea Lorenzana',
    items: ['Woven Sand Bracelet', 'Azure Drop Pendant'],
    total: '₱29,500',
    placedAt: '2026-09-05',
    status: 'delivered',
    trackingNumber: 'PHLPOST-88190552',
  },
];

export const ORDER_STAGES = [
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
];
