-- DropLinq legal acceptance fields for App Store / Play compliance
alter table public.profiles
  add column if not exists legal_accepted_at timestamptz,
  add column if not exists legal_version text;

comment on column public.profiles.legal_accepted_at is 'When the user accepted current Terms + Privacy';
comment on column public.profiles.legal_version is 'LEGAL_VERSION string accepted by the user';
