import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { AuthShell, authStyles } from '@/components/auth-shell';
import { pressGhost, pressSolid } from '@/components/button-press';
import { isMockData } from '@/config/app-config';
import { palette } from '@/constants/dropdex';
import { oauthRedirectHint } from '@/services/auth/oauth';
import { OAuthProvider } from '@/services/auth/types';
import { useAuth } from '@/store/auth-context';

export default function SignInScreen() {
  const { signIn, signInWithProvider, requestPasswordReset } = useAuth();
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
    <AuthShell mode="login" tagline="Monitor · Alert · Check">
      <Text style={authStyles.sectionLabel}>Recommended</Text>

      {!emailMode ? (
        <>
          <Pressable
            accessibilityLabel="Continue with email"
            accessibilityRole="button"
            unstable_pressDelay={0}
            disabled={locked}
            onPress={() => {
              setMessage(null);
              setEmailMode(true);
            }}
            dataSet={pressSolid}
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
          <Text style={authStyles.fieldLabel}>Email</Text>
          <TextInput
            accessibilityLabel="Email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            autoFocus
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@email.com"
            placeholderTextColor={palette.whiteShadow}
            returnKeyType="next"
            style={authStyles.input}
            textContentType="emailAddress"
            value={email}
          />
          <Text style={authStyles.fieldLabel}>Password</Text>
          <TextInput
            accessibilityLabel="Password"
            autoComplete="password"
            onChangeText={setPassword}
            onSubmitEditing={() => void submit()}
            placeholder="Password"
            placeholderTextColor={palette.whiteShadow}
            returnKeyType="done"
            secureTextEntry
            style={authStyles.input}
            textContentType="password"
            value={password}
          />
          {message ? <Text style={authStyles.error}>{message}</Text> : null}
          <Pressable
            accessibilityLabel="Log in"
            accessibilityRole="button"
            unstable_pressDelay={0}
            disabled={locked}
            onPress={() => void submit()}
            dataSet={pressSolid}
            style={({ pressed }) => [
              authStyles.submitBtn,
              pressed && authStyles.pressed,
              locked && authStyles.disabled,
            ]}>
            <Ionicons color={palette.controlInk} name="log-in" size={18} />
            <Text style={authStyles.submitText}>{busy ? 'Logging in…' : 'Log in'}</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Send password reset email"
            accessibilityRole="button"
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
        accessibilityLabel="Continue with Google"
        accessibilityRole="button"
        unstable_pressDelay={0}
        disabled={locked}
        onPress={() => void oauth('google')}
        dataSet={pressGhost}
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

      {!emailMode && message ? <Text style={authStyles.error}>{message}</Text> : null}
    </AuthShell>
  );
}
