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
        <Text style={styles.kicker}>BILLING</Text>
        <Text style={styles.headline}>Checkout canceled</Text>
        <Text style={styles.sub}>You were not charged. Premium checkout is paused for now.</Text>
        <Pressable onPress={() => router.push('/' as never)} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Back home</Text>
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
  },
  sub: {
    color: palette.whiteDim,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  primaryBtn: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: palette.red,
    borderRadius: 12,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
