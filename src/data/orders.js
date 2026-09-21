// Patron-facing labels, in pipeline order — ids match the Postgres
// `order_status` enum exactly (supabase/migrations/0001_init.sql), since
// they're compared directly against real `orders.status` values.
export const ORDER_STAGES = [
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
];
