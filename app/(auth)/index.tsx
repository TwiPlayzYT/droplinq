import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { AuthShell, authStyles } from '@/components/auth-shell';
import { palette } from '@/constants/dropdex';
import { oauthRedirectHint } from '@/services/auth/oauth';
import { OAuthProvider } from '@/services/auth/types';
import { useAuth } from '@/store/auth-context';

export default function SignUpScreen() {
  const { signUp, signInWithProvider, signInAsGuest } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<OAuthProvider | null>(null);
  const [guestBusy, setGuestBusy] = useState(false);
  const [emailMode, setEmailMode] = useState(false);

  const submit = async () => {
    setBusy(true);
    setMessage(null);
    const result = await signUp(email.trim(), password);
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message);
    }
  };

  const oauth = async (provider: OAuthProvider) => {
    setOauthBusy(provider);
    setMessage(null);
    const result = await signInWithProvider(provider);
    setOauthBusy(null);
    if (!result.ok && result.message !== 'Sign-in cancelled.') {
      setMessage(`${result.message}\n\nRedirect used:\n${oauthRedirectHint()}`);
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

  const locked = busy || !!oauthBusy || guestBusy;

  return (
    <AuthShell tagline="Monitor · Alert · Secure">
      <Text style={authStyles.sectionLabel}>Recommended</Text>

      {!emailMode ? (
        <>
          <Pressable
            unstable_pressDelay={0}
            disabled={locked}
            onPress={() => {
              setMessage(null);
              setEmailMode(true);
            }}
            style={({ pressed }) => [
              authStyles.emailCta,
              pressed && authStyles.pressed,
              locked && authStyles.disabled,
            ]}>
            <Ionicons color={palette.controlInk} name="mail" size={18} />
            <Text style={authStyles.emailCtaText}>Continue with email</Text>
          </Pressable>
          <Text style={authStyles.recommendHint}>
            We <Text style={authStyles.recommendHintStrong}>strongly</Text> recommend this
            option if you have experienced login issues.
          </Text>
        </>
      ) : (
        <View style={authStyles.emailForm}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={palette.whiteShadow}
            style={authStyles.input}
            value={email}
          />
          <TextInput
            onChangeText={setPassword}
            placeholder="Password (8+ characters)"
            placeholderTextColor={palette.whiteShadow}
            secureTextEntry
            style={authStyles.input}
            value={password}
          />
          {message ? <Text style={authStyles.error}>{message}</Text> : null}
          <Pressable
            unstable_pressDelay={0}
            disabled={locked}
            onPress={() => void submit()}
            style={({ pressed }) => [
              authStyles.submitBtn,
              pressed && authStyles.pressed,
              locked && authStyles.disabled,
            ]}>
            <Ionicons color={palette.controlInk} name="person-add" size={18} />
            <Text style={authStyles.submitText}>{busy ? 'Creating…' : 'Create account'}</Text>
          </Pressable>
        </View>
      )}

      <View style={authStyles.dividerRow}>
        <View style={authStyles.dividerLine} />
        <Text style={authStyles.dividerText}>Or continue with</Text>
        <View style={authStyles.dividerLine} />
      </View>

      <Pressable
        unstable_pressDelay={0}
        disabled={locked}
        onPress={() => void oauth('google')}
        style={({ pressed }) => [
          authStyles.oauthBtn,
          pressed && authStyles.pressed,
          locked && authStyles.disabled,
        ]}>
        <Ionicons color="#EA4335" name="logo-google" size={20} />
        <Text style={authStyles.oauthText}>
          {oauthBusy === 'google' ? 'Opening Google…' : 'Continue with Google'}
        </Text>
      </Pressable>

      <Pressable
        unstable_pressDelay={0}
        disabled={locked}
        onPress={() => void oauth('apple')}
        style={({ pressed }) => [
          authStyles.oauthBtn,
          pressed && authStyles.pressed,
          locked && authStyles.disabled,
        ]}>
        <Ionicons color={palette.white} name="logo-apple" size={22} />
        <Text style={authStyles.oauthText}>
          {oauthBusy === 'apple' ? 'Opening Apple…' : 'Continue with Apple'}
        </Text>
      </Pressable>

      <Pressable
        unstable_pressDelay={0}
        disabled={locked}
        onPress={() => void enterGuest()}
        style={({ pressed }) => [
          authStyles.oauthBtn,
          pressed && authStyles.pressed,
          locked && authStyles.disabled,
        ]}>
        <Ionicons color={palette.whiteDim} name="person-outline" size={20} />
        <Text style={authStyles.oauthText}>
          {guestBusy ? 'Entering…' : 'Continue as guest'}
        </Text>
      </Pressable>

      {!emailMode && message ? <Text style={authStyles.error}>{message}</Text> : null}

      <Pressable
        unstable_pressDelay={0}
        onPress={() => router.push('/(auth)/sign-in')}
        style={({ pressed }) => [authStyles.footerBox, pressed && authStyles.pressed]}>
        <Ionicons color={palette.whiteDim} name="information-circle-outline" size={20} />
        <View style={authStyles.footerCopy}>
          <Text style={authStyles.footerTitle}>
            Have an account? <Text style={authStyles.footerLink}>Sign in</Text>
          </Text>
          <Text style={authStyles.footerSecondary}>
            Use email or social login to open your command center.
          </Text>
        </View>
      </Pressable>
    </AuthShell>
  );
}
