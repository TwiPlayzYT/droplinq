import { PropsWithChildren, useEffect } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { palette } from '@/constants/dropdex';

const WEB_SMOOTH_CSS = `
html, body, #root {
  height: 100%;
  margin: 0;
  background: #000;
  overscroll-behavior: none;
}
* {
  -webkit-tap-highlight-color: transparent;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
body {
  overflow: hidden;
}
[data-focusable="true"], button, a, [role="button"] {
  transition: opacity 120ms ease, background-color 120ms ease, border-color 120ms ease;
}
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 8px;
}
::-webkit-scrollbar-track { background: transparent; }
`;

/**
 * Web root shell only. Native iOS/Android pass children through unchanged.
 * Full-bleed site canvas (Collectr-style), not a phone frame.
 */
export function WebAppShell({ children }: PropsWithChildren) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const existing = document.getElementById('droplinq-smooth-css');
    if (existing) return;
    const style = document.createElement('style');
    style.id = 'droplinq-smooth-css';
    style.textContent = WEB_SMOOTH_CSS;
    document.head.appendChild(style);
  }, []);

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
