import { alertCopy } from './alert-copy.mjs';
import { productMatchesCoverage } from './coverage-match.mjs';
import { regionsCompatible } from './web-push.mjs';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const matchesRegistration = (product, registration) => {
  if (!registration.enabled || !registration.alerts?.push || !registration.expoPushToken) {
    return false;
  }
  if (!regionsCompatible(product.region, registration.region)) return false;
  return productMatchesCoverage(product, registration.filters);
};

const isExpoToken = (token) =>
  typeof token === 'string' &&
  (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['));

export async function sendMatchingPushes(product, registrations) {
  const messages = Object.values(registrations)
    .filter((registration) => matchesRegistration(product, registration))
    .filter((registration) => isExpoToken(registration.expoPushToken))
    .map((registration) => {
      const copy = alertCopy(product);
      return {
      installationId: registration.installationId,
      to: registration.expoPushToken,
      title: copy.title,
      body: copy.body,
      sound: registration.alerts.sound ? 'default' : undefined,
      priority: 'high',
      // Delivered even while the phone is in a Focus mode / Do Not Disturb,
      // without needing Apple's critical-alert entitlement.
      interruptionLevel: 'time-sensitive',
      channelId: 'drop-alerts',
      categoryId: 'dropalert',
      badge: 1,
      ttl: 604800,
      data: { product },
      };
    });

  for (let index = 0; index < messages.length; index += 100) {
    const batch = messages.slice(index, index + 100);
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch.map(({ to, title, body, sound, priority, interruptionLevel, channelId, categoryId, badge, ttl, data }) => ({
        to, title, body, sound, priority, interruptionLevel, channelId, categoryId, badge, ttl, data,
      }))),
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

  return { count: messages.length, installationIds: messages.map((message) => message.installationId).filter(Boolean) };
}
