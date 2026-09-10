import { Ionicons } from '@expo/vector-icons';
import Head from 'expo-router/head';
import { Redirect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { MarketingPhoneStack } from '@/components/marketing/phone-mocks';
import { MarketingChrome } from '@/components/marketing/site-chrome';
import { AppBootScreen } from '@/components/ux-feedback';
import { brand } from '@/config/app-config';
import { palette } from '@/constants/dropdex';
import { openAppPath } from '@/lib/open-app';
import { proMarketingFeatures, proPricingBlurb } from '@/services/subscriptions/tiers';
import { useAuth } from '@/store/auth-context';

const featureCards = [
  {
    icon: 'flash-outline' as const,
    title: 'Arm alerts in one tap',
    body: 'Home power ON watches your Pokémon Center region. OFF means DropLinq is idle.',
  },
  {
    icon: 'notifications-outline' as const,
    title: 'Lock-screen push',
    body: 'Add to Home Screen on iPhone, enable alerts, and get pinged when stock moves — even with the tab closed.',
  },
  {
    icon: 'options-outline' as const,
    title: 'Coverage you control',
    body: 'Popular, All TCG, or custom categories. Choose new, restock, and preorder events.',
  },
  {
    icon: 'eye-outline' as const,
    title: 'Watchlist + Stock',
    body: 'Pin the products you care about and scan live inventory without refreshing ten tabs.',
  },
  {
    icon: 'moon-outline' as const,
    title: 'Quiet hours & mutes',
    body: 'Sleep through the night. Silence one SKU without killing monitoring.',
  },
  {
    icon: 'rocket-outline' as const,
    title: 'Drop Mode',
    body: 'Full-screen overlay, sound, and speech while DropLinq is open so you never miss a wave.',
  },
];

export default function MarketingHome() {
  const router = useRouter();
  const { ready, profileReady, session, profile } = useAuth();
  const { width } = useWindowDimensions();
  const desktop = width >= 960;

  if (!ready || (session && !profileReady)) {
    return <AppBootScreen />;
  }

  // Logged-in users opening `/` go straight into the app (Collectr-style Open App).
  if (session && profile?.onboardingCompleted) {
    return <Redirect href="/(tabs)" />;
  }

  const goApp = () => router.push(openAppPath(session) as never);

  return (
    <MarketingChrome>
      <Head>
        <title>{brand.name} — Monitor · Alert · Check</title>
        <meta
          name="description"
          content="Independent Pokémon Center availability alerts. Arm monitoring, watch products, and get lock-screen pings when stock moves."
        />
      </Head>

      <View style={[styles.hero, desktop && styles.heroDesktop]}>
        <View style={[styles.heroCopy, desktop && { flex: 1.05 }]}>
          <Text style={styles.kicker}>{brand.tagline.toUpperCase()}</Text>
          <Text style={styles.headline}>
            Know the second it{'\n'}
            <Text style={styles.headlineAccent}>drops.</Text>
          </Text>
          <Text style={styles.sub}>
            DropLinq is the command center for Pokémon Center restocks. Arm alerts, tune coverage,
            and open the product before the wave is gone.
          </Text>
          <Pressable onPress={goApp} style={styles.primaryCta}>
            <Text style={styles.primaryCtaText}>
              {session ? 'Open App' : 'Start monitoring today'}
            </Text>
          </Pressable>
          <View style={styles.storeRow}>
            <View style={styles.storeBadge}>
              <Ionicons color={palette.white} name="globe-outline" size={16} />
              <Text style={styles.storeBadgeText}>Open in browser</Text>
            </View>
            <View style={[styles.storeBadge, styles.storeBadgeMuted]}>
              <Text style={styles.storeBadgeText}>iOS · To be decided</Text>
            </View>
            <View style={[styles.storeBadge, styles.storeBadgeMuted]}>
              <Text style={styles.storeBadgeText}>Android · To be decided</Text>
            </View>
          </View>
        </View>
        <View style={[styles.heroVisual, desktop && { flex: 1 }]}>
          <MarketingPhoneStack />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Everything a drop needs.</Text>
        <Text style={styles.sectionSub}>
          From arming alerts to silencing noise — DropLinq keeps availability monitoring in one
          place.
        </Text>
        <View style={[styles.grid, desktop && styles.gridDesktop]}>
          {featureCards.map((card) => (
            <View key={card.title} style={[styles.card, desktop && styles.cardDesktop]}>
              <Ionicons color={palette.red} name={card.icon} size={22} />
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardBody}>{card.body}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.split, desktop && styles.splitDesktop]}>
        <View style={{ flex: 1, gap: 12 }}>
          <Text style={styles.sectionTitle}>Watch your region move.</Text>
          <Text style={styles.sectionSub}>
            Live Stock for US, CA, UK, EU, AU, NZ, and JP storefronts. Filter by in-stock, sold out,
            new, and preorder — then open the official product page in one tap.
          </Text>
          <View style={styles.bullets}>
            {[
              'Live catalog with search and status chips',
              'Watchlist on Home for the SKUs that matter',
              'Test alerts so you know sound and push work',
            ].map((line) => (
              <Text key={line} style={styles.bullet}>
                ▲ {line}
              </Text>
            ))}
          </View>
        </View>
        <View style={styles.panel}>
          <Text style={styles.panelKicker}>TRUST</Text>
          <Text style={styles.panelTitle}>Monitor status you can see</Text>
          <Text style={styles.panelBody}>
            Power ON/OFF is obvious. Lock-screen setup has its own walkthrough. Alert history shows
            what already pinged you.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Supercharge with Pro.</Text>
        <Text style={styles.sectionSub}>{proPricingBlurb.trial.body}</Text>
        <View style={[styles.grid, desktop && styles.gridDesktop]}>
          {proMarketingFeatures.slice(0, 3).map((item) => (
            <View key={item.title} style={[styles.card, desktop && styles.cardDesktop]}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardBody}>{item.body}</Text>
            </View>
          ))}
        </View>
        <Pressable onPress={() => router.push('/pro' as never)} style={styles.secondaryCta}>
          <Text style={styles.secondaryCtaText}>Explore PRO</Text>
        </Pressable>
      </View>

      <View style={styles.closing}>
        <Text style={styles.closingTitle}>Start monitoring today.</Text>
        <Text style={styles.closingSub}>
          Free until your first drop day. Downloads · To be decided. Join collectors who want the
          ping, not the Discord chaos.
        </Text>
        <Pressable onPress={goApp} style={styles.primaryCta}>
          <Text style={styles.primaryCtaText}>Open App</Text>
        </Pressable>
      </View>
    </MarketingChrome>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 28,
    paddingTop: 24,
  },
  heroDesktop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 40,
    minHeight: 480,
    paddingTop: 40,
  },
  heroCopy: {
    gap: 16,
  },
  kicker: {
    color: palette.red,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  headline: {
    color: palette.white,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 46,
  },
  headlineAccent: {
    color: palette.redLight,
  },
  sub: {
    color: palette.whiteDim,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    maxWidth: 460,
  },
  primaryCta: {
    alignSelf: 'flex-start',
    backgroundColor: palette.red,
    borderRadius: 999,
    marginTop: 4,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  primaryCtaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  storeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  storeBadge: {
    alignItems: 'center',
    backgroundColor: '#151515',
    borderColor: palette.blackSoft,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  storeBadgeMuted: {
    opacity: 0.75,
  },
  storeBadgeText: {
    color: palette.whiteDim,
    fontSize: 12,
    fontWeight: '700',
  },
  heroVisual: {
    alignItems: 'center',
  },
  section: {
    gap: 12,
    marginTop: 64,
  },
  sectionTitle: {
    color: palette.white,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  sectionSub: {
    color: palette.whiteDim,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    maxWidth: 640,
  },
  grid: {
    gap: 12,
    marginTop: 8,
  },
  gridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  cardDesktop: {
    width: '31.5%',
  },
  cardTitle: {
    color: palette.white,
    fontSize: 17,
    fontWeight: '800',
  },
  cardBody: {
    color: palette.whiteShadow,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  split: {
    gap: 20,
    marginTop: 64,
  },
  splitDesktop: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: 28,
  },
  bullets: {
    gap: 8,
    marginTop: 4,
  },
  bullet: {
    color: palette.whiteDim,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  panel: {
    backgroundColor: '#140a0b',
    borderColor: palette.redDark,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    gap: 10,
    padding: 22,
  },
  panelKicker: {
    color: palette.red,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  panelTitle: {
    color: palette.white,
    fontSize: 22,
    fontWeight: '900',
  },
  panelBody: {
    color: palette.whiteDim,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
  },
  secondaryCta: {
    alignSelf: 'flex-start',
    borderColor: palette.red,
    borderRadius: 999,
    borderWidth: 1.5,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  secondaryCtaText: {
    color: palette.redLight,
    fontSize: 14,
    fontWeight: '800',
  },
  closing: {
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 72,
    paddingVertical: 12,
  },
  closingTitle: {
    color: palette.white,
    fontSize: 32,
    fontWeight: '900',
  },
  closingSub: {
    color: palette.whiteDim,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    maxWidth: 560,
  },
});
