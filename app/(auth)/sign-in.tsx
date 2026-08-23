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

import { isMockData } from '@/config/app-config';
import { palette } from '@/constants/dropdex';
import { oauthRedirectHint } from '@/services/auth/oauth';
import { useAuth } from '@/store/auth-context';
import { OAuthProvider } from '@/services/auth/types';

export default function SignInScreen() {
  const { signIn, signInWithProvider, requestPasswordReset } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<OAuthProvider | null>(null);

  const submit = async () => {
    setBusy(true);
    setMessage(null);
    const result = await signIn(email.trim(), password);
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
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}>
        <View style={styles.screen}>
          <View style={styles.hero}>
            <View style={styles.ball}>
              <View style={styles.ballTop} />
              <View style={styles.ballLine} />
              <View style={styles.ballButton} />
            </View>
            <Text style={styles.brand}>DROPLINQ</Text>
            <Text style={styles.tagline}>Welcome back</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>SIGN IN</Text>

            <Pressable
              disabled={!!oauthBusy || busy}
              onPress={() => void oauth('apple')}
              style={({ pressed }) => [
                styles.oauthBubble,
                styles.appleBubble,
                pressed && styles.pressed,
                (oauthBusy || busy) && styles.disabled,
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
                (oauthBusy || busy) && styles.disabled,
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
              placeholder="Password"
              placeholderTextColor={palette.whiteShadow}
              secureTextEntry
              style={styles.input}
              value={password}
            />

            {message ? <Text style={styles.error}>{message}</Text> : null}

            <Pressable
              disabled={busy || !!oauthBusy}
              onPress={() => void submit()}
              style={({ pressed }) => [
                styles.primaryBubble,
                pressed && styles.pressed,
                (busy || oauthBusy) && styles.disabled,
              ]}>
              <Ionicons color={palette.white} name="log-in" size={20} />
              <Text style={styles.primaryText}>{busy ? 'Signing in…' : 'Sign in'}</Text>
            </Pressable>

            <Pressable
              onPress={async () => {
                if (!email.trim()) {
                  setMessage('Enter your email first.');
                  return;
                }
                const result = await requestPasswordReset(email.trim());
                setMessage(
                  result.ok
                    ? isMockData
                      ? 'Password reset prepared. Enable email auth in Supabase to send a real link.'
                      : 'If that email exists, a reset link is on its way.'
                    : result.message,
                );
              }}>
              <Text style={styles.forgot}>Forgot password?</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.replace('/(auth)')}
            style={({ pressed }) => [styles.signupBubble, pressed && styles.pressed]}>
            <Text style={styles.signupTitle}>Need an account? Sign up</Text>
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
    paddingTop: 8,
  },
  hero: { alignItems: 'center', paddingTop: 8 },
  ball: {
    backgroundColor: palette.white,
    borderRadius: 28,
    height: 56,
    marginBottom: 14,
    overflow: 'hidden',
    width: 56,
  },
  ballTop: { backgroundColor: palette.red, height: '50%', width: '100%' },
  ballLine: {
    backgroundColor: palette.black,
    height: 4,
    left: 0,
    position: 'absolute',
    right: 0,
    top: '50%',
    marginTop: -2,
  },
  ballButton: {
    backgroundColor: palette.white,
    borderColor: palette.black,
    borderRadius: 6,
    borderWidth: 2,
    height: 12,
    left: '50%',
    marginLeft: -6,
    marginTop: -6,
    position: 'absolute',
    top: '50%',
    width: 12,
  },
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
  forgot: {
    color: palette.whiteDim,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 14,
    textAlign: 'center',
  },
  signupBubble: {
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  signupEyebrow: {
    color: palette.whiteShadow,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  signupTitle: {
    color: palette.white,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 6,
  },
  signupCaption: {
    color: palette.whiteShadow,
    fontSize: 12,
    marginTop: 4,
  },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.55 },
});
