-- DropLinq: Pokémon Center-first filtering architecture
-- Run after 001_init.sql and 002_legal_acceptance.sql

-- ---------------------------------------------------------------------------
-- Hierarchical categories (TCG-scoped)
-- ---------------------------------------------------------------------------

alter table public.product_categories
  add column if not exists parent_id text references public.product_categories(id),
  add column if not exists sort_order int not null default 0,
  add column if not exists group_key text,
  add column if not exists is_popular boolean not null default false,
  add column if not exists is_other_fallback boolean not null default false;

-- Retailer-aware category availability
create table if not exists public.retailer_product_categories (
  id uuid primary key default gen_random_uuid(),
  retailer_id text not null references public.retailers(id) on delete cascade,
  region_id text references public.regions(id) on delete cascade,
  category_id text not null references public.product_categories(id) on delete cascade,
  active boolean not null default true,
  unique (retailer_id, region_id, category_id)
);

create index if not exists retailer_product_categories_lookup_idx
  on public.retailer_product_categories (retailer_id, region_id);

-- ---------------------------------------------------------------------------
-- Tags
-- ---------------------------------------------------------------------------

create table if not exists public.tags (
  id text primary key,
  tcg_id text not null references public.tcgs(id) on delete cascade,
  name text not null,
  slug text not null,
  tag_type text not null default 'general'
    check (tag_type in ('general', 'format', 'release', 'exclusive', 'popular', 'other')),
  active boolean not null default true,
  unique (tcg_id, slug)
);

create table if not exists public.product_tags (
  product_id uuid not null references public.products(id) on delete cascade,
  tag_id text not null references public.tags(id) on delete cascade,
  primary key (product_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- Product classification columns
-- ---------------------------------------------------------------------------

alter table public.products
  add column if not exists is_tcg_product boolean not null default true,
  add column if not exists is_sealed boolean not null default true,
  add column if not exists primary_category_id text references public.product_categories(id),
  add column if not exists subcategory_id text references public.product_categories(id),
  add column if not exists classification_status text not null default 'classified'
    check (classification_status in ('classified', 'needs_review', 'excluded', 'unknown'));

-- category_id was required; keep it but allow using primary_category_id going forward
alter table public.products
  alter column category_id drop not null;

-- ---------------------------------------------------------------------------
-- User coverage preferences (retailer + region + tcg scoped)
-- ---------------------------------------------------------------------------

create table if not exists public.user_coverage_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  retailer_id text not null references public.retailers(id) on delete cascade,
  region_id text not null references public.regions(id) on delete cascade,
  tcg_id text not null references public.tcgs(id) on delete cascade,
  coverage_mode text not null default 'ALL_TCG'
    check (coverage_mode in ('POPULAR', 'ALL_TCG', 'CUSTOM')),
  include_other_tcg_products boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (user_id, retailer_id, region_id, tcg_id)
);

create table if not exists public.user_custom_category_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  retailer_id text not null references public.retailers(id) on delete cascade,
  region_id text not null references public.regions(id) on delete cascade,
  tcg_id text not null references public.tcgs(id) on delete cascade,
  category_id text not null references public.product_categories(id) on delete cascade,
  enabled boolean not null default true,
  unique (user_id, retailer_id, region_id, tcg_id, category_id)
);

create table if not exists public.user_custom_tag_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  retailer_id text not null references public.retailers(id) on delete cascade,
  region_id text not null references public.regions(id) on delete cascade,
  tcg_id text not null references public.tcgs(id) on delete cascade,
  tag_id text not null references public.tags(id) on delete cascade,
  enabled boolean not null default true,
  unique (user_id, retailer_id, region_id, tcg_id, tag_id)
);

alter table public.retailer_product_categories enable row level security;
alter table public.tags enable row level security;
alter table public.product_tags enable row level security;
alter table public.user_coverage_preferences enable row level security;
alter table public.user_custom_category_preferences enable row level security;
alter table public.user_custom_tag_preferences enable row level security;

drop policy if exists "catalog_read" on public.retailer_product_categories;
create policy "catalog_read" on public.retailer_product_categories for select to authenticated using (true);
drop policy if exists "catalog_read" on public.tags;
create policy "catalog_read" on public.tags for select to authenticated using (true);
drop policy if exists "catalog_read" on public.product_tags;
create policy "catalog_read" on public.product_tags for select to authenticated using (true);

drop policy if exists "own_coverage" on public.user_coverage_preferences;
create policy "own_coverage" on public.user_coverage_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own_custom_cats" on public.user_custom_category_preferences;
create policy "own_custom_cats" on public.user_custom_category_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own_custom_tags" on public.user_custom_tag_preferences;
create policy "own_custom_tags" on public.user_custom_tag_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Seed: Pokémon Center Pokémon TCG category tree (Canada-first)
-- Configurable later via admin; mobile reads this catalog.
-- ---------------------------------------------------------------------------

insert into public.product_categories (id, tcg_id, name, slug, active, parent_id, sort_order, group_key, is_popular, is_other_fallback) values
  ('pokemon-group-popular', 'pokemon', 'Popular Drops', 'group-popular', true, null, 10, 'POPULAR', true, false),
  ('pokemon-pc-etb', 'pokemon', 'Pokémon Center Elite Trainer Boxes', 'pc-etb', true, 'pokemon-group-popular', 11, 'POPULAR', true, false),
  ('pokemon-premium-collections', 'pokemon', 'Premium Collections', 'premium-collections', true, 'pokemon-group-popular', 12, 'POPULAR', true, false),
  ('pokemon-upc', 'pokemon', 'Ultra-Premium Collections', 'upc', true, 'pokemon-group-popular', 13, 'POPULAR', true, false),
  ('pokemon-major-special', 'pokemon', 'Major Special Releases', 'major-special', true, 'pokemon-group-popular', 14, 'POPULAR', true, false),

  ('pokemon-group-collections', 'pokemon', 'Collections & Special Products', 'group-collections', true, null, 20, 'COLLECTIONS', false, false),
  ('pokemon-collection-boxes', 'pokemon', 'Collection Boxes', 'collection-boxes', true, 'pokemon-group-collections', 21, 'COLLECTIONS', false, false),
  ('pokemon-special-collections', 'pokemon', 'Special Collections', 'special-collections', true, 'pokemon-group-collections', 22, 'COLLECTIONS', false, false),
  ('pokemon-poster-collections', 'pokemon', 'Poster Collections', 'poster-collections', true, 'pokemon-group-collections', 23, 'COLLECTIONS', false, false),
  ('pokemon-sticker-collections', 'pokemon', 'Sticker Collections', 'sticker-collections', true, 'pokemon-group-collections', 24, 'COLLECTIONS', false, false),
  ('pokemon-pin-collections', 'pokemon', 'Pin Collections', 'pin-collections', true, 'pokemon-group-collections', 25, 'COLLECTIONS', false, false),
  ('pokemon-figure-collections', 'pokemon', 'Figure Collections', 'figure-collections', true, 'pokemon-group-collections', 26, 'COLLECTIONS', false, false),

  ('pokemon-group-tins', 'pokemon', 'Tins & Collector Products', 'group-tins', true, null, 30, 'TINS', false, false),
  ('pokemon-mini-tins', 'pokemon', 'Mini Tins', 'mini-tins', true, 'pokemon-group-tins', 31, 'TINS', false, false),
  ('pokemon-collector-tins', 'pokemon', 'Collector Tins', 'collector-tins', true, 'pokemon-group-tins', 32, 'TINS', false, false),
  ('pokemon-premium-tins', 'pokemon', 'Premium Tins', 'premium-tins', true, 'pokemon-group-tins', 33, 'TINS', false, false),
  ('pokemon-collector-chests', 'pokemon', 'Collector Chests', 'collector-chests', true, 'pokemon-group-tins', 34, 'TINS', false, false),

  ('pokemon-group-decks', 'pokemon', 'Decks & Gameplay Products', 'group-decks', true, null, 40, 'DECKS', false, false),
  ('pokemon-build-battle', 'pokemon', 'Build & Battle Products', 'build-battle', true, 'pokemon-group-decks', 41, 'DECKS', false, false),
  ('pokemon-battle-decks', 'pokemon', 'Battle Decks', 'battle-decks', true, 'pokemon-group-decks', 42, 'DECKS', false, false),
  ('pokemon-league-battle-decks', 'pokemon', 'League Battle Decks', 'league-battle-decks', true, 'pokemon-group-decks', 43, 'DECKS', false, false),

  ('pokemon-group-special', 'pokemon', 'Special Releases', 'group-special', true, null, 50, 'SPECIAL', false, false),
  ('pokemon-pc-exclusives', 'pokemon', 'Pokémon Center Exclusives', 'pc-exclusives', true, 'pokemon-group-special', 51, 'SPECIAL', true, false),
  ('pokemon-holiday', 'pokemon', 'Holiday Releases', 'holiday', true, 'pokemon-group-special', 52, 'SPECIAL', false, false),
  ('pokemon-anniversary', 'pokemon', 'Anniversary Products', 'anniversary', true, 'pokemon-group-special', 53, 'SPECIAL', false, false),
  ('pokemon-limited', 'pokemon', 'Limited Releases', 'limited', true, 'pokemon-group-special', 54, 'SPECIAL', false, false),
  ('pokemon-promo-tcg', 'pokemon', 'Promotional TCG Products', 'promo-tcg', true, 'pokemon-group-special', 55, 'SPECIAL', false, false),
  ('pokemon-collaborations', 'pokemon', 'Special Collaborations', 'collaborations', true, 'pokemon-group-special', 56, 'SPECIAL', false, false),

  ('pokemon-other-tcg', 'pokemon', 'Other Pokémon Center TCG Products', 'other-tcg', true, null, 90, 'OTHER', false, true)
on conflict (id) do update set
  name = excluded.name,
  parent_id = excluded.parent_id,
  sort_order = excluded.sort_order,
  group_key = excluded.group_key,
  is_popular = excluded.is_popular,
  is_other_fallback = excluded.is_other_fallback,
  active = excluded.active;

-- Attach leaf categories to Pokémon Center Canada (and PC generally via null region later if needed)
insert into public.retailer_product_categories (retailer_id, region_id, category_id, active)
select 'pokemon-center', 'ca', id, true
from public.product_categories
where tcg_id = 'pokemon'
  and (parent_id is not null or id = 'pokemon-other-tcg')
on conflict (retailer_id, region_id, category_id) do nothing;

insert into public.tags (id, tcg_id, name, slug, tag_type, active) values
  ('tag-pokemon', 'pokemon', 'Pokémon', 'pokemon', 'general', true),
  ('tag-tcg', 'pokemon', 'TCG', 'tcg', 'general', true),
  ('tag-sealed', 'pokemon', 'Sealed', 'sealed', 'general', true),
  ('tag-popular', 'pokemon', 'Popular', 'popular', 'popular', true),
  ('tag-exclusive', 'pokemon', 'Pokémon Center Exclusive', 'pc-exclusive', 'exclusive', true),
  ('tag-other', 'pokemon', 'Other TCG', 'other', 'other', true)
on conflict (id) do nothing;
