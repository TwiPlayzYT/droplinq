import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useWebLayout } from '@/hooks/use-web-layout';

/** Air above the pill, then the pill. Keep in step with the floating tab bar. */
export const TAB_PILL_LIFT = 8;
export const TAB_PILL_HEIGHT = 64;
export const MOBILE_TAB_BAR_CONTENT_HEIGHT = TAB_PILL_LIFT + TAB_PILL_HEIGHT;

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
    return Math.max(inset, iphone ? 34 : 12);
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
  // Web floats the bar over the page, so the scroll content has to clear it.
  // Native keeps the bar in the layout, so the page only needs a little air.
  const scrollBottomPad = Platform.OS === 'web' && isMobileWeb
    ? mobileWebScrollBottomPad(bottomInset)
    : 20;

  return {
    bottomInset,
    isMobileWeb,
    scrollBottomPad,
    tabBarHeight,
  };
}
