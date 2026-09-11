import { Image } from 'expo-image';
import { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthLegalLinks } from '@/components/auth-legal-links';
import { palette } from '@/constants/dropdex';
import { useCookieConsent } from '@/hooks/use-cookie-consent';
import { useWebLayout } from '@/hooks/use-web-layout';

const brandIcon = require('../assets/images/icon.png');

/** Collectr-style teal for the recommended email CTA */
export const authAccent = '#3ECFBE';

type AuthShellProps = PropsWithChildren<{
  tagline: string;
}>;

/**
 * Centered auth card on black — constrained width on web so the form
 * doesn't stretch edge-to-edge like a full app page.
 */
export function AuthShell({ tagline, children }: AuthShellProps) {
  const { isWeb } = useWebLayout();
  const { needsBanner } = useCookieConsent();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isWeb && styles.scrollContentWeb,
            needsBanner && styles.scrollBanner,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.card, isWeb && styles.cardWeb]}>
            <View style={styles.brandBlock}>
              <Image accessibilityIgnoresInvertColors contentFit="cover" source={brandIcon} style={styles.brandIcon} />
              <Text style={styles.brand}>DROPLINQ</Text>
              <Text style={styles.tagline}>{tagline}</Text>
            </View>
            {children}
            <AuthLegalLinks />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const authStyles = StyleSheet.create({
  sectionLabel: {
    color: '#F7F5F2',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  emailCta: {
    alignItems: 'center',
    backgroundColor: authAccent,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  emailCtaText: {
    color: '#0A0A0A',
    fontSize: 15,
    fontWeight: '800',
  },
  recommendHint: {
    color: '#C2BEB8',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
    marginTop: 10,
  },
  recommendHintStrong: {
    fontStyle: 'italic',
    fontWeight: '800',
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    marginTop: 22,
  },
  dividerLine: { backgroundColor: palette.blackSoft, flex: 1, height: 1 },
  dividerText: {
    color: '#C2BEB8',
    fontSize: 13,
    fontWeight: '600',
  },
  oauthBtn: {
    alignItems: 'center',
    backgroundColor: '#141414',
    borderColor: '#2A2A2A',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
    minHeight: 48,
    paddingHorizontal: 16,
  },
  oauthText: {
    color: '#F7F5F2',
    fontSize: 15,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#141414',
    borderColor: '#2A2A2A',
    borderRadius: 10,
    borderWidth: 1,
    color: '#F7F5F2',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  error: {
    color: palette.red,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 2,
  },
  submitBtn: {
    alignItems: 'center',
    backgroundColor: authAccent,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 4,
    minHeight: 48,
  },
  submitText: {
    color: '#0A0A0A',
    fontSize: 15,
    fontWeight: '800',
  },
  linkMuted: {
    color: '#D8D5D0',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  footerBox: {
    borderColor: '#2A2A2A',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  footerCopy: { flex: 1 },
  footerTitle: {
    color: '#F7F5F2',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  footerLink: {
    color: '#F7F5F2',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    textDecorationLine: 'underline',
  },
  footerSecondary: {
    color: '#C2BEB8',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.55 },
  fieldLabel: {
    color: '#D8D5D0',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  emailForm: {
    marginTop: 12,
  },
});

const styles = StyleSheet.create({
  safe: { backgroundColor: '#000000', flex: 1 },
  fill: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  scrollContentWeb: {
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
    maxWidth: 420,
    width: '100%',
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandIcon: {
    borderRadius: 16,
    height: 64,
    marginBottom: 14,
    width: 64,
  },
  brand: {
    color: '#F7F5F2',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2.2,
  },
  tagline: {
    color: '#C2BEB8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginTop: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
