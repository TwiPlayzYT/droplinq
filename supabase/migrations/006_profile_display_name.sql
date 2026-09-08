-- Display name is separate from the public handle (profiles.username).
alter table public.profiles
  add column if not exists display_name text;

comment on column public.profiles.display_name is 'Shown name in Settings and the profile menu. Handle stays on username.';
