-- Stripe billing: only webhooks / service role may grant Pro.
-- Also stop clients from clearing first_drop_day (infinite trial) or flipping subscription fields.

alter table public.profiles
  add column if not exists first_drop_day date,
  add column if not exists subscription_status text,
  add column if not exists billing_interval text,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

comment on column public.profiles.stripe_customer_id is 'Stripe Customer id; set only by billing webhook.';
comment on column public.profiles.stripe_subscription_id is 'Stripe Subscription id; Pro is valid only while this is a paid subscription.';

-- Undo unpaid "Pro activated" rows from the old client-side checkout.
update public.profiles
set
  subscription_tier = 'FREE',
  subscription_status = 'none',
  billing_interval = null
where stripe_subscription_id is null
  and subscription_status = 'active';

alter table public.profiles
  drop constraint if exists profiles_active_requires_stripe;

alter table public.profiles
  add constraint profiles_active_requires_stripe
  check (
    subscription_status is distinct from 'active'
    or stripe_subscription_id is not null
  );

create or replace function public.profiles_protect_billing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role' then
    if tg_op = 'INSERT' then
      new.subscription_tier := 'FREE';
      if new.subscription_status is null or new.subscription_status = 'active' then
        new.subscription_status := 'none';
      end if;
      new.billing_interval := null;
      new.stripe_customer_id := null;
      new.stripe_subscription_id := null;
    else
      new.subscription_tier := old.subscription_tier;
      new.subscription_status := old.subscription_status;
      new.billing_interval := old.billing_interval;
      new.stripe_customer_id := old.stripe_customer_id;
      new.stripe_subscription_id := old.stripe_subscription_id;
      if old.first_drop_day is not null then
        new.first_drop_day := old.first_drop_day;
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_billing on public.profiles;
create trigger profiles_protect_billing
  before insert or update on public.profiles
  for each row
  execute function public.profiles_protect_billing();
