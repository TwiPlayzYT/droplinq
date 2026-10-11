import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { PropsWithChildren, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthLegalLinks } from '@/components/auth-legal-links';
import { pressTab } from '@/components/button-press';
import { palette } from '@/constants/dropdex';
import { useCookieConsent } from '@/hooks/use-cookie-consent';
import { useWebLayout } from '@/hooks/use-web-layout';

const brandIcon = require('../assets/images/icon.png');

/** DropLinq red. Light text sits on it. */
export const authAccent = '#D20D1E';

export type AuthMode = 'login' | 'signup';

type AuthShellProps = PropsWithChildren<{
  mode?: AuthMode;
  tagline: string;
}>;

const MODE_COPY: Record<AuthMode, { title: string; line: string }> = {
  login: { title: 'Log in', line: 'Open your command center.' },
  signup: { title: 'Sign up', line: 'Create your DropLinq account.' },
};

function installOrbMotion() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById('dl-auth-motion')) return;
  const style = document.createElement('style');
  style.id = 'dl-auth-motion';
  style.textContent = `
    @keyframes dl-auth-drift {
      0%, 100% { transform: translate3d(0, 0, 0); }
      50% { transform: translate3d(22px, -28px, 0); }
    }
    @media (prefers-reduced-motion: reduce) {
      [data-dl-orb] { animation: none !important; }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Centered auth card on black — constrained width on web so the form
 * doesn't stretch edge-to-edge like a full app page.
 */
function Atmosphere({ wide }: { wide: boolean }) {
  useEffect(() => {
    installOrbMotion();
  }, []);

  const drift =
    Platform.OS === 'web'
      ? ({ animation: 'dl-auth-drift 18s ease-in-out infinite' } as object)
      : null;

  return (
    <View pointerEvents="none" style={styles.atmosphere}>
      <View
        dataSet={{ dlOrb: '1' }}
        style={[styles.orb, styles.orbRed, wide && styles.orbRedWide, drift]}
      />
      <View style={[styles.orb, styles.orbDim, wide && styles.orbDimWide]} />
    </View>
  );
}

function ModeSwitch({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const copy = MODE_COPY[mode];

  return (
    <View style={styles.modeBlock}>
      <View accessibilityRole="tablist" style={styles.switchTrack}>
        <Pressable
          accessibilityLabel="Log in"
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === 'login' }}
          onPress={() => {
            if (mode !== 'login') router.replace('/sign-in' as never);
          }}
          style={[styles.switchBubble, mode === 'login' && styles.switchBubbleOn]}
          dataSet={pressTab(mode === 'login')}>
          <Text style={[styles.switchLabel, mode === 'login' && styles.switchLabelOn]}>Log in</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Sign up"
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === 'signup' }}
          onPress={() => {
            if (mode !== 'signup') router.replace('/start' as never);
          }}
          style={[styles.switchBubble, mode === 'signup' && styles.switchBubbleOn]}
          dataSet={pressTab(mode === 'signup')}>
          <Text style={[styles.switchLabel, mode === 'signup' && styles.switchLabelOn]}>Sign up</Text>
        </Pressable>
      </View>
      <Text style={styles.modeTitle}>{copy.title}</Text>
      <Text style={styles.modeLine}>{copy.line}</Text>
    </View>
  );
}

export function AuthShell({ mode, tagline, children }: AuthShellProps) {
  const { isWeb, isDesktopWeb } = useWebLayout();
  const { needsBanner } = useCookieConsent();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <Atmosphere wide={isDesktopWeb} />
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
          <View style={[styles.card, isWeb && styles.cardWeb, isDesktopWeb && styles.cardDesktop]}>
            <View style={styles.brandBlock}>
              <Image accessibilityIgnoresInvertColors contentFit="cover" source={brandIcon} style={styles.brandIcon} />
              <Text style={styles.brand}>DROPLINQ</Text>
              <Text style={styles.tagline}>{tagline}</Text>
            </View>
            {mode ? <ModeSwitch mode={mode} /> : null}
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
    color: '#F7F5F2',
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
    color: '#F7F5F2',
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
  pressed: Platform.OS === 'web' ? {} : { transform: [{ scale: 0.96 }] },
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
  safe: { backgroundColor: '#070707', flex: 1, overflow: 'hidden' },
  atmosphere: { ...StyleSheet.absoluteFillObject },
  orb: {
    borderRadius: 999,
    position: 'absolute',
  },
  orbRed: {
    backgroundColor: 'rgba(210, 13, 30, 0.42)',
    height: 280,
    left: -80,
    top: -40,
    width: 280,
  },
  orbRedWide: {
    height: 420,
    left: -60,
    top: -80,
    width: 420,
  },
  orbDim: {
    backgroundColor: 'rgba(210, 13, 30, 0.22)',
    bottom: -90,
    height: 320,
    right: -110,
    width: 320,
  },
  orbDimWide: {
    height: 460,
    right: -40,
    width: 460,
  },
  fill: { flex: 1 },
  modeBlock: {
    marginBottom: 22,
  },
  switchTrack: {
    backgroundColor: '#0C0C0C',
    borderColor: '#3A3A3A',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 4,
  },
  switchBubble: {
    alignItems: 'center',
    borderRadius: 999,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  switchBubbleOn: {
    backgroundColor: authAccent,
  },
  switchLabel: {
    color: '#A9A6A2',
    fontSize: 15,
    fontWeight: '800',
  },
  switchLabelOn: {
    color: '#F7F5F2',
  },
  modeTitle: {
    color: '#F7F5F2',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 18,
  },
  modeLine: {
    color: '#C2BEB8',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
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
