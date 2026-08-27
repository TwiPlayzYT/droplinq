import { Redirect } from 'expo-router';

/** Legacy route — device choice is now an immediate site-open popup. */
export default function DevicePromptRedirect() {
  return <Redirect href="/(tabs)" />;
}
