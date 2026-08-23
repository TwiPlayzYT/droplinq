import { productMatchesCoverage } from './coverage-match.mjs';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const matchesRegistration = (product, registration) => {
  if (!registration.enabled || !registration.alerts?.push || !registration.expoPushToken) {
    return false;
  }
  if (product.region && registration.region !== product.region) return false;
  return productMatchesCoverage(product, registration.filters);
};

const isExpoToken = (token) =>
  typeof token === 'string' &&
  (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['));

export async function sendMatchingPushes(product, registrations) {
  const messages = Object.values(registrations)
    .filter((registration) => matchesRegistration(product, registration))
    .filter((registration) => isExpoToken(registration.expoPushToken))
    .map((registration) => ({
      to: registration.expoPushToken,
      title: product.releaseType === 'restock' ? 'TCG RESTOCK DETECTED' : 'NEW TCG DROP',
      body: product.title,
      sound: registration.alerts.sound ? 'default' : undefined,
      priority: 'high',
      // Delivered even while the phone is in a Focus mode / Do Not Disturb,
      // without needing Apple's critical-alert entitlement.
      interruptionLevel: 'time-sensitive',
      channelId: 'drop-alerts',
      categoryId: 'dropalert',
      badge: 1,
      ttl: 300,
      data: { product },
    }));

  for (let index = 0; index < messages.length; index += 100) {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages.slice(index, index + 100)),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`Expo Push API returned ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    const failures = (result.data ?? []).filter((ticket) => ticket.status === 'error');
    if (failures.length > 0) {
      console.error('[push] Expo rejected push tickets', failures);
    }
  }

  return messages.length;
}
