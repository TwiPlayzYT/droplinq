import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { COOKIE_CONSENT_KEY, COOKIE_CONSENT_VERSION } from '@/constants/legal';

export type CookieConsentRecord = {
  essential: true;
  acceptedAt: string;
  version: string;
};

const listeners = new Set<(value: CookieConsentRecord | null) => void>();

function emit(value: CookieConsentRecord | null) {
  listeners.forEach((listener) => listener(value));
}

export function useCookieConsent() {
  const enabled = Platform.OS === 'web';
  const [ready, setReady] = useState(!enabled);
  const [consent, setConsent] = useState<CookieConsentRecord | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const onChange = (value: CookieConsentRecord | null) => {
      if (!cancelled) setConsent(value);
    };
    listeners.add(onChange);
    AsyncStorage.getItem(COOKIE_CONSENT_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        try {
          const parsed = JSON.parse(raw) as CookieConsentRecord;
          if (parsed?.essential && parsed.version === COOKIE_CONSENT_VERSION) {
            setConsent(parsed);
          }
        } catch {
          // Ignore corrupt consent and show the banner again.
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
      listeners.delete(onChange);
    };
  }, [enabled]);

  const acceptEssential = useCallback(async () => {
    const next: CookieConsentRecord = {
      essential: true,
      acceptedAt: new Date().toISOString(),
      version: COOKIE_CONSENT_VERSION,
    };
    setConsent(next);
    emit(next);
    await AsyncStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(next));
  }, []);

  return {
    enabled,
    ready,
    consent,
    needsBanner: enabled && ready && !consent,
    acceptEssential,
  };
}
