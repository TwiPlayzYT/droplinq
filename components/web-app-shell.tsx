import { PropsWithChildren, useEffect } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { palette } from '@/constants/dropdex';

const WEB_SMOOTH_CSS = `
:root {
  --dl-red: #D20D1E;
  --dl-red-dark: #7D0610;
  --dl-red-light: #FF2638;
  --dl-bg: #090909;
  --dl-raised: #1B1B1B;
  --dl-soft: #303030;
  --dl-text: #F7F5F2;
  --dl-text-dim: #D8D5D0;
  --dl-text-muted: #A9A6A2;
  --dl-card: #1B1B1B;
  --dl-card-ink: #F7F5F2;
  --dl-card-muted: #A9A6A2;
  --dl-card-border: #2C2C2C;
  --dl-control: #242424;
  --dl-control-ink: #F7F5F2;
  --dl-on-raised: #F7F5F2;
  --dl-on-raised-dim: #D8D5D0;
  color-scheme: dark;
}
html, body {
  height: 100%;
  margin: 0;
  background: var(--dl-bg, #090909);
  overscroll-behavior: none;
  overflow: hidden;
}
/* Pin the app to the visual viewport so iOS Safari never crops the bottom tab bar. */
html, body, #root {
  width: 100%;
  max-width: 100%;
}
#root {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  height: 100dvh;
  height: 100svh;
  max-height: 100dvh;
  max-height: 100svh;
  overflow: hidden;
  background: var(--dl-bg, #090909);
}
* {
  -webkit-tap-highlight-color: transparent;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
[data-focusable="true"], button, a, [role="button"] {
  transition: opacity 120ms ease, background-color 120ms ease, border-color 120ms ease;
}
[data-focusable="true"]:focus, button:focus, a:focus, [role="button"]:focus, input:focus, textarea:focus, select:focus {
  outline: none;
}
[data-focusable="true"]:focus-visible, button:focus-visible, a:focus-visible, [role="button"]:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible, [role="checkbox"]:focus-visible, [role="switch"]:focus-visible, [role="radio"]:focus-visible, [role="link"]:focus-visible {
  outline: 2px solid var(--dl-red-light, #FF2638);
  outline-offset: 3px;
}
.dl-skip-link {
  background: var(--dl-control, #242424);
  border-radius: 10px;
  color: var(--dl-control-ink, #F7F5F2);
  font: 700 14px/1.2 system-ui, sans-serif;
  left: 12px;
  padding: 10px 14px;
  position: absolute;
  text-decoration: none;
  top: -80px;
  z-index: 1000;
}
.dl-skip-link:focus {
  top: 12px;
}
@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
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
    if (existing) {
      existing.textContent = WEB_SMOOTH_CSS;
      return;
    }
    const style = document.createElement('style');
    style.id = 'droplinq-smooth-css';
    style.textContent = WEB_SMOOTH_CSS;
    document.head.appendChild(style);

    if (!document.getElementById('droplinq-skip-link')) {
      const skip = document.createElement('a');
      skip.id = 'droplinq-skip-link';
      skip.className = 'dl-skip-link';
      skip.href = '#main-content';
      skip.textContent = 'Skip to main content';
      document.body.prepend(skip);
    }
  }, []);

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View
      accessibilityLabel="DropLinq web app"
      nativeID="main-content"
      style={styles.root}>
      {children}
    </View>
  );
}

const rootWeb: ViewStyle = {
  backgroundColor: palette.black,
  flex: 1,
  height: '100%' as unknown as number,
  maxHeight: '100%' as unknown as number,
  overflow: 'hidden',
  width: '100%',
};

const styles = StyleSheet.create({
  root: Platform.OS === 'web' ? rootWeb : { flex: 1 },
});
