-- DropLinq initial schema
-- Run in the Supabase SQL editor (or via CLI) as a single migration.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Shared catalogs (readable by authenticated users)
-- ---------------------------------------------------------------------------

create table if not exists public.regions (
  id text primary key,
  name text not null,
  country_code text not null,
  active boolean not null default true
);

create table if not exists public.retailers (
  id text primary key,
  name text not null,
  website_url text,
  active boolean not null default true
);

create table if not exists public.retailer_regions (
  id uuid primary key default gen_random_uuid(),
  retailer_id text not null references public.retailers(id) on delete cascade,
  region_id text not null references public.regions(id) on delete cascade,
  website_url text,
  active boolean not null default true,
  unique (retailer_id, region_id)
);

create table if not exists public.tcgs (
  id text primary key,
  name text not null,
  active boolean not null default true
);

create table if not exists public.product_categories (
  id text primary key,
  tcg_id text not null references public.tcgs(id) on delete cascade,
  name text not null,
  slug text not null,
  active boolean not null default true,
  unique (tcg_id, slug)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  retailer_id text not null references public.retailers(id),
  region_id text not null references public.regions(id),
  tcg_id text not null references public.tcgs(id),
  category_id text not null references public.product_categories(id),
  external_product_id text not null,
  name text not null,
  product_url text not null,
  image_url text,
  price numeric(12, 2),
  currency text default 'CAD',
  current_stock_status text not null default 'unknown'
    check (current_stock_status in ('in-stock', 'out-of-stock', 'preorder', 'coming-soon', 'unknown')),
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (retailer_id, region_id, external_product_id)
);

create index if not exists products_region_idx on public.products (region_id);
create index if not exists products_status_idx on public.products (current_stock_status);

create table if not exists public.stock_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  previous_status text,
  new_status text not null,
  event_kind text not null default 'restock'
    check (event_kind in ('restock', 'new_product', 'preorder', 'sold_out', 'coming_soon')),
  price numeric(12, 2),
  detected_at timestamptz not null default now(),
  verified_at timestamptz,
  verification_status text not null default 'detected'
    check (verification_status in ('detected', 'verified', 'rejected', 'unverified')),
  source text not null default 'monitor',
  confidence_score numeric(4, 3) not null default 0,
  unique_key text unique
);

create index if not exists stock_events_product_idx on public.stock_events (product_id, detected_at desc);

create table if not exists public.alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stock_event_id uuid not null references public.stock_events(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sent_at timestamptz not null default now(),
  unique (user_id, stock_event_id)
);

-- ---------------------------------------------------------------------------
-- User-owned tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  date_of_birth date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  subscription_tier text not null default 'FREE'
    check (subscription_tier in ('FREE', 'PRO', 'PRO_PLUS')),
  onboarding_completed boolean not null default false,
  alerts_active boolean not null default true,
  selected_region_id text not null default 'ca' references public.regions(id)
);

create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table if not exists public.user_category_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tcg_id text not null references public.tcgs(id) on delete cascade,
  category_id text not null references public.product_categories(id) on delete cascade,
  enabled boolean not null default true,
  unique (user_id, category_id)
);

create table if not exists public.user_retailer_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  retailer_id text not null references public.retailers(id) on delete cascade,
  region_id text not null references public.regions(id) on delete cascade,
  enabled boolean not null default true,
  unique (user_id, retailer_id, region_id)
);

create table if not exists public.alert_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  restock_alerts boolean not null default true,
  new_release_alerts boolean not null default true,
  preorder_alerts boolean not null default true,
  push_notifications_enabled boolean not null default true,
  alert_sound_enabled boolean not null default true,
  drop_mode_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null,
  platform text not null default 'ios',
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tier text not null default 'FREE'
    check (tier in ('FREE', 'PRO', 'PRO_PLUS')),
  status text not null default 'active'
    check (status in ('active', 'canceled', 'expired', 'trialing')),
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (user_id)
);

-- ---------------------------------------------------------------------------
-- Profile bootstrap
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;

  insert into public.alert_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.subscriptions (user_id, tier, status)
  values (new.id, 'FREE', 'active')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.regions enable row level security;
alter table public.retailers enable row level security;
alter table public.retailer_regions enable row level security;
alter table public.tcgs enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.stock_events enable row level security;
alter table public.profiles enable row level security;
alter table public.watchlists enable row level security;
alter table public.user_category_preferences enable row level security;
alter table public.user_retailer_preferences enable row level security;
alter table public.alert_preferences enable row level security;
alter table public.push_tokens enable row level security;
alter table public.subscriptions enable row level security;
alter table public.alert_deliveries enable row level security;

create policy "catalog_read" on public.regions for select to authenticated using (true);
create policy "catalog_read" on public.retailers for select to authenticated using (true);
create policy "catalog_read" on public.retailer_regions for select to authenticated using (true);
create policy "catalog_read" on public.tcgs for select to authenticated using (true);
create policy "catalog_read" on public.product_categories for select to authenticated using (true);
create policy "catalog_read" on public.products for select to authenticated using (true);
create policy "verified_events_read" on public.stock_events
  for select to authenticated
  using (verification_status in ('verified', 'detected'));

create policy "own_profile_select" on public.profiles for select using (auth.uid() = id);
create policy "own_profile_update" on public.profiles for update using (auth.uid() = id);

create policy "own_watchlists" on public.watchlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_category_prefs" on public.user_category_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_retailer_prefs" on public.user_retailer_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_alert_prefs" on public.alert_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_push_tokens" on public.push_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_subscriptions_select" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "own_deliveries_select" on public.alert_deliveries
  for select using (auth.uid() = user_id);

-- Service role (monitor backend) bypasses RLS. Never ship the service role key in the app.

-- ---------------------------------------------------------------------------
-- Seed: Canada-first catalog metadata (not live inventory)
-- ---------------------------------------------------------------------------

insert into public.regions (id, name, country_code, active) values
  ('ca', 'Canada', 'CA', true),
  ('us', 'United States', 'US', true),
  ('uk', 'United Kingdom', 'GB', true),
  ('de', 'Germany', 'DE', true),
  ('au', 'Australia', 'AU', true),
  ('nz', 'New Zealand', 'NZ', true),
  ('jp', 'Japan', 'JP', true)
on conflict (id) do nothing;

insert into public.retailers (id, name, website_url, active) values
  ('pokemon-center', 'Pokémon Center', 'https://www.pokemoncenter.com', true)
on conflict (id) do nothing;

insert into public.retailer_regions (retailer_id, region_id, website_url, active) values
  ('pokemon-center', 'ca', 'https://www.pokemoncenter.com/en-ca', true),
  ('pokemon-center', 'us', 'https://www.pokemoncenter.com', true),
  ('pokemon-center', 'uk', 'https://www.pokemoncenter.com/en-gb', true),
  ('pokemon-center', 'de', 'https://www.pokemoncenter.com/de-de', true),
  ('pokemon-center', 'au', 'https://www.pokemoncenter.com/en-au', true),
  ('pokemon-center', 'nz', 'https://www.pokemoncenter.com/en-nz', true),
  ('pokemon-center', 'jp', 'https://www.pokemoncenter-online.com', true)
on conflict (retailer_id, region_id) do nothing;

insert into public.tcgs (id, name, active) values
  ('pokemon', 'Pokémon', true),
  ('one-piece', 'One Piece', false),
  ('yugioh', 'Yu-Gi-Oh!', false),
  ('mtg', 'Magic: The Gathering', false)
on conflict (id) do nothing;

insert into public.product_categories (id, tcg_id, name, slug, active) values
  ('pokemon-etb', 'pokemon', 'Elite Trainer Boxes', 'etb', true),
  ('pokemon-booster-bundle', 'pokemon', 'Booster Bundles', 'booster-bundle', true),
  ('pokemon-booster-box', 'pokemon', 'Booster Boxes', 'booster-box', true),
  ('pokemon-upc', 'pokemon', 'Ultra-Premium Collections', 'upc', true)
on conflict (id) do nothing;
