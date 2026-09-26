-- Which courier an order actually shipped with. A closed set matching
-- the two candidates the client is choosing between (plus a fallback),
-- not a free-text field, so the admin form and the tracking-link lookup
-- in src/data/couriers.js can't drift out of sync with each other.
alter table public.orders
  add column courier text check (courier in ('jt', 'lbc', 'other'));
