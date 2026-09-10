import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { brand } from '@/config/app-config';
import { palette } from '@/constants/dropdex';
import { LegalDocId, legalDocuments, legalHref, legalNav } from '@/constants/legal';
import { useCookieConsent } from '@/hooks/use-cookie-consent';
import { useWebLayout } from '@/hooks/use-web-layout';
import { useAuth } from '@/store/auth-context';

export function LegalDocumentScreen({ doc }: { doc: LegalDocId }) {
  const router = useRouter();
  const { isWeb, isDesktopWeb } = useWebLayout();
  const { session } = useAuth();
  const { needsBanner } = useCookieConsent();
  const { title, body } = legalDocuments[doc];

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace((session ? '/(tabs)' : '/start') as never);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          isWeb && styles.scrollWeb,
          needsBanner && styles.scrollBanner,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={[styles.card, isWeb && styles.cardWeb, isDesktopWeb && styles.cardDesktop]}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={goBack}
            style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}>
            <Ionicons color={palette.whiteDim} name="chevron-back" size={18} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <View style={styles.brandBlock}>
            <Text accessibilityRole="header" style={styles.brand}>
              {brand.displayName}
            </Text>
            <Text style={styles.tagline}>{brand.tagline}</Text>
          </View>

          <Text style={styles.sectionLabel}>Legal</Text>
          <Text accessibilityRole="header" style={styles.heading}>
            {title}
          </Text>
          <Text style={styles.copy}>{body}</Text>

          <View style={styles.nav}>
            {legalNav.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="link"
                disabled={item.id === doc}
                onPress={() => router.push(legalHref(item.href))}
                style={({ pressed }) => [
                  styles.navChip,
                  item.id === doc && styles.navChipOn,
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.navText, item.id === doc && styles.navTextOn]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.contact}>
            {brand.legalName} · {brand.jurisdiction} · {brand.contactEmail}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: '#000000', flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  scrollWeb: {
    alignItems: 'center',
  },
  scrollBanner: {
    paddingBottom: 180,
  },
  card: {
    backgroundColor: '#111111',
    borderColor: '#2A2A2A',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 28,
    width: '100%',
  },
  cardWeb: {
    maxWidth: 520,
  },
  cardDesktop: {
    maxWidth: 720,
  },
  backRow: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 18,
  },
  backText: {
    color: palette.whiteDim,
    fontSize: 14,
    fontWeight: '700',
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brand: {
    color: palette.white,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2.2,
  },
  tagline: {
    color: palette.whiteShadow,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginTop: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  sectionLabel: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  heading: {
    color: palette.white,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 16,
  },
  copy: {
    color: palette.whiteDim,
    fontSize: 13,
    lineHeight: 21,
  },
  nav: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 24,
  },
  navChip: {
    borderColor: '#2A2A2A',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  navChipOn: {
    backgroundColor: 'rgba(210,13,30,0.16)',
    borderColor: palette.red,
  },
  navText: {
    color: palette.whiteDim,
    fontSize: 12,
    fontWeight: '800',
  },
  navTextOn: {
    color: palette.white,
  },
  contact: {
    color: palette.whiteShadow,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 18,
  },
  pressed: { opacity: 0.85 },
});
