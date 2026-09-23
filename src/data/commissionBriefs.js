// Patron-facing labels, in pipeline order — used by both AdminView's status
// controls and PatronDashboardView's tracker so the two never drift apart.
// ids match the Postgres `commission_status` enum exactly (supabase/migrations/
// 0001_init.sql) — they must, since these ids are compared directly against
// real `commission_briefs.status` values fetched from the database.
export const COMMISSION_STAGES = [
  { id: 'brief_submitted', label: 'Brief Submitted' },
  { id: 'quote_sent', label: 'Quote & Concept Approval' },
  { id: 'in_production', label: 'In Production' },
  { id: 'awaiting_balance', label: 'Awaiting Balance' },
  { id: 'delivered', label: 'Final Delivery' },
];
