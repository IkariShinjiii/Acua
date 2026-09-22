-- 0007 created this bucket with no file_size_limit or allowed_mime_types,
-- so the only real limits were CommissionView.jsx's own client-side checks
-- (8 files, 15MB each, jpeg/png/heic/heif/pdf — see plan.md §73). Those
-- constrain the app's UI, not the bucket itself: nothing stopped a script
-- hitting Supabase Storage's REST API directly with the public anon key
-- (uploads here are intentionally unauthenticated, matching commission_
-- briefs' own "anyone can submit before signing in" policy) from uploading
-- an unbounded number of arbitrarily large files here forever. Matches the
-- limits already enforced in the app, at the one layer a client can't
-- route around.
update storage.buckets
set file_size_limit = 15728640, -- 15 MiB, matching CommissionView's MAX_FILE_BYTES
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'application/pdf']
where id = 'commission-references';
