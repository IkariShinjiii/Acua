-- Same optimization 0005 already applied to every other policy that calls
-- auth.uid() — this one insert policy was missed. Wrapping it in (select
-- ...) lets Postgres evaluate it once per query instead of once per row.
alter policy "Public can submit commission briefs" on public.commission_briefs
  with check ((user_id is null) or (user_id = (select auth.uid())));
