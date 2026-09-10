import { Stack } from 'expo-router';

import { palette } from '@/constants/dropdex';

export default function SiteLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: palette.black },
        headerShown: false,
      }}
    />
  );
}
