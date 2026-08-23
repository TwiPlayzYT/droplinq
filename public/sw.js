const CACHE_NAME = 'droplinq-shell-v1';
const APP_SHELL = ['/', '/manifest.webmanifest', '/droplinq-icon.svg'];

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
          Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
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

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    payload = { body: event.data?.text() };
  }

  const product = payload.product;
  const title = payload.title ?? 'DROP DETECTED';
  const body = payload.body ?? product?.title ?? 'A matching product is available.';

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, {
        body,
        badge: '/droplinq-icon.svg',
        icon: '/droplinq-icon.svg',
        tag: product?.id ? `droplinq-${product.id}` : 'droplinq-alert',
        renotify: true,
        data: {
          product,
          productUrl: product?.url,
          appUrl: '/',
        },
      }),
      self.registration.setAppBadge?.(1),
    ]),
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

      const target = new URL(data.appUrl ?? '/', self.location.origin);
      if (data.product) {
        target.searchParams.set('drop', JSON.stringify(data.product));
      }
      return self.clients.openWindow(target.href);
    }),
  );
});
