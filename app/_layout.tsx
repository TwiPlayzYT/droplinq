import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { DevicePromptModal } from '@/components/device-prompt-modal';
import { DropAlertModal } from '@/components/drop-alert-modal';
import { OpenProductChooser } from '@/components/open-product-chooser';
import { AppBootScreen, GlobalUXFeedback } from '@/components/ux-feedback';
import { WebAppShell } from '@/components/web-app-shell';
import { brand } from '@/config/app-config';
import { droplinqTokens } from '@/constants/appearance';
import { palette } from '@/constants/dropdex';
import { AppearanceProvider, useAppearance } from '@/store/appearance-context';
import { AuthProvider, hasAcceptedCurrentLegal, useAuth } from '@/store/auth-context';
import { DropDexProvider } from '@/store/dropdex-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGate({ children }: { children: ReactNode }) {
  const { ready, profileReady, session, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready || !profileReady) return;
    const root = segments[0];
    const inAuth = root === '(auth)';
    const inLegal = root === '(legal)' || root === 'legal';
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
    if (legalOk && !profile?.onboardingCompleted && !inOnboarding && !inLegal) {
      router.replace('/(onboarding)');
      return;
    }
    if (
      legalOk &&
      profile?.onboardingCompleted &&
      (inAuth || inOnboarding || (root === '(legal)' && segments[1] === 'accept') || segments[1] === 'device')
    ) {
      router.replace('/(tabs)');
    }
  }, [profile, profileReady, ready, router, segments, session]);

  if (!ready || (session && !profileReady)) {
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
  const stackAnimation = Platform.OS === 'web' ? 'none' : 'slide_from_right';
  const { appearanceId, tokens } = useAppearance();

  const navigationTheme = useMemo(() => {
    const base = appearanceId === 'light' ? DefaultTheme : DarkTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: tokens.bg,
        card: tokens.raised,
        primary: tokens.red,
        text: tokens.text,
        border: tokens.soft,
      },
    };
  }, [appearanceId, tokens]);

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <AuthGate>
        <Stack
          screenOptions={{
            animation: stackAnimation,
            animationDuration: Platform.OS === 'web' ? 0 : 160,
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
              animation: stackAnimation,
              animationDuration: Platform.OS === 'web' ? 0 : 140,
              gestureEnabled: Platform.OS !== 'web',
              headerShown: false,
              presentation: 'card',
            }}
          />
        </Stack>
        <DevicePromptModal />
        <DropAlertModal />
        <OpenProductChooser />
        <GlobalUXFeedback />
        <StatusBar style={appearanceId === 'light' ? 'dark' : 'light'} />
      </AuthGate>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView
      style={{
        flex: 1,
        ...(Platform.OS === 'web'
          ? ({ flex: 1, height: '100%', maxHeight: '100%', overflow: 'hidden' } as object)
          : null),
      }}>
      <Head>
        <title>{brand.name}</title>
        <meta name="description" content="Independent product availability alerts" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content={droplinqTokens.red} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={brand.displayName} />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/droplinq-icon.svg" />
      </Head>
      <SafeAreaProvider>
        <AppearanceProvider>
          <AuthProvider>
            <DropDexProvider>
              <WebAppShell>
                <AppExperience />
              </WebAppShell>
            </DropDexProvider>
          </AuthProvider>
        </AppearanceProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
