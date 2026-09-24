-- Storage for product and archive photos uploaded from the admin
-- dashboard. Until now a piece's photo could only be set by pasting a URL
-- to an image hosted somewhere else, which in practice meant stock photos.
--
-- Public, unlike commission-references (0007): every storefront visitor
-- needs to load these, and public buckets serve files by URL without a
-- select policy. Writes are admin-only, checked the same way every other
-- admin write in this schema is (private.is_admin(), see 0008).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760, -- 10 MiB; the admin UI resizes photos to well under this first
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "Admins can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and private.is_admin());

create policy "Admins can update product images"
  on storage.objects for update
  using (bucket_id = 'product-images' and private.is_admin())
  with check (bucket_id = 'product-images' and private.is_admin());

create policy "Admins can delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and private.is_admin());
