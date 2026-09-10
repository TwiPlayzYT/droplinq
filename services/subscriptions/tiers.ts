import {
  PRO_ANNUAL_CAD,
  PRO_ANNUAL_MONTHLY_CAD,
  PRO_MONTHLY_CAD,
  formatCad,
  trialCopy,
} from '@/constants/billing';
import { SubscriptionTier, subscriptionLimits } from '@/config/app-config';

export function canUseDropMode(tier: SubscriptionTier) {
  return subscriptionLimits[tier].dropMode;
}

export function watchlistLimit(tier: SubscriptionTier): number | null {
  return subscriptionLimits[tier].watchlistLimit;
}

export function canAddToWatchlist(tier: SubscriptionTier, currentCount: number) {
  const limit = watchlistLimit(tier);
  return limit === null || currentCount < limit;
}

export const tierCopy: Record<
  SubscriptionTier,
  { label: string; summary: string; features: string[] }
> = {
  FREE: {
    label: 'Free',
    summary: 'Try DropLinq until your first real drop day.',
    features: [
      'Full monitoring until first drop day',
      'Up to 3 watched products after trial',
      'Standard in-app alerts',
      'Pokémon Center coverage',
    ],
  },
  PRO: {
    label: 'Pro',
    summary: `${formatCad(PRO_MONTHLY_CAD)}/mo · or ${formatCad(PRO_ANNUAL_MONTHLY_CAD)}/mo billed yearly.`,
    features: [
      'Unlimited watched products',
      'Drop Mode + lock-screen push',
      'Quiet hours & per-product mute',
      'Full alert history',
      'All regions we support',
      'More retailers when they launch',
    ],
  },
  PRO_PLUS: {
    label: 'Pro',
    summary: 'Same as Pro — Pro+ is reserved for a future tier.',
    features: ['Everything in Pro'],
  },
};

export const proMarketingFeatures = [
  {
    title: 'Unlimited watches',
    body: 'Pin every ETB, bundle, and exclusive you care about — not just three.',
  },
  {
    title: 'Drop Mode',
    body: 'Full-screen overlay, sound, speech, and vibration while DropLinq is open.',
  },
  {
    title: 'Quiet hours & mutes',
    body: 'Sleep through the night. Silence one SKU without turning monitoring off.',
  },
  {
    title: 'Alert history',
    body: 'See what pinged you and jump straight back to the product.',
  },
  {
    title: 'Every region we support',
    body: 'US, CA, UK, EU, AU, NZ, JP storefronts as we expand coverage.',
  },
  {
    title: 'Priority for new retailers',
    body: 'When Target, Walmart, and friends land, Pro gets them first.',
  },
] as const;

export const proPricingBlurb = {
  monthly: `${formatCad(PRO_MONTHLY_CAD)} / month`,
  annual: `${formatCad(PRO_ANNUAL_MONTHLY_CAD)} / month · billed ${formatCad(PRO_ANNUAL_CAD)} yearly`,
  trial: trialCopy,
};
