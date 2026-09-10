-- Optional columns for quiet hours / product mutes (synced from the app when present).
alter table public.alert_preferences
  add column if not exists quiet_hours_enabled boolean default false,
  add column if not exists quiet_hours_start integer default 23,
  add column if not exists quiet_hours_end integer default 7,
  add column if not exists muted_product_ids jsonb default '[]'::jsonb;
