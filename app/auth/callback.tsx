import { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';

import { palette } from '@/constants/dropdex';
import { getSupabase } from '@/services/supabase/client';

/**
 * OAuth / email-confirm landing. On web this reads window.location so Google
 * PKCE codes in ?code= (and hash tokens) become a session.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const finish = async (url: string | null) => {
      const supabase = getSupabase();
      if (!supabase) {
        router.replace('/start' as never);
        return;
      }

      const { data: existing } = await supabase.auth.getSession();
      if (existing.session) {
        if (active) router.replace('/(onboarding)');
        return;
      }

      if (!url || !active) {
        router.replace('/start' as never);
        return;
      }

      const { params, errorCode } = QueryParams.getQueryParams(url);
      if (errorCode) {
        router.replace('/start' as never);
        return;
      }

      if (params.code) {
        const { error } = await supabase.auth.exchangeCodeForSession(params.code);
        if (error) {
          router.replace('/start' as never);
          return;
        }
      } else if (params.access_token && params.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (error) {
          router.replace('/start' as never);
          return;
        }
      }

      if (active) router.replace('/(onboarding)');
    };

    const href =
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.location.href
        : null;

    if (href) {
      void finish(href);
      return () => {
        active = false;
      };
    }

    Linking.getInitialURL().then(finish);
    const sub = Linking.addEventListener('url', ({ url }) => {
      void finish(url);
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, [router]);

  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={palette.red} />
      <Text style={styles.text}>Finishing sign-in…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    backgroundColor: palette.black,
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
  text: { color: palette.whiteShadow, fontWeight: '700' },
});
