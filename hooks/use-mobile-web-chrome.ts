import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useWebLayout } from '@/hooks/use-web-layout';

/** Padding above the pill plus the pill itself. Safe-area inset is added separately. */
export const MOBILE_TAB_BAR_CONTENT_HEIGHT = 6 + 64;

/**
 * Keep labels clear of the iOS home indicator.
 * Some WebViews report inset 0 briefly — use a small floor on iOS only.
 */
export function mobileWebBottomInset(insetFromHook: number) {
  const inset = Math.max(insetFromHook, 0);
  if (Platform.OS === 'ios') return Math.max(inset, 20);
  if (Platform.OS === 'android') return Math.max(inset, 10);
  if (Platform.OS === 'web') {
    const iphone =
      typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);
    return Math.max(inset, iphone ? 28 : 12);
  }
  return inset;
}

export function mobileTabBarHeight(bottomInset: number) {
  return MOBILE_TAB_BAR_CONTENT_HEIGHT + bottomInset;
}

/** Padding so scroll content clears the bottom tab bar. */
export function mobileWebScrollBottomPad(bottomInset: number) {
  return mobileTabBarHeight(bottomInset) + 16;
}

export function useMobileWebChrome() {
  const { isMobileWeb } = useWebLayout();
  const insets = useSafeAreaInsets();
  const bottomInset = isMobileWeb || Platform.OS !== 'web'
    ? mobileWebBottomInset(insets.bottom)
    : 0;
  const tabBarHeight = mobileTabBarHeight(bottomInset);
  const scrollBottomPad = mobileWebScrollBottomPad(bottomInset);

  return {
    bottomInset,
    isMobileWeb,
    scrollBottomPad,
    tabBarHeight,
  };
}
