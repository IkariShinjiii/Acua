-- Backs the new send-notification-email edge function. admin_notified_at
-- is an idempotency guard, not just a timestamp: the "new brief" email is
-- triggered by the (public, unauthenticated -- see 0001_init.sql) submit
-- path, so without a server-side "already sent" check, replaying that same
-- call (a retry, a malicious repeat) would re-email the admin every time.
-- The edge function claims a brief atomically the same way
-- claim_product_if_available claims a product: an UPDATE ... WHERE
-- admin_notified_at is null, and only sends if that UPDATE actually
-- returned a row.
alter table public.commission_briefs
  add column admin_notified_at timestamptz;
