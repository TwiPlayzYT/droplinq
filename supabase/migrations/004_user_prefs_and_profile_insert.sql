-- Profile insert for OAuth/email users if the trigger missed a row.
-- Extra alert columns + appearance so returning logins restore prefs.

drop policy if exists "own_profile_insert" on public.profiles;
create policy "own_profile_insert" on public.profiles
  for insert with check (auth.uid() = id);

alter table public.alert_preferences
  add column if not exists vibration_enabled boolean not null default true,
  add column if not exists speech_enabled boolean not null default false,
  add column if not exists full_screen_enabled boolean not null default true,
  add column if not exists appearance_id text;

alter table public.profiles
  add column if not exists appearance_id text;

comment on column public.profiles.appearance_id is 'dark | light | droplinq';
