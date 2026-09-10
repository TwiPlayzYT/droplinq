import { Redirect } from 'expo-router';

import { AppBootScreen } from '@/components/ux-feedback';
import { hasAcceptedCurrentLegal, useAuth } from '@/store/auth-context';

/** Product entry (Collectr’s app.* equivalent). */
export default function AppEntry() {
  const { ready, profileReady, session, profile } = useAuth();

  if (!ready || (session && !profileReady)) {
    return <AppBootScreen />;
  }

  if (!session) {
    return <Redirect href={'/start' as never} />;
  }

  if (!hasAcceptedCurrentLegal(profile)) {
    return <Redirect href={'/(legal)/accept' as never} />;
  }

  if (!profile?.onboardingCompleted) {
    return <Redirect href={'/setup' as never} />;
  }

  return <Redirect href={'/home' as never} />;
}
