import Head from 'expo-router/head';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { MarketingChrome } from '@/components/marketing/site-chrome';
import { brand } from '@/config/app-config';
import {
  formatCad,
  proPriceLabel,
  type BillingInterval,
} from '@/constants/billing';
import { palette } from '@/constants/dropdex';
import { openAppPath } from '@/lib/open-app';
import { proMarketingFeatures, proPricingBlurb, tierCopy } from '@/services/subscriptions/tiers';
import { useAuth } from '@/store/auth-context';

export default function MarketingPro() {
  const router = useRouter();
  const { session, startProCheckout } = useAuth();
  const { width } = useWindowDimensions();
  const desktop = width >= 900;
  const [interval, setInterval] = useState<BillingInterval>('annual');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const price = proPriceLabel(interval);

  const goApp = () => router.push(openAppPath(session) as never);

  const onUpgrade = async () => {
    if (!session) {
      goApp();
      return;
    }
    setBusy(true);
    setMessage(null);
    const result = await startProCheckout(interval);
    setBusy(false);
    setMessage(result.ok ? 'Pro activated.' : result.message);
  };

  return (
    <MarketingChrome ctaLabel="Go PRO">
      <Head>
        <title>PRO — {brand.name}</title>
      </Head>

      <View style={styles.hero}>
        <Text style={styles.kicker}>DROPLINQ PRO</Text>
        <Text style={styles.headline}>Monitoring,{'\n'}supercharged.</Text>
        <Text style={styles.sub}>{proPricingBlurb.trial.body}</Text>
      </View>

      <View style={[styles.pricingRow, desktop && styles.pricingRowDesktop]}>
        <View style={styles.planCard}>
          <Text style={styles.planLabel}>Free</Text>
          <Text style={styles.planPrice}>$0</Text>
          <Text style={styles.planNote}>{tierCopy.FREE.summary}</Text>
          {tierCopy.FREE.features.map((f) => (
            <Text key={f} style={styles.featureLine}>
              · {f}
            </Text>
          ))}
          <Pressable onPress={goApp} style={styles.ghostBtn}>
            <Text style={styles.ghostBtnText}>Start free</Text>
          </Pressable>
        </View>

        <View style={[styles.planCard, styles.planCardPro]}>
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
          <Text style={styles.planLabel}>Pro</Text>
          <Text style={styles.planPrice}>{price.perMonth}</Text>
          <Text style={styles.planNote}>{price.billed}</Text>
          {tierCopy.PRO.features.map((f) => (
            <Text key={f} style={styles.featureLine}>
              · {f}
            </Text>
          ))}
          <Pressable disabled={busy} onPress={() => void onUpgrade()} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>
              {busy ? 'Working…' : session ? 'Upgrade to PRO' : 'Open App to go PRO'}
            </Text>
          </Pressable>
          <Text style={styles.comingSoon}>
            Free until your first drop day. Then {formatCad(6.99)}/mo or {formatCad(4.99)}/mo billed
            yearly. Cancel anytime from Settings.
          </Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Level up your drops.</Text>
        <View style={[styles.grid, desktop && styles.gridDesktop]}>
          {proMarketingFeatures.map((item) => (
            <View key={item.title} style={[styles.card, desktop && styles.cardDesktop]}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardBody}>{item.body}</Text>
            </View>
          ))}
        </View>
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
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 44,
  },
  sub: {
    color: palette.whiteDim,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    maxWidth: 640,
  },
  pricingRow: {
    gap: 14,
    marginTop: 32,
  },
  pricingRowDesktop: {
    flexDirection: 'row',
  },
  planCard: {
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    padding: 22,
  },
  planCardPro: {
    borderColor: palette.red,
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  toggle: {
    backgroundColor: '#101010',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toggleOn: {
    backgroundColor: palette.red,
  },
  toggleText: {
    color: palette.whiteShadow,
    fontSize: 12,
    fontWeight: '800',
  },
  toggleTextOn: {
    color: '#fff',
  },
  planLabel: {
    color: palette.white,
    fontSize: 18,
    fontWeight: '900',
  },
  planPrice: {
    color: palette.white,
    fontSize: 34,
    fontWeight: '900',
  },
  planNote: {
    color: palette.whiteShadow,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  featureLine: {
    color: palette.whiteDim,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },
  primaryBtn: {
    backgroundColor: palette.red,
    borderRadius: 999,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  ghostBtn: {
    borderColor: palette.blackSoft,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ghostBtnText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  comingSoon: {
    color: palette.whiteShadow,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    marginTop: 8,
  },
  message: {
    color: palette.redLight,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  section: {
    gap: 12,
    marginTop: 56,
  },
  sectionTitle: {
    color: palette.white,
    fontSize: 28,
    fontWeight: '900',
  },
  grid: {
    gap: 12,
  },
  gridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  cardDesktop: {
    width: '31.5%',
  },
  cardTitle: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '800',
  },
  cardBody: {
    color: palette.whiteShadow,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
});
