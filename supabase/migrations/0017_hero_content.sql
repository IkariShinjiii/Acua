-- The homepage hero (image, heading, subtext) was hardcoded in HomeView.jsx
-- -- the only way to change it was a code deploy. This makes it editable
-- from AdminView, the same way products/archive items already are.
--
-- Singleton table: exactly one row, enforced by the id=1 check, seeded with
-- the content that was previously hardcoded so the storefront's live output
-- doesn't change until an admin edits it.
create table public.hero_content (
  id smallint primary key default 1 check (id = 1),
  image_url text not null,
  heading text not null,
  subtext text not null,
  updated_at timestamptz not null default now()
);

insert into public.hero_content (id, image_url, heading, subtext) values (
  1,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85',
  'Naturally rooted, intentionally designed.',
  'Handcrafted accessories inspired by the tides — non-tarnish finishes, natural stones, and salvaged sea glass for coastal permanence.'
);

alter table public.hero_content enable row level security;

-- Public read: every storefront visitor loads the hero. Same "public read,
-- admin write" shape as products/archive_items (see 0001_init.sql).
create policy "Anyone can view hero content"
  on public.hero_content for select
  using (true);

create policy "Admins can update hero content"
  on public.hero_content for update
  using (private.is_admin())
  with check (private.is_admin());
