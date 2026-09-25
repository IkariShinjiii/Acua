-- Refund requests and their resolution, for either a regular order or a
-- commission. Nothing about actual payment reversal here -- checkout and
-- commission payments are still fully manual today (a QR code sent
-- directly, per plan.md), so a "refund" right now means the admin sends
-- money back by hand; this table is what makes that a tracked request/
-- approval workflow instead of something handled entirely outside the
-- system with no record at all.
create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  commission_brief_id uuid references public.commission_briefs(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  amount_cents integer,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'processed')),
  initiated_by text not null default 'patron' check (initiated_by in ('patron', 'admin')),
  admin_notes text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  constraint refunds_exactly_one_target check (
    (order_id is not null and commission_brief_id is null) or
    (order_id is null and commission_brief_id is not null)
  )
);

create index refunds_user_id_idx on public.refunds (user_id);
create index refunds_order_id_idx on public.refunds (order_id);
create index refunds_commission_brief_id_idx on public.refunds (commission_brief_id);

alter table public.refunds enable row level security;

-- A patron can only request a refund against an order or commission that
-- is actually theirs -- checked here, not just trusted from the client,
-- the same way every other patron-writable table in this schema is.
create policy "Patrons can request a refund on their own order or commission"
  on public.refunds for insert
  with check (
    user_id = (select auth.uid())
    and initiated_by = 'patron'
    and status = 'pending'
    and (
      (order_id is not null and exists (
        select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())
      ))
      or
      (commission_brief_id is not null and exists (
        select 1 from public.commission_briefs cb where cb.id = commission_brief_id and cb.user_id = (select auth.uid())
      ))
    )
  );

create policy "Admins can create a refund"
  on public.refunds for insert
  with check (private.is_admin());

create policy "Patrons can view their own refunds"
  on public.refunds for select
  using (user_id = (select auth.uid()) or private.is_admin());

create policy "Admins can update refunds"
  on public.refunds for update
  using (private.is_admin())
  with check (private.is_admin());
