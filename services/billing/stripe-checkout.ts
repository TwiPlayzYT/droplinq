import { Linking, Platform } from 'react-native';

import { isGuestUserId } from '@/services/auth/guest-auth';

const monitorBase = () =>
  (process.env.EXPO_PUBLIC_MONITOR_API_URL ?? 'https://droplinq-monitor.onrender.com').replace(
    /\/$/,
    '',
  );

async function billingRequest(
  path: string,
  accessToken: string,
  body?: Record<string, unknown>,
) {
  const response = await fetch(`${monitorBase()}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body ?? {}),
  });
  const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string };
  if (!response.ok || !payload.ok || !payload.url) {
    throw new Error(payload.error ?? `Billing request failed (${response.status})`);
  }
  return payload.url;
}

export async function openExternalCheckout(url: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.assign(url);
    return;
  }
  await Linking.openURL(url);
}

export async function startStripeCheckout(input: {
  accessToken: string;
  userId?: string | null;
  interval: 'monthly' | 'annual';
}) {
  if (isGuestUserId(input.userId)) {
    throw new Error('Guest mode cannot be billed. Create a real account, then upgrade.');
  }
  if (!input.accessToken || input.accessToken === 'guest.local') {
    throw new Error('Sign in with a real account before paying.');
  }
  const url = await billingRequest('/v1/billing/checkout', input.accessToken, {
    interval: input.interval,
  });
  await openExternalCheckout(url);
}

export async function openStripePortal(input: { accessToken: string; userId?: string | null }) {
  if (isGuestUserId(input.userId) || !input.accessToken || input.accessToken === 'guest.local') {
    throw new Error('Sign in with a real account to manage billing.');
  }
  const url = await billingRequest('/v1/billing/portal', input.accessToken);
  await openExternalCheckout(url);
}
