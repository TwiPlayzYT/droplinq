import Head from 'expo-router/head';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MarketingChrome } from '@/components/marketing/site-chrome';
import { brand } from '@/config/app-config';
import { palette } from '@/constants/dropdex';
import { resolveEntitlements } from '@/services/subscriptions/entitlements';
import { useAuth } from '@/store/auth-context';

export default function BillingSuccess() {
  const router = useRouter();
  const { session, profile, refreshProfile } = useAuth();
  const paid = resolveEntitlements(profile).status === 'active';
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!session || paid) return;
    const timer = setInterval(() => {
      void refreshProfile();
      setAttempts((count) => count + 1);
    }, 2500);
    void refreshProfile();
    return () => clearInterval(timer);
  }, [paid, refreshProfile, session]);

  const status = !session
    ? 'Sign in with the same account you paid with. Pro is not unlocked from this page.'
    : paid
      ? 'You’re on DropLinq Pro.'
      : attempts >= 12
        ? 'Payment received. Pro unlocks after Stripe confirms the charge — usually a few seconds. Open Settings if this is still pending.'
        : 'Confirming your payment with Stripe…';

  return (
    <MarketingChrome ctaLabel="Open App">
      <Head>
        <title>Billing — {brand.name}</title>
      </Head>
      <View style={styles.hero}>
        <Text style={styles.kicker}>DROPLINQ PRO</Text>
        <Text style={styles.headline}>{paid ? 'You’re on Pro' : 'Thanks — checking payment'}</Text>
        <Text style={styles.sub}>
          {status} This page never grants Pro by itself. Only a paid Stripe subscription on your
          account does.
        </Text>
        <Pressable onPress={() => router.push('/settings' as never)} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Go to Settings</Text>
        </Pressable>
      </View>
    </MarketingChrome>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 12,
    paddingTop: 28,
  },
  kicker: {
    color: palette.red,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  headline: {
    color: palette.white,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  sub: {
    color: palette.whiteDim,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    maxWidth: 640,
  },
  primaryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: palette.red,
    borderRadius: 999,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
