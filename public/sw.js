const CACHE_NAME = 'droplinq-shell-v24';
const PUSH_CONTEXT_CACHE = 'droplinq-push-context-v1';
const PUSH_CONTEXT_URL = '/__droplinq/push-context';
const APP_SHELL = ['/', '/manifest.webmanifest', '/droplinq-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key !== CACHE_NAME && key !== PUSH_CONTEXT_CACHE)
              .map((key) => caches.delete(key)),
          ),
        ),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.mode === 'navigate') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok && new URL(event.request.url).origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached ?? network;
    }),
  );
});

const showDropNotification = (payload) => {
  const product = payload.product;
  const title = payload.title ?? 'DROP DETECTED';
  const body = payload.body ?? product?.title ?? 'A matching product is available.';

  return self.registration
    .showNotification(title, {
      body,
      badge: '/droplinq-icon.png',
      icon: '/droplinq-icon.png',
      tag: product?.id ? `droplinq-${product.id}` : 'droplinq-alert',
      renotify: true,
      data: {
        product,
        productUrl: product?.url,
        appUrl: '/app',
      },
    })
    .then(() => self.registration.setAppBadge?.(1))
    .catch(() => undefined);
};

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    payload = { body: event.data?.text() };
  }

  event.waitUntil(showDropNotification(payload));
});

const readPushContext = async () => {
  const cache = await caches.open(PUSH_CONTEXT_CACHE);
  const response = await cache.match(PUSH_CONTEXT_URL);
  if (!response) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const writePushContext = async (value) => {
  const cache = await caches.open(PUSH_CONTEXT_CACHE);
  await cache.put(PUSH_CONTEXT_URL, new Response(JSON.stringify(value), {
    headers: { 'Content-Type': 'application/json' },
  }));
};

self.addEventListener('message', (event) => {
  if (event.data?.type === 'DROPLINQ_PUSH_CONTEXT') {
    event.waitUntil(
      writePushContext({
        installationId: event.data.installationId,
        monitorUrl: event.data.monitorUrl,
        publicKey: event.data.publicKey,
      }),
    );
  }
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      const context = await readPushContext();
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clients.forEach((client) => client.postMessage({ type: 'DROPLINQ_PUSH_SUB_CHANGED' }));
      if (!context?.monitorUrl || !context.publicKey || !self.registration.pushManager) return;

      const padding = '='.repeat((4 - (context.publicKey.length % 4)) % 4);
      const base64 = (context.publicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
      const applicationServerKey = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
      const subscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      const json = subscription.toJSON();
      await fetch(`${String(context.monitorUrl).replace(/\/$/, '')}/v1/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installationId: context.installationId,
          enabled: true,
          webPushSubscription: json,
          alerts: { push: true },
        }),
      });
    })().catch(() => undefined),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data ?? {};

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      const existing = clients.find((client) => new URL(client.url).origin === self.location.origin);
      if (existing) {
        existing.postMessage({ type: 'DROPLINQ_PUSH_CLICK', product: data.product });
        return existing.focus();
      }

      const target = new URL(data.appUrl ?? '/app', self.location.origin);
      if (data.product) {
        target.searchParams.set('drop', JSON.stringify(data.product));
      }
      return self.clients.openWindow(target.href);
    }),
  );
});
