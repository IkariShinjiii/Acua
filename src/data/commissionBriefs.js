// Mock commission briefs for the admin's Commission Pipeline Management.
// Status values mirror the patron-facing tracker 1:1 (plan.md §5.1):
// 'brief-submitted' | 'quote-sent' | 'in-production' | 'delivered'
export const COMMISSION_BRIEFS = [
  {
    id: 'brief-1',
    patronName: 'Genevieve Dupont',
    email: 'genevieve@example.com',
    category: 'Sculptural Ring',
    material: 'Non-Tarnish Gold-Tone Alloy',
    budget: '₱84,000 – ₱168,000',
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
    material: 'Non-Tarnish Silver-Tone Alloy',
    budget: '₱45,000 – ₱84,000',
    timeline: 'Flexible (4-6 Weeks)',
    narrative:
      'A layered chain piece with a small seaglass pendant, similar to the "Sea Glass Chain" archive piece but longer.',
    referenceImageCount: 1,
    submittedAt: '2026-09-10',
    status: 'quote-sent',
    quotePrice: '₱64,500',
  },
  {
    id: 'brief-3',
    patronName: 'Renz Aquino',
    email: 'renz.aquino@example.com',
    category: 'Statement Cuff',
    material: 'Non-Tarnish Gold-Tone Alloy',
    budget: '₱168,000+',
    timeline: 'No rush — 3 months',
    narrative:
      'A heavy statement cuff, textured finish, for an anniversary gift. Open to the artisan\'s interpretation.',
    referenceImageCount: 0,
    submittedAt: '2026-08-28',
    status: 'in-production',
    quotePrice: '₱190,000',
  },
  {
    id: 'brief-4',
    patronName: 'Isla Fernandez',
    email: 'isla.f@example.com',
    category: 'Artisanal Earrings',
    material: 'Non-Tarnish Silver-Tone Alloy',
    budget: '₱22,000 – ₱45,000',
    timeline: 'Flexible (4-6 Weeks)',
    narrative:
      'Small huggie hoops with a single baroque pearl drop, understated for everyday wear.',
    referenceImageCount: 3,
    submittedAt: '2026-08-15',
    status: 'delivered',
    quotePrice: '₱35,000',
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
