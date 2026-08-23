import { AlertPreferences, Product } from '@/types/dropdex';

import { registerWebServiceWorker } from './web-push-service';

const isProduct = (value: unknown): value is Product => {
  if (!value || typeof value !== 'object') return false;
  const product = value as Partial<Product>;
  return (
    typeof product.id === 'string' &&
    typeof product.title === 'string' &&
    typeof product.url === 'string'
  );
};

export async function configureNotifications() {
  await registerWebServiceWorker();
}

export async function getExpoPushToken(): Promise<undefined> {
  return undefined;
}

export async function deliverProductAlert(product: Product, settings: AlertPreferences) {
  if (settings.vibration) navigator.vibrate?.([250, 100, 250, 100, 500]);

  if (settings.speech && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(`Drop detected. ${product.title}`));
  }

  if (settings.push && Notification.permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification('DROP DETECTED', {
      body: product.title,
      badge: '/droplinq-icon.svg',
      icon: '/droplinq-icon.svg',
      tag: `droplinq-local-${product.id}`,
      data: { product, appUrl: '/' },
    });
  }
}

export async function stopAlertSignals() {
  window.speechSynthesis?.cancel();
  navigator.vibrate?.(0);
  await navigator.clearAppBadge?.();
}

export function subscribeToIncomingProductAlerts(onProduct: (product: Product) => void) {
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'DROPLINQ_PUSH_CLICK' && isProduct(event.data.product)) {
      onProduct(event.data.product);
    }
  };

  navigator.serviceWorker?.addEventListener('message', handleMessage);

  const params = new URLSearchParams(window.location.search);
  const serialized = params.get('drop');
  if (serialized) {
    try {
      const product = JSON.parse(serialized);
      if (isProduct(product)) queueMicrotask(() => onProduct(product));
    } catch {
      // Ignore malformed notification URLs.
    }
    params.delete('drop');
    const query = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }

  return () => navigator.serviceWorker?.removeEventListener('message', handleMessage);
}
