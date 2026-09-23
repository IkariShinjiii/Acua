-- Real deposit/balance payment for the existing commission pipeline (see
-- plan.md's PayMongo GCash plan, Part 2). Extends commission_briefs in
-- place rather than a second, parallel commission system -- quote_price_cents
-- (already on this table) is the one number everything derives from:
-- deposit = round(quote_price_cents / 2), balance = the rest.
--
-- 'awaiting_balance' sits between 'in_production' and 'delivered': admin
-- marks a piece production-complete (moving it here) once it's ready,
-- which is what surfaces a "Pay Balance" button to the patron -- instead of
-- (as today) admin clicking straight from 'in_production' to 'delivered'
-- with no payment step in between at all.
alter type public.commission_status add value 'awaiting_balance' before 'delivered';

-- Nullable throughout, and the existing deposit_paid boolean is untouched --
-- still set true alongside deposit_paid_at, so nothing that already reads
-- it breaks. Only ever written by the paymongo-webhook Edge Function
-- (service role) or the existing admin manual-override buttons.
alter table public.commission_briefs
  add column deposit_payment_intent_id text,
  add column deposit_paid_at timestamptz,
  add column balance_payment_intent_id text,
  add column balance_paid_at timestamptz;
