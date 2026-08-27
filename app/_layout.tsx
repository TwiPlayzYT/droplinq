import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { DropAlertModal } from '@/components/drop-alert-modal';
import { OpenProductChooser } from '@/components/open-product-chooser';
import { AppBootScreen, GlobalUXFeedback } from '@/components/ux-feedback';
import { WebAppShell } from '@/components/web-app-shell';
import { brand } from '@/config/app-config';
import { palette } from '@/constants/dropdex';
import { DEVICE_PROMPT_DONE_KEY, isDevicePromptDoneMemory, subscribeDevicePromptDone } from '@/constants/preferred-device';
import { AuthProvider, hasAcceptedCurrentLegal, useAuth } from '@/store/auth-context';
import { DropDexProvider } from '@/store/dropdex-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGate({ children }: { children: ReactNode }) {
  const { ready, profileReady, session, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [devicePromptDone, setDevicePromptDone] = useState<boolean | null>(null);

  useEffect(() => subscribeDevicePromptDone(() => setDevicePromptDone(true)), []);

  useEffect(() => {
    if (!session?.user.id) {
      setDevicePromptDone(null);
      return;
    }
    if (isDevicePromptDoneMemory()) {
      setDevicePromptDone(true);
      return;
    }
    let cancelled = false;
    AsyncStorage.getItem(DEVICE_PROMPT_DONE_KEY)
      .then((value) => {
        if (!cancelled) setDevicePromptDone(value === '1' || isDevicePromptDoneMemory());
      })
      .catch(() => {
        if (!cancelled) setDevicePromptDone(isDevicePromptDoneMemory());
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user.id, segments]);

  useEffect(() => {
    if (!ready || !profileReady) return;
    if (session && devicePromptDone === null) return;

    const root = segments[0];
    const second = segments[1];
    const inAuth = root === '(auth)';
    const inLegal = root === '(legal)' || root === 'legal';
    const inDevice = root === '(legal)' && second === 'device';
    const inOnboarding = root === '(onboarding)';
    const legalOk = hasAcceptedCurrentLegal(profile);

    if (!session && !inAuth) {
      router.replace('/(auth)');
      return;
    }
    if (!session) return;

    if (!legalOk && !inLegal) {
      router.replace('/(legal)/accept');
      return;
    }

    if (legalOk && devicePromptDone === false && !inDevice) {
      router.replace('/(legal)/device');
      return;
    }

    if (
      legalOk &&
      devicePromptDone &&
      !profile?.onboardingCompleted &&
      !inOnboarding &&
      !inDevice
    ) {
      router.replace('/(onboarding)');
      return;
    }

    if (
      legalOk &&
      devicePromptDone &&
      profile?.onboardingCompleted &&
      (inAuth || inOnboarding || inDevice || (root === '(legal)' && second === 'accept'))
    ) {
      router.replace('/(tabs)');
    }
  }, [devicePromptDone, profile, profileReady, ready, router, segments, session]);

  // Hold the boot screen until profile is known so we never flash Legal → Tabs.
  if (!ready || (session && !profileReady) || (session && devicePromptDone === null)) {
    return (
      <>
        <AppBootScreen />
        <StatusBar style="light" />
      </>
    );
  }

  return <>{children}</>;
}

function AppExperience() {
  return (
    <AuthGate>
      <Stack
        screenOptions={{
          animation: 'slide_from_right',
          animationDuration: 160,
          contentStyle: { backgroundColor: palette.black },
          headerShown: false,
        }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(legal)" />
        <Stack.Screen name="legal/terms" />
        <Stack.Screen name="legal/privacy" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
        <Stack.Screen name="auth/callback" options={{ animation: 'none' }} />
        <Stack.Screen
          name="product/[id]"
          options={{
            animation: 'slide_from_right',
            animationDuration: 140,
            gestureEnabled: true,
            headerShown: false,
            presentation: 'card',
          }}
        />
      </Stack>
      <DropAlertModal />
      <OpenProductChooser />
      <GlobalUXFeedback />
      <StatusBar style="light" />
    </AuthGate>
  );
}

export default function RootLayout() {
  const navigationTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: palette.black,
      card: palette.black,
      primary: palette.red,
      text: palette.white,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Head>
        <title>{brand.name}</title>
        <meta name="description" content="Independent product availability alerts" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content={palette.red} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={brand.displayName} />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/droplinq-icon.svg" />
      </Head>
      <AuthProvider>
        <DropDexProvider>
          <ThemeProvider value={navigationTheme}>
            <WebAppShell>
              <AppExperience />
            </WebAppShell>
          </ThemeProvider>
        </DropDexProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
