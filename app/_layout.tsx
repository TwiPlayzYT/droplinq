import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { CookieConsentBanner } from '@/components/cookie-consent-banner';
import { DevicePromptModal } from '@/components/device-prompt-modal';
import { DropAlertModal } from '@/components/drop-alert-modal';
import { OpenProductChooser } from '@/components/open-product-chooser';
import { ProUpgradeModal } from '@/components/pro-upgrade-modal';
import { SiteTutorial } from '@/components/site-tutorial';
import { UserAppearanceSync } from '@/components/user-appearance-sync';
import { AppBootScreen, GlobalUXFeedback } from '@/components/ux-feedback';
import { WebAppShell } from '@/components/web-app-shell';
import { brand } from '@/config/app-config';
import { droplinqTokens } from '@/constants/appearance';
import { palette } from '@/constants/dropdex';
import { AppearanceProvider, useAppearance } from '@/store/appearance-context';
import { AuthProvider, hasAcceptedCurrentLegal, useAuth } from '@/store/auth-context';
import { DropDexProvider } from '@/store/dropdex-context';

export const unstable_settings = {
  anchor: '(site)',
};

/** Public Collectr-style pages. */
function isMarketingPath(pathname: string) {
  const path = (pathname || '/').split('?')[0].replace(/\/+$/, '') || '/';
  return path === '/' || path === '/pro' || path === '/help';
}

function AuthGate({ children }: { children: ReactNode }) {
  const { ready, profileReady, session, profile } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!ready || !profileReady) return;

    const root = String(segments[0] ?? '');
    const inAuth =
      root === '(auth)' ||
      root === 'auth' ||
      root === 'start' ||
      root === 'sign-in' ||
      root === 'sign-up';
    const inLegal = root === '(legal)' || root === 'legal';
    const inPublicLegal = root === 'legal';
    // Product onboarding lives under `(onboarding)`. `/notifications` is a normal
    // settings screen — do not treat it (or legacy `/setup/notifications`) as onboarding.
    const inOnboarding =
      root === '(onboarding)' ||
      (root === 'setup' && String(segments[1] ?? '') !== 'notifications');
    const inNotifications = root === 'notifications';
    const inAppEntry = root === 'app';
    const legalOk = hasAcceptedCurrentLegal(profile);
    const onMarketing = isMarketingPath(pathname);

    // Mid-onboarding users who land on marketing must finish product setup first.
    if (session && onMarketing) {
      if (!legalOk) {
        router.replace('/(legal)/accept');
        return;
      }
      if (!profile?.onboardingCompleted) {
        router.replace('/setup' as never);
        return;
      }
      // Fully set up — marketing stays browsable.
      return;
    }

    if (onMarketing) return;

    if (!session) {
      if (inAuth || inPublicLegal) return;
      // Trying to open the product without an account → signup.
      router.replace('/start' as never);
      return;
    }

    // Product routes only from here.
    if (!legalOk && !inLegal) {
      router.replace('/(legal)/accept');
      return;
    }
    if (
      legalOk &&
      !profile?.onboardingCompleted &&
      !inOnboarding &&
      !inLegal &&
      !inNotifications
    ) {
      router.replace('/setup' as never);
      return;
    }
    if (
      legalOk &&
      profile?.onboardingCompleted &&
      (inAuth ||
        inOnboarding ||
        inAppEntry ||
        (root === '(legal)' && segments[1] === 'accept') ||
        segments[1] === 'device')
    ) {
      router.replace('/home' as never);
    }
  }, [pathname, profile, profileReady, ready, router, segments, session]);

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
          <Stack.Screen name="(site)" />
          <Stack.Screen name="app/index" options={{ animation: 'none' }} />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(legal)" />
          <Stack.Screen name="legal/terms" />
          <Stack.Screen name="legal/privacy" />
          <Stack.Screen name="legal/cookies" />
          <Stack.Screen name="legal/refund" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
          <Stack.Screen name="auth/callback" options={{ animation: 'none' }} />
          <Stack.Screen name="notifications/index" options={{ animation: 'none' }} />
          <Stack.Screen name="setup/notifications" options={{ animation: 'none' }} />
          <Stack.Screen name="alerts/history" options={{ animation: 'none' }} />
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
        <ProUpgradeModal />
        <SiteTutorial />
        <DropAlertModal />
        <OpenProductChooser />
        <CookieConsentBanner />
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
        <meta
          name="description"
          content="Independent product availability alerts. Not affiliated with the retailers we monitor."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content={droplinqTokens.red} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={brand.displayName} />
        <link rel="manifest" href="/manifest.webmanifest" />
        {/* Stable favicon URLs for Google Search (no cache-bust query). Expo also emits /favicon.ico in static HTML. */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/droplinq-icon-192.png" />
        <link rel="apple-touch-icon" href="/droplinq-icon-192.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </Head>
      <SafeAreaProvider>
        <AppearanceProvider>
          <AuthProvider>
            <DropDexProvider>
              <UserAppearanceSync />
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
