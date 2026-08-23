import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';

import { palette } from '@/constants/dropdex';
import { getSupabase } from '@/services/supabase/client';
import * as QueryParams from 'expo-auth-session/build/QueryParams';

/**
 * Deep-link landing for OAuth returns (Expo Go exp://…/--/auth/callback).
 */
export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const finish = async (url: string | null) => {
      if (!url || !active) return;
      const supabase = getSupabase();
      if (!supabase) {
        router.replace('/(auth)');
        return;
      }

      const { params, errorCode } = QueryParams.getQueryParams(url);
      if (errorCode) {
        router.replace('/(auth)');
        return;
      }

      if (params.code) {
        await supabase.auth.exchangeCodeForSession(params.code);
      } else if (params.access_token && params.refresh_token) {
        await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
      }

      router.replace('/(onboarding)');
    };

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
