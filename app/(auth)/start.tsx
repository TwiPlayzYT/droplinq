import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { AuthShell, authStyles } from '@/components/auth-shell';
import { ConsentCheckbox } from '@/components/consent-checkbox';
import { palette } from '@/constants/dropdex';
import { authAdapter } from '@/services/auth';
import { oauthRedirectHint } from '@/services/auth/oauth';
import { OAuthProvider } from '@/services/auth/types';
import { postAuthPath, useAuth } from '@/store/auth-context';

export default function SignUpScreen() {
  const { signUp, signInWithProvider, signInAsGuest, acceptLegal } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<OAuthProvider | null>(null);
  const [guestBusy, setGuestBusy] = useState(false);
  const [emailMode, setEmailMode] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const requireConsent = () => {
    if (agreed) return true;
    setMessage('Please agree to the Terms, Privacy, Cookie, and Refund policies to continue.');
    return false;
  };

  /** After start-page consent: accept legal and go to setup/home — never marketing. */
  const finishStartAuth = async () => {
    const legal = await acceptLegal();
    if (!legal.ok) {
      setMessage(legal.message);
      router.replace('/(legal)/accept' as never);
      return;
    }
    const { session: next } = await authAdapter.getSession();
    const nextProfile = next?.user.id ? await authAdapter.loadProfile(next.user.id) : null;
    router.replace(postAuthPath(nextProfile) as never);
  };

  const submit = async () => {
    if (!requireConsent()) return;
    setBusy(true);
    setMessage(null);
    const result = await signUp(email.trim(), password);
    if (!result.ok) {
      setBusy(false);
      setMessage(result.message);
      return;
    }
    if (result.pendingEmailConfirm) {
      setBusy(false);
      setMessage('Check your email to confirm this account, then sign in. Your profile will be waiting.');
      return;
    }
    await finishStartAuth();
    setBusy(false);
  };

  const oauth = async (provider: OAuthProvider) => {
    if (!requireConsent()) return;
    setOauthBusy(provider);
    setMessage(null);
    const result = await signInWithProvider(provider);
    setOauthBusy(null);
    if (!result.ok && result.message !== 'Sign-in cancelled.') {
      setMessage(`${result.message}\n\nRedirect used:\n${oauthRedirectHint()}`);
      return;
    }
    if (result.ok) {
      await finishStartAuth();
    }
  };

  const enterGuest = async () => {
    if (!requireConsent()) return;
    setGuestBusy(true);
    setMessage(null);
    const result = await signInAsGuest({ freshSetup: true });
    if (!result.ok) {
      setGuestBusy(false);
      setMessage(result.message);
      return;
    }
    const legal = await acceptLegal();
    setGuestBusy(false);
    if (!legal.ok) {
      setMessage(legal.message);
      router.replace('/(legal)/accept' as never);
      return;
    }
    // Fresh guests always land in setup — never marketing `/`.
    router.replace('/setup' as never);
  };

  const locked = busy || !!oauthBusy || guestBusy;

  return (
    <AuthShell tagline="Monitor · Alert · Check">
      <Pressable
        accessibilityLabel="Back to DropLinq marketing site"
        onPress={() => router.push('/' as never)}
        style={{ marginBottom: 14 }}>
        <Text style={{ color: palette.whiteShadow, fontSize: 13, fontWeight: '700' }}>
          ← Back to DropLinq
        </Text>
      </Pressable>
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
            accessibilityLabel="Password, 8 or more characters"
            autoComplete="new-password"
            onChangeText={setPassword}
            onSubmitEditing={() => void submit()}
            placeholder="8 or more characters"
            placeholderTextColor={palette.whiteShadow}
            returnKeyType="done"
            secureTextEntry
            style={authStyles.input}
            textContentType="newPassword"
            value={password}
          />
          {message ? <Text style={authStyles.error}>{message}</Text> : null}
          <Pressable
            accessibilityLabel="Create account"
            accessibilityRole="button"
            unstable_pressDelay={0}
            disabled={locked}
            onPress={() => void submit()}
            style={({ pressed }) => [
              authStyles.submitBtn,
              pressed && authStyles.pressed,
              locked && authStyles.disabled,
            ]}>
            <Ionicons color={palette.controlInk} name="person-add" size={18} />
            <Text style={authStyles.submitText}>{busy ? 'Creating account…' : 'Create account'}</Text>
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
        accessibilityLabel="Continue as guest"
        accessibilityRole="button"
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

      <ConsentCheckbox
        checked={agreed}
        label="Agree to Terms, Privacy, Cookie, and Refund policies"
        onChange={(value) => {
          setAgreed(value);
          if (value) setMessage(null);
        }}>
        I agree to the Terms of Service, Privacy Policy, Cookie Policy, and Refund Policy. DropLinq
        only collects the account details needed to run alerts.
      </ConsentCheckbox>

      {!emailMode && message ? <Text style={authStyles.error}>{message}</Text> : null}

      <Pressable
        accessibilityLabel="Go to sign in"
        accessibilityRole="button"
        unstable_pressDelay={0}
        onPress={() => router.push('/sign-in' as never)}
        style={({ pressed }) => [authStyles.footerBox, pressed && authStyles.pressed]}>
        <Ionicons color={palette.whiteDim} name="information-circle-outline" size={20} />
        <View style={authStyles.footerCopy}>
          <Text style={authStyles.footerTitle}>
            Have an account? <Text style={authStyles.footerLink}>Sign in</Text>
          </Text>
          <Text style={authStyles.footerSecondary}>
            Use email or Google to open your command center.
          </Text>
        </View>
      </Pressable>
    </AuthShell>
  );
}
