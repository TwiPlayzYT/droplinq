import { isValidWebPushSubscription } from './web-push.mjs';

/** Keep a stored push subscription if this request omitted one (page reload race). */
export function mergeRegistration(previous, incoming) {
  const webPushSubscription =
    incoming.webPushSubscription ?? previous?.webPushSubscription ?? undefined;
  const expoPushToken = incoming.expoPushToken ?? previous?.expoPushToken ?? undefined;
  const canPush = Boolean(webPushSubscription || expoPushToken);

  return {
    ...incoming,
    webPushSubscription,
    expoPushToken,
    alerts: {
      ...incoming.alerts,
      push: incoming.alerts?.push !== false && (canPush || incoming.alerts?.push === true),
    },
  };
}

export function sanitizeSubscription(value) {
  if (!isValidWebPushSubscription(value)) return undefined;
  return {
    endpoint: value.endpoint,
    expirationTime: typeof value.expirationTime === 'number' ? value.expirationTime : null,
    keys: {
      auth: value.keys.auth.slice(0, 512),
      p256dh: value.keys.p256dh.slice(0, 512),
    },
  };
}
