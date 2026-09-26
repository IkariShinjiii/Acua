-- The Custom Commission form's accessory categories and material options
-- were hardcoded in src/data/commissionOptions.js -- changing either meant
-- a code deploy. These two lookup tables let the admin manage them
-- instead, seeded with exactly what was already hardcoded so nothing
-- changes on the live form until an admin actually edits something.
--
-- No foreign keys to commission_briefs.category/material or
-- archive_items.material: those columns already stored plain copied
-- text/ids, not live references (categories were never anything but a
-- string; materials were validated at write time in CommissionView, not
-- DB-enforced) -- keeping that same "soft" shape rather than retrofitting
-- referential integrity onto already-shipped tables. CommissionView's
-- existing "does this material id still exist" fallback (see plan.md
-- §6.5) already handles an option being renamed/removed after the fact.
create table public.commission_categories (
  label text primary key,
  sort_order integer not null default 0
);

create table public.commission_materials (
  id text primary key,
  label text not null,
  note text,
  sort_order integer not null default 0
);

insert into public.commission_categories (label, sort_order) values
  ('Necklace / Choker', 0),
  ('Statement Cuff', 1),
  ('Ceremonial / Suite', 2);

insert into public.commission_materials (id, label, note, sort_order) values
  ('non-tarnish-gold-tone', 'Non-Tarnish Gold-Tone Alloy', 'Warm luster, won''t fade or tarnish', 0),
  ('non-tarnish-silver-tone', 'Non-Tarnish Silver-Tone Alloy', 'Cool, clean finish that stays bright', 1),
  ('natural-synthetic-mix', 'Natural & Synthetic Mix', 'Premium beads, natural stone, and resin combined', 2);

alter table public.commission_categories enable row level security;
alter table public.commission_materials enable row level security;

create policy "Public can read commission categories"
  on public.commission_categories for select
  using (true);

create policy "Admins can insert commission categories"
  on public.commission_categories for insert
  with check (private.is_admin());

create policy "Admins can delete commission categories"
  on public.commission_categories for delete
  using (private.is_admin());

create policy "Public can read commission materials"
  on public.commission_materials for select
  using (true);

create policy "Admins can insert commission materials"
  on public.commission_materials for insert
  with check (private.is_admin());

create policy "Admins can update commission materials"
  on public.commission_materials for update
  using (private.is_admin())
  with check (private.is_admin());

create policy "Admins can delete commission materials"
  on public.commission_materials for delete
  using (private.is_admin());
