-- 0005's REVOKE ... FROM anon, authenticated didn't actually close anything:
-- Postgres grants EXECUTE to PUBLIC by default when a function is created,
-- and every role (including anon/authenticated) implicitly has whatever
-- PUBLIC has, regardless of a revoke targeted at the named role. Revoking
-- from PUBLIC is what's actually required to remove default access.
-- Verified via has_function_privilege() before and after — anon/authenticated
-- could still execute both functions after 0005 alone.
revoke execute on function public.claim_product_if_available(uuid) from public;
revoke execute on function public.handle_new_user() from public;

-- is_admin() must stay executable — RLS policies invoke it under the
-- calling role (anon or authenticated), including via PUBLIC.
