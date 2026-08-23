import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/constants/dropdex';
import { oauthRedirectHint } from '@/services/auth/oauth';
import { useAuth } from '@/store/auth-context';
import { OAuthProvider } from '@/services/auth/types';

export default function SignUpScreen() {
  const { signUp, signInWithProvider, signInAsGuest } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<OAuthProvider | null>(null);
  const [guestBusy, setGuestBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setMessage(null);
    const result = await signUp(email.trim(), password);
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    // AuthGate routes once profile is ready (avoids Legal → Tabs flash).
  };

  const oauth = async (provider: OAuthProvider) => {
    setOauthBusy(provider);
    setMessage(null);
    const result = await signInWithProvider(provider);
    setOauthBusy(null);
    if (!result.ok) {
      if (result.message !== 'Sign-in cancelled.') {
        setMessage(`${result.message}\n\nRedirect used:\n${oauthRedirectHint()}`);
      }
      return;
    }
  };

  const enterGuest = async () => {
    setGuestBusy(true);
    setMessage(null);
    const result = await signInAsGuest();
    setGuestBusy(false);
    if (!result.ok) {
      setMessage(result.message);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}>
        <View style={styles.screen}>
          <View style={styles.hero}>
            <Text style={styles.brand}>DROPLINQ</Text>
            <Text style={styles.tagline}>Create your monitoring command center</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>SIGN UP</Text>

            <Pressable
              disabled={!!oauthBusy || busy}
              onPress={() => void oauth('apple')}
              style={({ pressed }) => [
                styles.oauthBubble,
                styles.appleBubble,
                pressed && styles.pressed,
              ]}>
              <Ionicons color={palette.black} name="logo-apple" size={22} />
              <Text style={styles.oauthAppleText}>
                {oauthBusy === 'apple' ? 'Opening Apple…' : 'Continue with Apple'}
              </Text>
            </Pressable>

            <Pressable
              disabled={!!oauthBusy || busy}
              onPress={() => void oauth('google')}
              style={({ pressed }) => [
                styles.oauthBubble,
                styles.googleBubble,
                pressed && styles.pressed,
              ]}>
              <Ionicons color={palette.white} name="logo-google" size={20} />
              <Text style={styles.oauthGoogleText}>
                {oauthBusy === 'google' ? 'Opening Google…' : 'Continue with Google'}
              </Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR EMAIL</Text>
              <View style={styles.dividerLine} />
            </View>

            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={palette.whiteShadow}
              style={styles.input}
              value={email}
            />
            <TextInput
              onChangeText={setPassword}
              placeholder="Password (8+ characters)"
              placeholderTextColor={palette.whiteShadow}
              secureTextEntry
              style={styles.input}
              value={password}
            />
            {message ? <Text style={styles.error}>{message}</Text> : null}

            <Pressable
              disabled={busy || !!oauthBusy}
              onPress={() => void submit()}
              style={({ pressed }) => [styles.primaryBubble, pressed && styles.pressed]}>
              <Ionicons color={palette.white} name="person-add" size={20} />
              <Text style={styles.primaryText}>{busy ? 'Creating…' : 'Create account'}</Text>
            </Pressable>
          </View>

          <Pressable
            disabled={guestBusy || busy || !!oauthBusy}
            onPress={() => void enterGuest()}
            style={({ pressed }) => [styles.guestBubble, pressed && styles.pressed]}>
            <Ionicons color={palette.whiteDim} name="person-outline" size={20} />
            <View style={styles.guestCopy}>
              <Text style={styles.guestTitle}>
                {guestBusy ? 'Entering…' : 'Continue as guest'}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(auth)/sign-in')}
            style={({ pressed }) => [styles.signinBubble, pressed && styles.pressed]}>
            <Text style={styles.signinTitle}>Have an account? Sign in</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: palette.black, flex: 1 },
  fill: { flex: 1 },
  screen: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 18,
  },
  hero: { alignItems: 'center' },
  brand: {
    color: palette.white,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 3.5,
  },
  tagline: {
    color: palette.whiteShadow,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  cardTitle: {
    color: palette.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  cardCaption: {
    color: palette.whiteShadow,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
    marginTop: 6,
  },
  oauthBubble: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 10,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  appleBubble: { backgroundColor: palette.white },
  googleBubble: {
    backgroundColor: palette.black,
    borderColor: palette.blackSoft,
    borderWidth: 1,
  },
  oauthAppleText: { color: palette.black, fontSize: 15, fontWeight: '800' },
  oauthGoogleText: { color: palette.white, fontSize: 15, fontWeight: '800' },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    marginTop: 4,
  },
  dividerLine: { backgroundColor: palette.blackSoft, flex: 1, height: 1 },
  dividerText: {
    color: palette.whiteShadow,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  input: {
    backgroundColor: palette.black,
    borderColor: palette.blackSoft,
    borderRadius: 14,
    borderWidth: 1,
    color: palette.white,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  error: { color: palette.red, fontSize: 12, fontWeight: '800', marginBottom: 10 },
  primaryBubble: {
    alignItems: 'center',
    backgroundColor: palette.red,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 2,
  },
  primaryText: { color: palette.white, fontSize: 15, fontWeight: '900', letterSpacing: 0.6 },
  signinBubble: {
    backgroundColor: palette.blackRaised,
    borderColor: palette.red,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  signinEyebrow: {
    color: palette.red,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  signinTitle: {
    color: palette.white,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 6,
  },
  signinCaption: {
    color: palette.whiteShadow,
    fontSize: 12,
    marginTop: 4,
  },
  guestBubble: {
    alignItems: 'center',
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  guestCopy: { flex: 1 },
  guestEyebrow: {
    color: palette.whiteShadow,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  guestTitle: {
    color: palette.white,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 4,
  },
  guestCaption: {
    color: palette.whiteShadow,
    fontSize: 11,
    marginTop: 3,
  },
  pressed: { opacity: 0.88 },
});
