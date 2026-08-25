import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LEGAL_VERSION } from '@/constants/legal';
import { palette } from '@/constants/dropdex';
import { useAuth } from '@/store/auth-context';

export default function LegalAcceptScreen() {
  const { acceptLegal } = useAuth();
  const router = useRouter();
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
      return;
    }
    // AuthGate routes to onboarding or tabs once legal is saved on the profile.
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <View style={styles.screen}>
        <Text style={styles.brand}>DROPLINQ</Text>
        <Text style={styles.title}>Legal</Text>

        <Pressable
      unstable_pressDelay={0} onPress={() => router.push('/legal/terms')} style={styles.linkRow}>
          <Text style={styles.linkLabel}>Terms of Service</Text>
          <Ionicons color={palette.whiteShadow} name="chevron-forward" size={18} />
        </Pressable>
        <Pressable
      unstable_pressDelay={0} onPress={() => router.push('/legal/privacy')} style={styles.linkRow}>
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
  screen: { flex: 1, justifyContent: 'center', paddingHorizontal: 22 },
  brand: {
    color: palette.white,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 18,
    textAlign: 'center',
  },
  title: {
    color: palette.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 18,
    textAlign: 'center',
  },
  linkRow: {
    alignItems: 'center',
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  linkLabel: { color: palette.white, fontSize: 15, fontWeight: '800' },
  checkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  box: {
    alignItems: 'center',
    borderColor: palette.whiteShadow,
    borderRadius: 8,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  boxOn: { backgroundColor: palette.red, borderColor: palette.red },
  checkText: { color: palette.whiteDim, flex: 1, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  error: { color: palette.red, fontSize: 12, fontWeight: '800', marginTop: 12 },
  cta: {
    alignItems: 'center',
    backgroundColor: palette.red,
    borderRadius: 16,
    marginTop: 22,
    minHeight: 52,
    justifyContent: 'center',
  },
  ctaText: { color: palette.white, fontSize: 15, fontWeight: '900' },
  version: {
    color: palette.whiteShadow,
    fontSize: 11,
    marginTop: 16,
    textAlign: 'center',
  },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.55 },
});
