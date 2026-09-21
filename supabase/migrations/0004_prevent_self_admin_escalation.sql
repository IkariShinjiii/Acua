-- The "Users can update their own profile" policy from 0001_init.sql only
-- restricts *which row* (auth.uid() = id) — it never restricted which
-- *columns* can change, and Postgres reuses a bare USING clause as the
-- WITH CHECK for UPDATE when none is given. That means any signed-in user
-- could currently run `.from('profiles').update({ is_admin: true })` on
-- their own row and grant themselves admin. Column-level GRANTs are the
-- correct fix — they apply independently of and in addition to RLS's
-- row-level filtering, so together they say "your own row, and only these
-- columns of it."
--
-- is_admin is intentionally excluded: it's set by hand (SQL editor) only.

revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;
