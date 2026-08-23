import type { WebPushSubscriptionPayload } from './monitor-service';

export type WebPushState =
  | 'checking'
  | 'install-required'
  | 'ready'
  | 'subscribed'
  | 'denied'
  | 'unsupported'
  | 'error';

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

const isAppleMobile = () =>
  /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const decodeVapidKey = (value: string) => {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
};

const supportsWebPush = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export async function registerWebServiceWorker() {
  if (!('serviceWorker' in navigator)) return undefined;
  return navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

export async function getWebPushState(): Promise<WebPushState> {
  if (!window.isSecureContext || !supportsWebPush()) return 'unsupported';
  if (isAppleMobile() && !isStandalone()) return 'install-required';
  if (Notification.permission === 'denied') return 'denied';

  try {
    const registration = await registerWebServiceWorker();
    const subscription = await registration?.pushManager.getSubscription();
    return subscription ? 'subscribed' : 'ready';
  } catch {
    return 'error';
  }
}

export async function getExistingWebPushSubscription() {
  if (!window.isSecureContext || !supportsWebPush()) return undefined;
  const registration = await registerWebServiceWorker();
  const subscription = (await registration?.pushManager.getSubscription())?.toJSON();
  return serializeSubscription(subscription);
}

const serializeSubscription = (
  subscription?: PushSubscriptionJSON,
): WebPushSubscriptionPayload | undefined => {
  if (
    !subscription?.endpoint ||
    typeof subscription.keys?.auth !== 'string' ||
    typeof subscription.keys?.p256dh !== 'string'
  ) {
    return undefined;
  }
  return {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime,
    keys: {
      auth: subscription.keys.auth,
      p256dh: subscription.keys.p256dh,
    },
  };
};

export async function subscribeToWebPush(vapidPublicKey: string) {
  if (!window.isSecureContext || !supportsWebPush()) {
    throw new Error('Web Push is not supported in this browser.');
  }
  if (isAppleMobile() && !isStandalone()) {
    throw new Error('Add DropLinq to your Home Screen before enabling alerts.');
  }

  // This must run directly from the settings button press on iOS.
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  const registration = await registerWebServiceWorker();
  if (!registration) throw new Error('The DropLinq service worker is unavailable.');

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeVapidKey(vapidPublicKey),
    }));

  const serialized = serializeSubscription(subscription.toJSON());
  if (!serialized) throw new Error('The browser returned an incomplete push subscription.');
  return serialized;
}
