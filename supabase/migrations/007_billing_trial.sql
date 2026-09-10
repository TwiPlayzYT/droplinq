-- Trial / billing fields for DropLinq Pro (first-drop-day trial).
-- Enforcement is controlled in app code (BILLING_ENFORCEMENT_ENABLED).

alter table public.profiles
  add column if not exists first_drop_day date,
  add column if not exists subscription_status text,
  add column if not exists billing_interval text;

comment on column public.profiles.first_drop_day is
  'UTC calendar day of the first real drop alert. Null = still in first-drop trial.';
comment on column public.profiles.subscription_status is
  'trialing | active | past_due | canceled | none';
comment on column public.profiles.billing_interval is
  'monthly | annual';
