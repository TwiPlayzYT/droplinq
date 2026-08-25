import { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { palette } from '@/constants/dropdex';

/**
 * Web root shell only. Native iOS/Android pass children through unchanged.
 * Full-bleed site canvas (Collectr-style), not a phone frame.
 */
export function WebAppShell({ children }: PropsWithChildren) {
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View accessibilityLabel="DropLinq web app" style={styles.root}>
      {children}
    </View>
  );
}

const rootWeb: ViewStyle = {
  backgroundColor: palette.black,
  flex: 1,
  width: '100%',
  minHeight: '100vh' as unknown as number,
};

const styles = StyleSheet.create({
  root: Platform.OS === 'web' ? rootWeb : { flex: 1 },
});
