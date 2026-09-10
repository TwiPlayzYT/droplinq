import { AlertPreferences } from '@/types/dropdex';

/** True when local clock is inside quiet hours window. */
export function isInQuietHours(alerts: AlertPreferences, now = new Date()) {
  if (!alerts.quietHoursEnabled) return false;
  const hour = now.getHours();
  const start = ((alerts.quietHoursStart % 24) + 24) % 24;
  const end = ((alerts.quietHoursEnd % 24) + 24) % 24;
  if (start === end) return true;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

export function isProductMuted(alerts: AlertPreferences, productId: string) {
  return alerts.mutedProductIds.includes(productId);
}

export function formatHourLabel(hour: number) {
  const h = ((hour % 24) + 24) % 24;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve}:00 ${suffix}`;
}

/** Soften delivery during quiet hours — keep push, hush immersive channels. */
export function applyQuietHoursDelivery(alerts: AlertPreferences): AlertPreferences {
  if (!isInQuietHours(alerts)) return alerts;
  return {
    ...alerts,
    sound: false,
    vibration: false,
    speech: false,
    fullScreen: false,
    dropMode: false,
  };
}
