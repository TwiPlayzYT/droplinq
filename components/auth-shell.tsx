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

import { palette } from '@/constants/dropdex';
import { useWebLayout } from '@/hooks/use-web-layout';

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

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isWeb && styles.scrollContentWeb,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.card, isWeb && styles.cardWeb]}>
            <View style={styles.brandBlock}>
              <Text style={styles.brand}>DROPLINQ</Text>
              <Text style={styles.tagline}>{tagline}</Text>
            </View>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const authStyles = StyleSheet.create({
  sectionLabel: {
    color: palette.white,
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
    color: palette.black,
    fontSize: 15,
    fontWeight: '800',
  },
  recommendHint: {
    color: palette.whiteShadow,
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
    color: palette.whiteShadow,
    fontSize: 13,
    fontWeight: '600',
  },
  oauthBtn: {
    alignItems: 'center',
    backgroundColor: '#141414',
    borderColor: palette.blackSoft,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
    minHeight: 48,
    paddingHorizontal: 16,
  },
  oauthText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#141414',
    borderColor: palette.blackSoft,
    borderRadius: 10,
    borderWidth: 1,
    color: palette.white,
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
    color: palette.black,
    fontSize: 15,
    fontWeight: '800',
  },
  linkMuted: {
    color: palette.whiteDim,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  footerBox: {
    borderColor: palette.blackSoft,
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
    color: palette.white,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  footerLink: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    textDecorationLine: 'underline',
  },
  footerSecondary: {
    color: palette.whiteShadow,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.55 },
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
});
