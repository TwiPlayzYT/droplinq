-- Handles are unique, lowercase, and at least 4 characters.
-- Signup may still create a profile when the email prefix is short or already used.

update public.profiles
set username = lower(trim(username))
where username is not null
  and username <> lower(trim(username));

update public.profiles
set username = null
where username is not null
  and char_length(lower(trim(username))) < 4;

with ranked as (
  select
    id,
    row_number() over (
      partition by lower(username)
      order by created_at asc, id asc
    ) as n
  from public.profiles
  where username is not null
    and username <> ''
)
update public.profiles as profile
set username = null
from ranked
where profile.id = ranked.id
  and ranked.n > 1;

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username))
  where username is not null and username <> '';

create or replace function public.profiles_validate_handle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cleaned text;
  reserved boolean;
begin
  if new.username is null or btrim(new.username) = '' then
    new.username := null;
    return new;
  end if;

  cleaned := lower(regexp_replace(btrim(new.username), '^@+', ''));
  cleaned := regexp_replace(cleaned, '[^a-z0-9._]', '', 'g');
  cleaned := regexp_replace(cleaned, '^\.+|\.+$', '', 'g');
  cleaned := left(cleaned, 24);
  reserved := cleaned in (
    'admin', 'administrator', 'droplinq', 'guest', 'help', 'mod', 'moderator',
    'official', 'owner', 'root', 'staff', 'support', 'system'
  );

  if tg_op = 'UPDATE' and cleaned is not distinct from old.username then
    new.username := old.username;
    return new;
  end if;

  if tg_op = 'INSERT' and (char_length(cleaned) < 4 or reserved or exists (
    select 1 from public.profiles where lower(username) = cleaned
  )) then
    new.username := null;
    return new;
  end if;

  if char_length(cleaned) < 4 then
    raise exception 'Handle needs at least 4 characters.' using errcode = '23514';
  end if;
  if reserved or exists (
    select 1 from public.profiles
    where lower(username) = cleaned
      and id is distinct from new.id
  ) then
    raise exception 'Already taken.' using errcode = '23505';
  end if;

  new.username := cleaned;
  return new;
end;
$$;

drop trigger if exists profiles_validate_handle on public.profiles;
create trigger profiles_validate_handle
  before insert or update of username on public.profiles
  for each row
  execute function public.profiles_validate_handle();

create or replace function public.handle_is_taken(candidate text)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  cleaned text;
begin
  cleaned := lower(regexp_replace(coalesce(candidate, ''), '^@+', ''));
  cleaned := regexp_replace(cleaned, '[^a-z0-9._]', '', 'g');
  cleaned := regexp_replace(cleaned, '^\.+|\.+$', '', 'g');
  if char_length(cleaned) < 4 then
    return true;
  end if;
  if cleaned in (
    'admin', 'administrator', 'droplinq', 'guest', 'help', 'mod', 'moderator',
    'official', 'owner', 'root', 'staff', 'support', 'system'
  ) then
    return true;
  end if;
  return exists (
    select 1 from public.profiles
    where lower(username) = cleaned
      and id is distinct from auth.uid()
  );
end;
$$;

revoke all on function public.handle_is_taken(text) from public;
grant execute on function public.handle_is_taken(text) to authenticated;
