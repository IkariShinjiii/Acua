-- ACUA initial schema.
-- Implements the data model resolved in plan.md §5 (commission flow) and
-- §5.2 (1-of-1 inventory: no reservation, first-payment-wins).
--
-- Run via the Supabase CLI (`supabase db push`) or paste into the Dashboard's
-- SQL Editor for a brand-new project.

-- ---------------------------------------------------------------------
-- profiles: one row per authenticated user, mirrors auth.users.
-- is_admin gates the AdminView equivalent once it's rebuilt against this
-- backend — there is no separate roles table since ACUA has one owner.
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- products: the "Available Pieces" catalog (repeatable + 1-of-1 items).
-- is_one_of_one + sold_out together drive the §5.1 storefront branch:
-- sold_out = true means "Request Similar" replaces "Add to Cart".
-- ---------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  material text,
  description text,
  price_cents integer not null,
  image_url text,
  fallback_image_url text,
  is_one_of_one boolean not null default false,
  sold_out boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- archive_items: past sold 1-of-1 pieces shown in "The Archive".
-- category/metal seed the Commission form's pre-fill (§5.1).
-- ---------------------------------------------------------------------
create table public.archive_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  metal text,
  image_url text not null,
  alt_text text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- commission_briefs: mirrors the patron-facing tracker 1:1 (plan.md §5.1).
-- user_id starts null — a brief is submitted before the auth gate; the
-- handle_new_user trigger below claims it by matching email at signup.
-- ---------------------------------------------------------------------
create type public.commission_status as enum (
  'brief_submitted',
  'quote_sent',
  'in_production',
  'delivered'
);

create table public.commission_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  category text not null,
  metal text not null,
  budget_range text,
  timeline text,
  narrative text,
  reference_image_urls text[] not null default '{}',
  status public.commission_status not null default 'brief_submitted',
  quote_price_cents integer,
  deposit_paid boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- orders: regular e-commerce orders (distinct from commission_briefs —
-- see plan.md §5.1's note that a commission needs its own record).
-- ---------------------------------------------------------------------
create type public.order_status as enum ('processing', 'shipped', 'delivered');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  product_id uuid not null references public.products (id),
  total_cents integer not null,
  status public.order_status not null default 'processing',
  tracking_number text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- §5.2: atomic "first payment wins" claim for 1-of-1 products.
-- Call this from the payment-confirmation webhook/handler, never from the
-- client directly. Returns false (no-op) if another payment already
-- claimed it first — that false result is what should trigger the
-- automatic refund path for the losing payment.
-- ---------------------------------------------------------------------
create or replace function public.claim_product_if_available(p_product_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claimed boolean := false;
begin
  update public.products
  set sold_out = true
  where id = p_product_id and sold_out = false
  returning true into v_claimed;

  return coalesce(v_claimed, false);
end;
$$;

-- ---------------------------------------------------------------------
-- Auto-create a profile on signup, and claim any commission brief(s)
-- submitted with this email before the account existed (plan.md §5.1's
-- "linking a pre-auth brief to the account created afterward").
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');

  update public.commission_briefs
  set user_id = new.id
  where email = new.email and user_id is null;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.archive_items enable row level security;
alter table public.commission_briefs enable row level security;
alter table public.orders enable row level security;

-- Storefront browsing needs no auth: products/archive are public reads.
create policy "Public can read products" on public.products
  for select using (true);

create policy "Public can read archive items" on public.archive_items
  for select using (true);

-- Anyone can submit a brief, including signed-out visitors (§5.1: the auth
-- gate comes after submission, not before).
create policy "Public can submit commission briefs" on public.commission_briefs
  for insert with check (true);

-- Patrons see their own profile; the owner (is_admin) sees everyone's.
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Admins can view all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- Patrons see their own briefs/orders; the owner sees and manages all.
create policy "Users can view their own briefs" on public.commission_briefs
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "Admins can update briefs" on public.commission_briefs
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "Users can view their own orders" on public.orders
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "Admins can manage orders" on public.orders
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "Admins can manage products" on public.products
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "Admins can manage archive items" on public.archive_items
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );
