-- Storage bucket for commission brief reference images. Private (not
-- public) since these can be personal inspiration photos — only the
-- submitting patron's own upload (write) and the admin (read) should
-- access them, matching the same trust model as commission_briefs itself
-- (public insert, admin-only broad read).
insert into storage.buckets (id, name, public)
values ('commission-references', 'commission-references', false)
on conflict (id) do nothing;

-- Anyone can upload a reference image at submission time (mirrors
-- "Public can submit commission briefs" — the brief itself is inserted
-- before any auth gate, per plan.md 5.1).
create policy "Anyone can upload commission references"
  on storage.objects for insert
  with check (bucket_id = 'commission-references');

-- Only admins can read them back (AdminView is the only place they're
-- displayed today; a patron-facing view of their own uploads isn't built).
create policy "Admins can read commission references"
  on storage.objects for select
  using (bucket_id = 'commission-references' and public.is_admin());

create policy "Admins can delete commission references"
  on storage.objects for delete
  using (bucket_id = 'commission-references' and public.is_admin());
