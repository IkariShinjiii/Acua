-- Fixes "infinite recursion detected in policy for relation profiles" (42P17).
--
-- Cause: every "admins can do X" policy checked
--   exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
-- but that subquery reads from profiles, which re-triggers profiles' own RLS
-- policies (including this same admin check) — infinite recursion the moment
-- RLS evaluates any policy that references profiles, including on profiles
-- itself.
--
-- Fix: a SECURITY DEFINER function to look up is_admin. It runs as the
-- function owner rather than the calling role, so it doesn't re-enter the
-- caller's RLS evaluation the way an inline subquery does. This is the
-- standard, Postgres/Supabase-documented way to avoid self-referential RLS
-- recursion — every policy below now calls public.is_admin() instead of
-- inlining the profiles subquery.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Replace every policy that inlined the recursive subquery.

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles" on public.profiles
  for select using (public.is_admin());

drop policy if exists "Users can view their own briefs" on public.commission_briefs;
create policy "Users can view their own briefs" on public.commission_briefs
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Admins can update briefs" on public.commission_briefs;
create policy "Admins can update briefs" on public.commission_briefs
  for update using (public.is_admin());

drop policy if exists "Users can view their own orders" on public.orders;
create policy "Users can view their own orders" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Admins can manage orders" on public.orders;
create policy "Admins can manage orders" on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage archive items" on public.archive_items;
create policy "Admins can manage archive items" on public.archive_items
  for all using (public.is_admin()) with check (public.is_admin());
