import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  PRO_ANNUAL_MONTHLY_CAD,
  PRO_MONTHLY_CAD,
  formatCad,
  proPriceLabel,
  trialCopy,
  type BillingInterval,
} from '@/constants/billing';
import { palette } from '@/constants/dropdex';
import {
  TUTORIAL_STORAGE_KEY,
  subscribeTutorialCleared,
  subscribeTutorialSettled,
} from '@/constants/tutorial';
import { tierCopy } from '@/services/subscriptions/tiers';
import { resolveEntitlements } from '@/services/subscriptions/entitlements';
import { hasAcceptedCurrentLegal, useAuth } from '@/store/auth-context';

/** Once per JS session after a successful show — reset when tutorial storage is cleared. */
let sessionOfferShown = false;

function isProductPath(pathname: string) {
  const path = (pathname || '/').split('?')[0].replace(/\/+$/, '') || '/';
  if (path === '/' || path === '/pro' || path === '/help') return false;
  if (path === '/start' || path === '/sign-in' || path === '/sign-up') return false;
  if (path.startsWith('/legal') || path.includes('accept')) return false;
  if (path === '/setup' || path.startsWith('/setup/')) return false;
  if (path === '/app') return false;
  // Tabs / product surfaces
  return (
    path === '/home' ||
    path === '/stock' ||
    path === '/filter' ||
    path === '/region' ||
    path === '/settings' ||
    path.startsWith('/product/') ||
    path.startsWith('/alerts/')
  );
}

/** Random delay before the Pro offer appears (ms). */
function randomOfferDelayMs() {
  return 10_000 + Math.floor(Math.random() * 20_001);
}

/**
 * Centered vertical Pro upgrade card — trial accounts only, once per app open,
 * after tutorial settles, delayed 10–30s on the product app.
 */
export function ProUpgradeModal() {
  const { profile, profileReady, session, startProCheckout } = useAuth();
  const pathname = usePathname();
  const { height } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const [interval, setInterval] = useState<BillingInterval>('annual');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  /** False while tutorial will ask / is running; true once done or skipped. */
  const [tutorialSettled, setTutorialSettled] = useState(false);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const legalOk = hasAcceptedCurrentLegal(profile);
  const onboarded = Boolean(profile?.onboardingCompleted);
  const entitlements = resolveEntitlements(profile);
  const onProduct = isProductPath(pathname);
  const onTrial = entitlements.trialActive || entitlements.status === 'trialing';
  const alreadyPro = entitlements.status === 'active';
  const price = proPriceLabel(interval);

  const clearDelayTimer = () => {
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
  };

  const offerGateRef = useRef({
    profileReady,
    session: Boolean(session),
    legalOk,
    onboarded,
    onProduct,
    tutorialSettled,
    onTrial,
    alreadyPro,
  });
  offerGateRef.current = {
    profileReady,
    session: Boolean(session),
    legalOk,
    onboarded,
    onProduct,
    tutorialSettled,
    onTrial,
    alreadyPro,
  };

  const tryShowOffer = () => {
    const gate = offerGateRef.current;
    if (!gate.profileReady || !gate.session || !gate.legalOk || !gate.onboarded || !gate.onProduct) {
      return;
    }
    if (!gate.tutorialSettled) return;
    // Paid Pro never sees the upgrade popup; only trial accounts.
    if (gate.alreadyPro || !gate.onTrial) return;
    if (sessionOfferShown || delayTimerRef.current) return;
    sessionOfferShown = true;
    const delayMs = randomOfferDelayMs();
    delayTimerRef.current = setTimeout(() => {
      delayTimerRef.current = null;
      const latest = offerGateRef.current;
      if (
        !latest.onProduct ||
        !latest.tutorialSettled ||
        latest.alreadyPro ||
        !latest.onTrial
      ) {
        return;
      }
      setVisible(true);
    }, delayMs);
  };

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(TUTORIAL_STORAGE_KEY)
      .then((value) => {
        if (cancelled) return;
        if (value === 'done' || value === 'skipped') {
          setTutorialSettled(true);
          offerGateRef.current.tutorialSettled = true;
          tryShowOffer();
        }
      })
      .catch(() => {
        /* keep waiting for SiteTutorial persist notify */
      });
    const unsubSettled = subscribeTutorialSettled(() => {
      if (cancelled) return;
      setTutorialSettled(true);
      offerGateRef.current.tutorialSettled = true;
      tryShowOffer();
    });
    const unsubCleared = subscribeTutorialCleared(() => {
      if (cancelled) return;
      sessionOfferShown = false;
      clearDelayTimer();
      setTutorialSettled(false);
      offerGateRef.current.tutorialSettled = false;
      setVisible(false);
    });
    return () => {
      cancelled = true;
      clearDelayTimer();
      unsubSettled();
      unsubCleared();
    };
  }, []);

  useEffect(() => {
    // Cover cases where settle already happened but product/auth gates open later.
    tryShowOffer();
  }, [alreadyPro, legalOk, onboarded, onProduct, onTrial, profileReady, session, tutorialSettled]);

  const dismiss = () => {
    clearDelayTimer();
    setVisible(false);
    setMessage(null);
  };

  const onUpgrade = async () => {
    setBusy(true);
    setMessage(null);
    const result = await startProCheckout(interval);
    setBusy(false);
    if (result.ok) {
      setMessage('Pro activated.');
      setTimeout(dismiss, 700);
      return;
    }
    setMessage(result.message);
  };

  if (!visible) return null;

  const cardMaxHeight = Math.min(560, height * 0.82);

  const body = (
    <View style={styles.scrim}>
      <View style={[styles.card, { maxHeight: cardMaxHeight }]}>
        <Pressable
          accessibilityLabel="Dismiss Pro offer"
          hitSlop={12}
          onPress={dismiss}
          style={styles.closeBtn}>
          <Ionicons color={palette.whiteDim} name="close" size={22} />
        </Pressable>

        <ScrollView
          bounces={false}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>DROPLINQ PRO</Text>
          <Text style={styles.title}>
            {alreadyPro ? 'You’re on Pro' : trialCopy.headline}
          </Text>
          <Text style={styles.body}>
            {alreadyPro
              ? 'Thanks for supporting DropLinq. Manage billing anytime in Settings.'
              : trialCopy.body}
          </Text>

          {!alreadyPro ? (
            <>
              <View style={styles.toggleRow}>
                <Pressable
                  onPress={() => setInterval('annual')}
                  style={[styles.toggle, interval === 'annual' && styles.toggleOn]}>
                  <Text style={[styles.toggleText, interval === 'annual' && styles.toggleTextOn]}>
                    Annual · save {price.savePercent || 28}%
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setInterval('monthly')}
                  style={[styles.toggle, interval === 'monthly' && styles.toggleOn]}>
                  <Text style={[styles.toggleText, interval === 'monthly' && styles.toggleTextOn]}>
                    Monthly
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.price}>{price.perMonth}</Text>
              <Text style={styles.billed}>{price.billed}</Text>

              {tierCopy.PRO.features.slice(0, 4).map((feature) => (
                <Text key={feature} style={styles.feature}>
                  · {feature}
                </Text>
              ))}

              <Pressable
                disabled={busy}
                onPress={() => void onUpgrade()}
                style={({ pressed }) => [
                  styles.cta,
                  pressed && styles.pressed,
                  busy && styles.disabled,
                ]}>
                <Text style={styles.ctaText}>
                  {busy ? 'Working…' : 'Upgrade to Pro'}
                </Text>
              </Pressable>
              <Text style={styles.fine}>
                From {formatCad(PRO_ANNUAL_MONTHLY_CAD)}/mo billed yearly, or{' '}
                {formatCad(PRO_MONTHLY_CAD)}/mo. Cancel anytime in Settings.
              </Text>
            </>
          ) : (
            <Pressable
              onPress={dismiss}
              style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
              <Text style={styles.ctaText}>Continue</Text>
            </Pressable>
          )}

          {message ? <Text style={styles.message}>{message}</Text> : null}
        </ScrollView>
      </View>
    </View>
  );

  if (Platform.OS === 'web') {
    return <View pointerEvents="box-none" style={styles.webRoot}>{body}</View>;
  }

  return (
    <Modal animationType="fade" transparent visible onRequestClose={dismiss}>
      {body}
    </Modal>
  );
}

const styles = StyleSheet.create({
  webRoot: {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'web'
      ? ({ position: 'fixed', inset: 0, zIndex: 90 } as object)
      : null),
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  card: {
    backgroundColor: '#12141C',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 380,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  closeBtn: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 2,
    padding: 6,
  },
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 22,
  },
  kicker: {
    color: palette.red,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.8,
    marginBottom: 8,
  },
  title: {
    color: '#F7F5F2',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 10,
    paddingRight: 28,
  },
  body: {
    color: '#C8C8CC',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  toggle: {
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  toggleOn: {
    backgroundColor: palette.red,
    borderColor: palette.red,
  },
  toggleText: {
    color: '#C8C8CC',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  toggleTextOn: {
    color: '#fff',
  },
  price: {
    color: '#F7F5F2',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
  },
  billed: {
    color: '#A8A8AE',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 14,
  },
  feature: {
    color: '#C8C8CC',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 4,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
    borderRadius: 14,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 48,
  },
  ctaText: {
    color: '#0C0C0E',
    fontSize: 15,
    fontWeight: '800',
  },
  fine: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  message: {
    color: palette.redLight,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.55 },
});
