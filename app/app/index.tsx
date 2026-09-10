import { Redirect } from 'expo-router';

import { AppBootScreen } from '@/components/ux-feedback';
import { useAuth } from '@/store/auth-context';

/** Product entry (Collectr’s app.* equivalent). */
export default function AppEntry() {
  const { ready, profileReady, session } = useAuth();

  if (!ready || (session && !profileReady)) {
    return <AppBootScreen />;
  }

  if (!session) {
    return <Redirect href={'/start' as never} />;
  }

  return <Redirect href="/(tabs)" />;
}
