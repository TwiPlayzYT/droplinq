-- Profile insert for OAuth/email users if the trigger missed a row.
-- Upsert from the app also needs INSERT RLS even when the row already exists.
-- Extra alert columns + appearance so returning logins restore prefs.

drop policy if exists "own_profile_insert" on public.profiles;
create policy "own_profile_insert" on public.profiles
  for insert with check (auth.uid() = id);

create or replace function public.ensure_own_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.profiles (id, username)
  values (
    auth.uid(),
    split_part((select email from auth.users where id = auth.uid()), '@', 1)
  )
  on conflict (id) do nothing;

  insert into public.alert_preferences (user_id)
  values (auth.uid())
  on conflict (user_id) do nothing;

  insert into public.subscriptions (user_id, tier, status)
  values (auth.uid(), 'FREE', 'active')
  on conflict (user_id) do nothing;

  select * into row from public.profiles where id = auth.uid();
  return row;
end;
$$;

revoke all on function public.ensure_own_profile() from public;
grant execute on function public.ensure_own_profile() to authenticated;

alter table public.alert_preferences
  add column if not exists vibration_enabled boolean not null default true,
  add column if not exists speech_enabled boolean not null default false,
  add column if not exists full_screen_enabled boolean not null default true,
  add column if not exists appearance_id text;

alter table public.profiles
  add column if not exists appearance_id text;

comment on column public.profiles.appearance_id is 'dark | light | droplinq';
