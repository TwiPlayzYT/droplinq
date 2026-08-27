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

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

/** Call from a user gesture so later drop sounds/speech are allowed. */
export async function unlockAlertAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx?.state === 'suspended') await ctx.resume();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const warm = new SpeechSynthesisUtterance(' ');
      warm.volume = 0;
      window.speechSynthesis.speak(warm);
      window.speechSynthesis.cancel();
    }
  } catch {
    // Ignore unlock failures — delivery still best-efforts later.
  }
}

function playAlertTone() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const playBeep = (frequency: number, start: number, duration: number) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(ctx.currentTime + start);
    oscillator.stop(ctx.currentTime + start + duration + 0.02);
  };

  void ctx.resume().then(() => {
    playBeep(880, 0, 0.14);
    playBeep(1175, 0.16, 0.14);
    playBeep(880, 0.32, 0.18);
  });
}

export async function configureNotifications() {
  await registerWebServiceWorker();
}

export async function getExpoPushToken(): Promise<undefined> {
  return undefined;
}

export async function deliverProductAlert(product: Product, settings: AlertPreferences) {
  if (settings.sound) playAlertTone();

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
