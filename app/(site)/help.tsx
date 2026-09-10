import Head from 'expo-router/head';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { MarketingChrome } from '@/components/marketing/site-chrome';
import { brand } from '@/config/app-config';
import { palette } from '@/constants/dropdex';
import { legalHref } from '@/constants/legal';
import { useRouter } from 'expo-router';

const faqs = [
  {
    q: 'How do lock-screen alerts work on iPhone?',
    a: 'Use Safari → Share → Add to Home Screen → open the DropLinq icon → Settings → Home Screen & lock-screen → Enable alerts. Regular Safari tabs and in-app browsers often block closed-app push.',
  },
  {
    q: 'What is the free trial?',
    a: 'Not a useless 7-day clock. DropLinq stays free until we alert you on your first real drop day. After that day, Pro keeps full monitoring if you want to continue.',
  },
  {
    q: 'Does monitoring work with the website closed?',
    a: 'Yes when lock-screen push is set up and the DropLinq monitor service is awake. Keep Alerts armed on Home.',
  },
  {
    q: 'Is DropLinq affiliated with Pokémon Center?',
    a: 'No. DropLinq is an independent availability monitor and is not endorsed by Nintendo, The Pokémon Company, or any retailer we watch.',
  },
];

export default function MarketingHelp() {
  const router = useRouter();

  return (
    <MarketingChrome>
      <Head>
        <title>Help — {brand.name}</title>
      </Head>

      <View style={styles.hero}>
        <Text style={styles.kicker}>HELP CENTER</Text>
        <Text style={styles.headline}>Answers & support</Text>
        <Text style={styles.sub}>
          Support inbox · <Text style={styles.tbd}>To be decided</Text>
          {'\n'}
          We will publish a dedicated help email once branding DNS is ready. Until then, use the
          contact on your account Settings or the placeholder below.
        </Text>
        <Pressable
          onPress={() => void Linking.openURL(`mailto:${brand.contactEmail}`)}
          style={styles.mailBtn}>
          <Text style={styles.mailBtnText}>Email placeholder · {brand.contactEmail}</Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {faqs.map((item) => (
          <View key={item.q} style={styles.card}>
            <Text style={styles.q}>{item.q}</Text>
            <Text style={styles.a}>{item.a}</Text>
          </View>
        ))}
      </View>

      <View style={styles.links}>
        <Pressable onPress={() => router.push(legalHref('/legal/terms') as never)}>
          <Text style={styles.link}>Terms of Service</Text>
        </Pressable>
        <Pressable onPress={() => router.push(legalHref('/legal/privacy') as never)}>
          <Text style={styles.link}>Privacy Policy</Text>
        </Pressable>
        <Pressable onPress={() => router.push(legalHref('/legal/refund') as never)}>
          <Text style={styles.link}>Refund Policy</Text>
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
    fontSize: 36,
    fontWeight: '900',
  },
  sub: {
    color: palette.whiteDim,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  tbd: {
    color: palette.redLight,
    fontWeight: '800',
  },
  mailBtn: {
    alignSelf: 'flex-start',
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mailBtnText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '700',
  },
  list: {
    gap: 12,
    marginTop: 28,
  },
  card: {
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  q: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '800',
  },
  a: {
    color: palette.whiteShadow,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 28,
  },
  link: {
    color: palette.redLight,
    fontSize: 13,
    fontWeight: '800',
  },
});
