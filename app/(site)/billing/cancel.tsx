import Head from 'expo-router/head';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MarketingChrome } from '@/components/marketing/site-chrome';
import { brand } from '@/config/app-config';
import { palette } from '@/constants/dropdex';

export default function BillingCancel() {
  const router = useRouter();

  return (
    <MarketingChrome ctaLabel="Open App">
      <Head>
        <title>Checkout canceled — {brand.name}</title>
      </Head>
      <View style={styles.hero}>
        <Text style={styles.kicker}>DROPLINQ PRO</Text>
        <Text style={styles.headline}>Checkout canceled</Text>
        <Text style={styles.sub}>
          You were not charged. Pro stays locked until a paid Stripe subscription is on your
          account.
        </Text>
        <Pressable onPress={() => router.push('/pro' as never)} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Back to Pro</Text>
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
