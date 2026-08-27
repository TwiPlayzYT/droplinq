import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { AuthShell, authStyles } from '@/components/auth-shell';
import { isMockData } from '@/config/app-config';
import { palette } from '@/constants/dropdex';
import { oauthRedirectHint } from '@/services/auth/oauth';
import { OAuthProvider } from '@/services/auth/types';
import { useAuth } from '@/store/auth-context';

export default function SignInScreen() {
  const { signIn, signInWithProvider, requestPasswordReset } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<OAuthProvider | null>(null);
  const [emailMode, setEmailMode] = useState(false);

  const submit = async () => {
    setBusy(true);
    setMessage(null);
    const result = await signIn(email.trim(), password);
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

  const locked = busy || !!oauthBusy;

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
            placeholder="Password"
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
            <Ionicons color={palette.controlInk} name="log-in" size={18} />
            <Text style={authStyles.submitText}>{busy ? 'Signing in…' : 'Sign in'}</Text>
          </Pressable>
          <Pressable
            unstable_pressDelay={0}
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
            <Text style={authStyles.linkMuted}>Forgot password?</Text>
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

      {!emailMode && message ? <Text style={authStyles.error}>{message}</Text> : null}

      <Pressable
        unstable_pressDelay={0}
        onPress={() => router.replace('/(auth)')}
        style={({ pressed }) => [authStyles.footerBox, pressed && authStyles.pressed]}>
        <Ionicons color={palette.whiteDim} name="information-circle-outline" size={20} />
        <View style={authStyles.footerCopy}>
          <Text style={authStyles.footerTitle}>
            Need an account? <Text style={authStyles.footerLink}>Sign up</Text>
          </Text>
          <Text style={authStyles.footerSecondary}>Create your DropLinq monitoring account.</Text>
        </View>
      </Pressable>
    </AuthShell>
  );
}
