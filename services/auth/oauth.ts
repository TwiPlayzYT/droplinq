import * as AppleAuthentication from 'expo-apple-authentication';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { AuthResult } from '@/services/auth/types';
import { getSupabase } from '@/services/supabase/client';

WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'apple';

const IP_HOST = /^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?$/;

function looksLikeIpHost(hostUri: string) {
  const host = hostUri.split('/')[0] ?? hostUri;
  return IP_HOST.test(host);
}

/**
 * Supabase rejects redirect URLs that contain raw LAN IPs ("requested path is invalid").
 * Expo Go on Wi‑Fi normally uses exp://192.168.x.x:8081 — that breaks Google OAuth.
 * Use `npm run start:tunnel` so the host is *.exp.direct instead of an IP.
 */
export function redirectUri() {
  if (Constants.appOwnership === 'expo') {
    const hostUri =
      Constants.expoConfig?.hostUri ??
      Constants.manifest2?.extra?.expoClient?.hostUri ??
      (Constants.manifest as { debuggerHost?: string } | null)?.debuggerHost;

    if (hostUri && !looksLikeIpHost(hostUri)) {
      return `exp://${hostUri.replace(/\/$/, '')}/--/auth/callback`;
    }

    // LAN IP mode — do not send this to Supabase (it will 400).
    // Prefer the app scheme; Expo Go still may not complete OAuth until tunnel/dev build.
    return 'droplinq://auth/callback';
  }

  return Linking.createURL('auth/callback');
}

export function oauthNeedsTunnel(): boolean {
  if (Constants.appOwnership !== 'expo') return false;
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.manifest2?.extra?.expoClient?.hostUri ??
    (Constants.manifest as { debuggerHost?: string } | null)?.debuggerHost;
  return !hostUri || looksLikeIpHost(hostUri);
}

async function createSessionFromUrl(url: string): Promise<AuthResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: 'Supabase is not configured.' };

  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) return { ok: false, message: String(errorCode) };

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  }

  const access_token = params.access_token;
  const refresh_token = params.refresh_token;
  if (!access_token || !refresh_token) {
    return { ok: false, message: 'Sign-in was cancelled or incomplete.' };
  }

  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

async function signInWithOAuthBrowser(provider: OAuthProvider): Promise<AuthResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: 'Supabase is not configured.' };

  if (oauthNeedsTunnel()) {
    return {
      ok: false,
      message:
        'Google on Expo Go needs tunnel mode (Supabase blocks Wi‑Fi IP redirects).\n\nOn your Mac run:\nnpm run start:tunnel\n\nOr use email + password below — that works now.',
    };
  }

  const redirectTo = redirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    return {
      ok: false,
      message: `${error.message}\n\nAdd this Redirect URL in Supabase:\n${redirectTo}`,
    };
  }
  if (!data.url) return { ok: false, message: 'Could not start provider sign-in.' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === 'success' && result.url) {
    return createSessionFromUrl(result.url);
  }

  return {
    ok: false,
    message:
      'Google didn’t return to the app. Use email sign-up for now, or run npm run start:tunnel and try Google again.',
  };
}

async function signInWithAppleNative(): Promise<AuthResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: 'Supabase is not configured.' };

  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    return signInWithOAuthBrowser('apple');
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return { ok: false, message: 'Apple did not return an identity token.' };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'ERR_REQUEST_CANCELED') {
      return { ok: false, message: 'Sign-in cancelled.' };
    }
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Apple sign-in failed.',
    };
  }
}

export async function signInWithProvider(provider: OAuthProvider): Promise<AuthResult> {
  if (provider === 'apple' && Platform.OS === 'ios') {
    return signInWithAppleNative();
  }
  return signInWithOAuthBrowser(provider);
}

export function oauthRedirectHint() {
  return redirectUri();
}
