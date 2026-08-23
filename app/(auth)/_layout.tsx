import { Stack } from 'expo-router';

import { palette } from '@/constants/dropdex';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.black },
      }}
    />
  );
}
