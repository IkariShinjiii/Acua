// Mock commission briefs for the admin's Commission Pipeline Management.
// Status values mirror the patron-facing tracker 1:1 (plan.md §5.1):
// 'brief-submitted' | 'quote-sent' | 'in-production' | 'delivered'
export const COMMISSION_BRIEFS = [
  {
    id: 'brief-1',
    patronName: 'Genevieve Dupont',
    email: 'genevieve@example.com',
    category: 'Sculptural Ring',
    metal: '18k Fairmined Gold',
    budget: '$1,500 – $3,000',
    timeline: 'Wedding Date / 6 Weeks',
    narrative:
      'Inspired by "Raw Sapphire Ring" from The Archive — I want something similar but with a moonstone instead of sapphire, and a thinner band.',
    referenceImageCount: 2,
    submittedAt: '2026-09-14',
    status: 'brief-submitted',
    quotePrice: null,
  },
  {
    id: 'brief-2',
    patronName: 'Mara Villanueva',
    email: 'mara.v@example.com',
    category: 'Necklace / Choker',
    metal: '925 Recycled Silver',
    budget: '$800 – $1,500',
    timeline: 'Flexible (4-6 Weeks)',
    narrative:
      'A layered chain piece with a small seaglass pendant, similar to the "Sea Glass Chain" archive piece but longer.',
    referenceImageCount: 1,
    submittedAt: '2026-09-10',
    status: 'quote-sent',
    quotePrice: '$1,150',
  },
  {
    id: 'brief-3',
    patronName: 'Renz Aquino',
    email: 'renz.aquino@example.com',
    category: 'Molten Cuff',
    metal: '14k Warm Rose Gold',
    budget: '$3,000+',
    timeline: 'No rush — 3 months',
    narrative:
      'A heavy statement cuff, hammered texture, for an anniversary gift. Open to the artisan\'s interpretation.',
    referenceImageCount: 0,
    submittedAt: '2026-08-28',
    status: 'in-production',
    quotePrice: '$3,400',
  },
  {
    id: 'brief-4',
    patronName: 'Isla Fernandez',
    email: 'isla.f@example.com',
    category: 'Artisanal Earrings',
    metal: '925 Recycled Silver',
    budget: '$400 – $800',
    timeline: 'Flexible (4-6 Weeks)',
    narrative:
      'Small huggie hoops with a single baroque pearl drop, understated for everyday wear.',
    referenceImageCount: 3,
    submittedAt: '2026-08-15',
    status: 'delivered',
    quotePrice: '$620',
  },
];

// Patron-facing labels, in pipeline order — used for both the admin's status
// dropdown and the patron dashboard's tracker so the two never drift apart.
export const COMMISSION_STAGES = [
  { id: 'brief-submitted', label: 'Brief Submitted' },
  { id: 'quote-sent', label: 'Quote & Concept Approval' },
  { id: 'in-production', label: 'In Production' },
  { id: 'delivered', label: 'Final Delivery' },
];
