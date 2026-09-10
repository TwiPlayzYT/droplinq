/**
 * DropLinq billing + trial rules.
 *
 * BILLING_ENFORCEMENT_ENABLED stays false until you advertise and ask to turn paywalls on.
 * All Pro UI, pricing, and trial tracking can ship now; limits are not hard-blocked yet.
 */
export const BILLING_ENFORCEMENT_ENABLED = false;

/** Monthly Pro price in CAD. */
export const PRO_MONTHLY_CAD = 6.99;

/** Effective monthly rate when billed annually (CAD). */
export const PRO_ANNUAL_MONTHLY_CAD = 4.99;

/** Charged once per year when on annual (CAD). */
export const PRO_ANNUAL_CAD = Number((PRO_ANNUAL_MONTHLY_CAD * 12).toFixed(2));

export type BillingInterval = 'monthly' | 'annual';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'none';

export function formatCad(amount: number) {
  return `$${amount.toFixed(2)} CAD`;
}

export function proPriceLabel(interval: BillingInterval) {
  if (interval === 'annual') {
    return {
      perMonth: formatCad(PRO_ANNUAL_MONTHLY_CAD),
      billed: `${formatCad(PRO_ANNUAL_CAD)} / year`,
      savePercent: Math.round((1 - PRO_ANNUAL_MONTHLY_CAD / PRO_MONTHLY_CAD) * 100),
    };
  }
  return {
    perMonth: formatCad(PRO_MONTHLY_CAD),
    billed: `${formatCad(PRO_MONTHLY_CAD)} / month`,
    savePercent: 0,
  };
}

/** Calendar day key (UTC) for “first drop day” trial boundary. */
export function dropDayKey(iso = new Date().toISOString()) {
  return iso.slice(0, 10);
}

/**
 * Trial = free until the first real drop-alert day.
 * After that day is recorded, continued Pro features require payment (when enforcement is on).
 */
export function isFirstDropTrialActive(firstDropDay: string | null | undefined) {
  return !firstDropDay;
}

export const trialCopy = {
  headline: 'Free until your first drop day',
  body: 'Most apps give you 7 days. Drops don’t care about calendars. DropLinq stays free until we alert you on your first real drop day — that day is your trial. After that, Pro keeps monitoring going.',
} as const;
