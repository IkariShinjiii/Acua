-- Addresses Supabase security & performance advisor findings.

-- SECURITY: claim_product_if_available and handle_new_user are
-- SECURITY DEFINER functions that should never be callable directly by an
-- API client. claim_product_if_available must only run from a trusted
-- server context (a payment webhook using the service_role key) — right
-- now anyone could call it via /rest/v1/rpc and mark any product sold out
-- with no payment at all. handle_new_user only runs as an auth.users
-- trigger. is_admin() is deliberately left executable by anon/authenticated
-- since RLS policies invoke it under the calling role.
revoke execute on function public.claim_product_if_available(uuid) from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;

-- PERFORMANCE: missing indexes on foreign keys.
create index if not exists commission_briefs_user_id_idx on public.commission_briefs (user_id);
create index if not exists orders_product_id_idx on public.orders (product_id);
create index if not exists orders_user_id_idx on public.orders (user_id);

-- PERFORMANCE: wrap auth.uid() in (select ...) so Postgres evaluates it
-- once per query instead of once per row, and merge duplicate permissive
-- SELECT policies (own-row check + admin-sees-all) into one per table.
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Users view own profile or admins view all" on public.profiles
  for select using ((select auth.uid()) = id or public.is_admin());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update using ((select auth.uid()) = id);

drop policy if exists "Users can view their own briefs" on public.commission_briefs;
create policy "Users can view their own briefs" on public.commission_briefs
  for select using ((select auth.uid()) = user_id or public.is_admin());

drop policy if exists "Users can view their own orders" on public.orders;
drop policy if exists "Admins can manage orders" on public.orders;
create policy "Users view own orders or admins view all" on public.orders
  for select using ((select auth.uid()) = user_id or public.is_admin());
create policy "Admins can insert orders" on public.orders
  for insert with check (public.is_admin());
create policy "Admins can update orders" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete orders" on public.orders
  for delete using (public.is_admin());

-- products/archive_items: the old admin policy was FOR ALL, which
-- duplicated the unconditional "Public can read" policy for SELECT.
-- Scope admin policies to the write actions only.
drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can insert products" on public.products
  for insert with check (public.is_admin());
create policy "Admins can update products" on public.products
  for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete products" on public.products
  for delete using (public.is_admin());

drop policy if exists "Admins can manage archive items" on public.archive_items;
create policy "Admins can insert archive items" on public.archive_items
  for insert with check (public.is_admin());
create policy "Admins can update archive items" on public.archive_items
  for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete archive items" on public.archive_items
  for delete using (public.is_admin());
