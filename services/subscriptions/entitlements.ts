import {
  BILLING_ENFORCEMENT_ENABLED,
  isFirstDropTrialActive,
  type BillingInterval,
  type SubscriptionStatus,
} from '@/constants/billing';
import { type SubscriptionTier, subscriptionLimits } from '@/config/app-config';
import type { AuthProfile } from '@/services/auth/types';

export type EntitlementSnapshot = {
  /** Tier used for feature gates when enforcement is on. */
  effectiveTier: SubscriptionTier;
  /** What the account record says. */
  billedTier: SubscriptionTier;
  status: SubscriptionStatus;
  interval: BillingInterval | null;
  firstDropDay: string | null;
  trialActive: boolean;
  /** True when UI should nudge upgrade (even if enforcement is off). */
  showUpgradeNudge: boolean;
  /** True only when enforcement is on and access should be limited. */
  isLockedToFree: boolean;
  enforcementEnabled: boolean;
};

export function profileBilling(profile: AuthProfile | null | undefined) {
  return {
    tier: (profile?.subscriptionTier ?? 'FREE') as SubscriptionTier,
    status: (profile?.subscriptionStatus ?? 'none') as SubscriptionStatus,
    interval: (profile?.billingInterval ?? null) as BillingInterval | null,
    firstDropDay: profile?.firstDropDay ?? null,
  };
}

/**
 * Resolve what the user can do right now.
 * While BILLING_ENFORCEMENT_ENABLED is false, everyone keeps full Pro-class access
 * so shipping Pro UI does not surprise existing users.
 */
export function resolveEntitlements(profile: AuthProfile | null | undefined): EntitlementSnapshot {
  const billed = profileBilling(profile);
  const trialActive = isFirstDropTrialActive(billed.firstDropDay);
  const paid =
    billed.status === 'active' && (billed.tier === 'PRO' || billed.tier === 'PRO_PLUS');

  if (!BILLING_ENFORCEMENT_ENABLED) {
    return {
      effectiveTier: 'PRO',
      billedTier: billed.tier,
      status: trialActive ? 'trialing' : billed.status === 'none' ? 'trialing' : billed.status,
      interval: billed.interval,
      firstDropDay: billed.firstDropDay,
      trialActive,
      showUpgradeNudge: !paid && !trialActive,
      isLockedToFree: false,
      enforcementEnabled: false,
    };
  }

  if (paid) {
    return {
      effectiveTier: billed.tier === 'PRO_PLUS' ? 'PRO_PLUS' : 'PRO',
      billedTier: billed.tier,
      status: 'active',
      interval: billed.interval,
      firstDropDay: billed.firstDropDay,
      trialActive: false,
      showUpgradeNudge: false,
      isLockedToFree: false,
      enforcementEnabled: true,
    };
  }

  if (trialActive) {
    return {
      effectiveTier: 'PRO',
      billedTier: billed.tier,
      status: 'trialing',
      interval: billed.interval,
      firstDropDay: billed.firstDropDay,
      trialActive: true,
      showUpgradeNudge: false,
      isLockedToFree: false,
      enforcementEnabled: true,
    };
  }

  return {
    effectiveTier: 'FREE',
    billedTier: 'FREE',
    status: billed.status === 'past_due' ? 'past_due' : 'none',
    interval: billed.interval,
    firstDropDay: billed.firstDropDay,
    trialActive: false,
    showUpgradeNudge: true,
    isLockedToFree: true,
    enforcementEnabled: true,
  };
}

export function limitsForProfile(profile: AuthProfile | null | undefined) {
  return subscriptionLimits[resolveEntitlements(profile).effectiveTier];
}
