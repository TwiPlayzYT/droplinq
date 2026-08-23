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
    summary: 'Core alerts for Pokémon Center Canada.',
    features: ['Up to 3 watched products', 'Standard alerts', 'Pokémon Center Canada'],
  },
  PRO: {
    label: 'Pro',
    summary: 'More watches, Drop Mode, extra alert types.',
    features: [
      'Unlimited watched products',
      'Drop Mode',
      'Restock, new release, and preorder alerts',
      'More retailers when they are added',
    ],
  },
  PRO_PLUS: {
    label: 'Pro+',
    summary: 'Everything in Pro plus extra regions and history.',
    features: ['Everything in Pro', 'More regions when supported', 'Richer stock history'],
  },
};
