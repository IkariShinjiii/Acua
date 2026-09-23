-- Real in-app checkout (see plan.md's PayMongo GCash plan). An order is
-- inserted the moment a PayMongo Payment Intent is created for it, in this
-- new in-between state -- only a confirmed webhook (or the admin override
-- below, for the rare stuck-webhook case) moves it to 'processing'. Not
-- added to ORDER_STAGES (src/data/orders.js) on purpose: progressing out of
-- it must go through the payment claim, not a generic admin "next stage"
-- click.
alter type public.order_status add value 'awaiting_payment' before 'processing';

-- The table stays one-row-per-product-line (AdminView.jsx/PatronDashboardView.jsx
-- already expect that shape) -- quantity and a shared checkout_group_id are
-- what let several cart lines from one checkout be tied together and
-- fulfilled/tracked as one purchase, without restructuring either view.
-- Nullable throughout: existing rows (and any hand-inserted by an admin)
-- don't have this information, and the one real insert path going forward
-- (the create-checkout Edge Function, below) is what actually requires it.
alter table public.orders
  add column quantity integer not null default 1,
  add column checkout_group_id uuid not null default gen_random_uuid(),
  add column payment_intent_id text,
  add column shipping_name text,
  add column shipping_phone text,
  add column shipping_address text,
  add column shipping_city text,
  add column shipping_province text,
  add column shipping_zip text,
  add column notes text;

-- Manual fallback for the rare case a PayMongo webhook never arrives (a
-- dropped delivery, an outage) and an order is stuck at 'awaiting_payment'
-- despite the customer really having paid. Mirrors how private.is_admin()
-- itself is exposed (0008_move_is_admin_to_private_schema.sql): the grant
-- to `authenticated` is broad, but the internal check is what actually
-- gates it, so only an admin session can make it do anything.
create or replace function public.admin_confirm_order_payment(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_id uuid;
  v_is_one_of_one boolean;
begin
  if not private.is_admin() then
    raise exception 'Not authorized';
  end if;

  select product_id into v_product_id from public.orders where id = p_order_id;
  if v_product_id is null then
    raise exception 'Order not found';
  end if;

  -- Only a 1-of-1 piece needs the atomic sold-out claim -- a repeatable
  -- product selling one unit isn't "sold out" globally.
  select is_one_of_one into v_is_one_of_one from public.products where id = v_product_id;
  if v_is_one_of_one then
    perform public.claim_product_if_available(v_product_id);
  end if;

  update public.orders set status = 'processing' where id = p_order_id;

  return true;
end;
$$;

-- Revoking from PUBLIC alone isn't enough (0006's own note on this) --
-- Supabase's default setup also grants EXECUTE directly to anon on every
-- new function in this schema, confirmed via the security advisor
-- flagging this function as anon-callable right after creation, the same
-- gap 0009's rate-limit function had to work around. The internal
-- private.is_admin() check still rejects a non-admin caller either way,
-- but there's no reason to leave the door open at the grant level too.
revoke execute on function public.admin_confirm_order_payment(uuid) from public;
revoke execute on function public.admin_confirm_order_payment(uuid) from anon;
grant execute on function public.admin_confirm_order_payment(uuid) to authenticated;

-- claim_product_if_available's own comment (0001_init.sql) already says
-- "call this from the payment-confirmation webhook/handler" -- that's
-- exactly what paymongo-webhook is, calling it directly via the
-- service-role client. But 0006's `revoke ... from public` also removed
-- service_role's access (it had no grant of its own, only PUBLIC's, same
-- gap 0009's rate-limit function had to work around) -- without this,
-- every webhook-confirmed 1-of-1 sale would fail with "permission denied"
-- the first time a real payment came in.
grant execute on function public.claim_product_if_available(uuid) to service_role;
