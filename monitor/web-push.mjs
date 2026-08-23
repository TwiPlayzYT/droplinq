import webPush from 'web-push';

import { productMatchesCoverage } from './coverage-match.mjs';

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;

const configured = Boolean(publicKey && privateKey && subject);
if (configured) {
  webPush.setVapidDetails(subject, publicKey, privateKey);
}

export const isValidWebPushSubscription = (subscription) => {
  if (!subscription || typeof subscription !== 'object') return false;
  if (
    typeof subscription.endpoint !== 'string' ||
    subscription.endpoint.length > 2048 ||
    typeof subscription.keys?.p256dh !== 'string' ||
    typeof subscription.keys?.auth !== 'string'
  ) {
    return false;
  }

  try {
    return new URL(subscription.endpoint).protocol === 'https:';
  } catch {
    return false;
  }
};

const matchesRegistration = (product, registration) => {
  if (!registration.enabled || !registration.alerts?.push || !registration.webPushSubscription) {
    return false;
  }
  if (product.region && registration.region !== product.region) return false;
  return productMatchesCoverage(product, registration.filters);
};

export const getWebPushPublicConfig = () => ({
  enabled: configured,
  publicKey: configured ? publicKey : undefined,
});

export async function sendMatchingWebPushes(product, registrations) {
  if (!configured) return { expiredInstallationIds: [], sent: 0 };

  const matches = Object.values(registrations).filter((registration) =>
    matchesRegistration(product, registration),
  );
  const expiredInstallationIds = [];
  let sent = 0;

  for (const registration of matches) {
    try {
      await webPush.sendNotification(
        registration.webPushSubscription,
        JSON.stringify({
          title: product.releaseType === 'restock' ? 'TCG RESTOCK DETECTED' : 'NEW TCG DROP',
          body: product.title,
          product,
        }),
        { TTL: 300, urgency: 'high' },
      );
      sent += 1;
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        expiredInstallationIds.push(registration.installationId);
      } else {
        console.error(
          `[web-push] ${registration.installationId} failed:`,
          error.message,
        );
      }
    }
  }

  return { expiredInstallationIds, sent };
}
