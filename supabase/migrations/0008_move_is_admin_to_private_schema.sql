-- Supabase's security advisor flags public.is_admin() as callable directly
-- via /rest/v1/rpc/is_admin by anon/authenticated — it's a SECURITY DEFINER
-- function meant only for internal use inside RLS policies, not a public
-- endpoint. RLS policy evaluation happens inside Postgres itself and isn't
-- limited by PostgREST's exposed-schema config, so moving it to a schema
-- PostgREST doesn't expose (only `public`/`graphql_public` are, by default)
-- removes the direct-callable endpoint while every policy keeps working via
-- a fully-qualified reference.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, anon;

create or replace function private.is_admin()
returns boolean
language sql
stable security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

revoke execute on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated, anon;

alter policy "Admins can update briefs" on public.commission_briefs
  using (private.is_admin());

alter policy "Users view own profile or admins view all" on public.profiles
  using ((select auth.uid()) = id or private.is_admin());

alter policy "Users can view their own briefs" on public.commission_briefs
  using ((select auth.uid()) = user_id or private.is_admin());

alter policy "Users view own orders or admins view all" on public.orders
  using ((select auth.uid()) = user_id or private.is_admin());

alter policy "Admins can insert orders" on public.orders
  with check (private.is_admin());

alter policy "Admins can update orders" on public.orders
  using (private.is_admin())
  with check (private.is_admin());

alter policy "Admins can delete orders" on public.orders
  using (private.is_admin());

alter policy "Admins can insert products" on public.products
  with check (private.is_admin());

alter policy "Admins can update products" on public.products
  using (private.is_admin())
  with check (private.is_admin());

alter policy "Admins can delete products" on public.products
  using (private.is_admin());

alter policy "Admins can insert archive items" on public.archive_items
  with check (private.is_admin());

alter policy "Admins can update archive items" on public.archive_items
  using (private.is_admin())
  with check (private.is_admin());

alter policy "Admins can delete archive items" on public.archive_items
  using (private.is_admin());

alter policy "Admins can read commission references" on storage.objects
  using (bucket_id = 'commission-references' and private.is_admin());

alter policy "Admins can delete commission references" on storage.objects
  using (bucket_id = 'commission-references' and private.is_admin());

drop function public.is_admin();
