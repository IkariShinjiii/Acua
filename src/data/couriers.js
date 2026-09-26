// Tracking-link support for the couriers ACUA is choosing between. Every
// id here must match the `orders.courier` check constraint
// (0021_order_courier.sql) exactly, and the same ids are duplicated in
// supabase/functions/send-notification-email/index.ts (an edge function
// can't import from src/), so a change here needs both other spots
// updated too.
//
// J&T's `?waybillNo=` query param was confirmed live -- loading it with a
// real number pre-filled the tracking field on their own site. LBC's site
// blocks automated requests before any query-param pattern could be
// confirmed the same way, so it only links to the plain tracking page
// (still a real, correct link) rather than guessing a param that might
// silently 404 or ignore the number, which would look more broken than
// no deep link at all.
export const COURIERS = [
  {
    id: 'jt',
    label: 'J&T Express',
    trackingUrl: (trackingNumber) =>
      `https://www.jtexpress.ph/trajectoryQuery?waybillNo=${encodeURIComponent(trackingNumber)}`,
  },
  {
    id: 'lbc',
    label: 'LBC Express',
    trackingUrl: () => 'https://www.lbcexpress.com/track/',
  },
  {
    id: 'other',
    label: 'Other',
    trackingUrl: null,
  },
];

export function courierById(id) {
  return COURIERS.find((c) => c.id === id) ?? null;
}
