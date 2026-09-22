-- handle_new_user() (0001_init.sql) read new.raw_user_meta_data ->> 'full_name'
-- exclusively, which is exactly the key AuthContext.signUp's email/password
-- flow sets (options.data.full_name) — but Google's OAuth metadata isn't
-- guaranteed to use that same key. Falling back to 'name' (a very common
-- key Google-populated metadata does use) means a Google sign-up still gets
-- a real display name in profiles instead of silently landing null.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  );

  update public.commission_briefs
  set user_id = new.id
  where email = new.email and user_id is null;

  return new;
end;
$$;
