import { Redirect } from 'expo-router';

/** Legacy path — prefer `/notifications`. */
export default function LegacyNotificationSetupRedirect() {
  return <Redirect href={'/notifications' as never} />;
}
