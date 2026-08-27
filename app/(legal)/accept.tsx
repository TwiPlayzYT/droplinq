import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthShell, authStyles } from '@/components/auth-shell';
import { LEGAL_VERSION } from '@/constants/legal';
import { palette } from '@/constants/dropdex';
import { useWebLayout } from '@/hooks/use-web-layout';
import { useAuth } from '@/store/auth-context';

export default function LegalAcceptScreen() {
  const { acceptLegal } = useAuth();
  const router = useRouter();
  const { isWeb } = useWebLayout();
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const continueNext = async () => {
    if (!agreed) {
      setError('Please agree to continue.');
      return;
    }
    setBusy(true);
    setError(null);
    const result = await acceptLegal();
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
    }
  };

  if (isWeb) {
    return (
      <AuthShell tagline="Monitor · Alert · Secure">
        <Text style={authStyles.sectionLabel}>Legal</Text>
        <Text style={styles.webLead}>
          Review and accept before using DropLinq on the web.
        </Text>

        <Pressable
          unstable_pressDelay={0}
          onPress={() => router.push('/legal/terms')}
          style={({ pressed }) => [authStyles.oauthBtn, pressed && authStyles.pressed]}>
          <Ionicons color={palette.whiteDim} name="document-text-outline" size={20} />
          <Text style={authStyles.oauthText}>Terms of Service</Text>
        </Pressable>
        <Pressable
          unstable_pressDelay={0}
          onPress={() => router.push('/legal/privacy')}
          style={({ pressed }) => [authStyles.oauthBtn, pressed && authStyles.pressed]}>
          <Ionicons color={palette.whiteDim} name="shield-checkmark-outline" size={20} />
          <Text style={authStyles.oauthText}>Privacy Policy</Text>
        </Pressable>

        <Pressable
          unstable_pressDelay={0}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          onPress={() => setAgreed((value) => !value)}
          style={styles.checkRow}>
          <View style={[styles.box, agreed && styles.boxOn]}>
            {agreed ? <Ionicons color={palette.white} name="checkmark" size={16} /> : null}
          </View>
          <Text style={styles.checkText}>
            I agree to the Terms of Service and Privacy Policy
          </Text>
        </Pressable>

        {error ? <Text style={authStyles.error}>{error}</Text> : null}

        <Pressable
          unstable_pressDelay={0}
          disabled={busy}
          onPress={() => void continueNext()}
          style={({ pressed }) => [
            authStyles.submitBtn,
            pressed && authStyles.pressed,
            busy && authStyles.disabled,
          ]}>
          <Text style={authStyles.submitText}>{busy ? 'Saving…' : 'Continue'}</Text>
        </Pressable>
        <Text style={styles.version}>v{LEGAL_VERSION}</Text>
      </AuthShell>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <View style={styles.screen}>
        <Text style={styles.brand}>DROPLINQ</Text>
        <Text style={styles.title}>Legal</Text>

        <Pressable
          unstable_pressDelay={0}
          onPress={() => router.push('/legal/terms')}
          style={styles.linkRow}>
          <Text style={styles.linkLabel}>Terms of Service</Text>
          <Ionicons color={palette.whiteShadow} name="chevron-forward" size={18} />
        </Pressable>
        <Pressable
          unstable_pressDelay={0}
          onPress={() => router.push('/legal/privacy')}
          style={styles.linkRow}>
          <Text style={styles.linkLabel}>Privacy Policy</Text>
          <Ionicons color={palette.whiteShadow} name="chevron-forward" size={18} />
        </Pressable>

        <Pressable
          unstable_pressDelay={0}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          onPress={() => setAgreed((value) => !value)}
          style={styles.checkRow}>
          <View style={[styles.box, agreed && styles.boxOn]}>
            {agreed ? <Ionicons color={palette.white} name="checkmark" size={16} /> : null}
          </View>
          <Text style={styles.checkText}>I agree to the Terms of Service and Privacy Policy</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          unstable_pressDelay={0}
          disabled={busy}
          onPress={() => void continueNext()}
          style={({ pressed }) => [styles.cta, pressed && styles.pressed, busy && styles.disabled]}>
          <Text style={styles.ctaText}>{busy ? 'Saving…' : 'Continue'}</Text>
        </Pressable>

        <Text style={styles.version}>v{LEGAL_VERSION}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: palette.black, flex: 1 },
  screen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  brand: {
    color: palette.white,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 10,
    textAlign: 'center',
  },
  title: {
    color: palette.white,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 18,
    textAlign: 'center',
  },
  webLead: {
    color: palette.whiteShadow,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  linkRow: {
    alignItems: 'center',
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  linkLabel: { color: palette.white, fontSize: 15, fontWeight: '700' },
  checkRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  box: {
    alignItems: 'center',
    borderColor: palette.blackSoft,
    borderRadius: 6,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    marginTop: 1,
    width: 22,
  },
  boxOn: { backgroundColor: palette.red, borderColor: palette.red },
  checkText: {
    color: palette.whiteDim,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  error: {
    color: palette.red,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: palette.red,
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 48,
  },
  ctaText: { color: palette.white, fontSize: 15, fontWeight: '900' },
  version: {
    color: palette.whiteShadow,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.55 },
});
