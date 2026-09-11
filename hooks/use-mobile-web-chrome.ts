import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useWebLayout } from '@/hooks/use-web-layout';

/** Icon row + label inside the bottom tab bar (excluding home-indicator inset). */
export const MOBILE_TAB_BAR_CONTENT_HEIGHT = 56;

/** Use real safe-area only — no artificial 34px floor (that left a black gap). */
export function mobileWebBottomInset(insetFromHook: number) {
  if (Platform.OS !== 'web') return Math.max(insetFromHook, 0);
  return Math.max(insetFromHook, 0);
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
  const bottomInset = isMobileWeb ? mobileWebBottomInset(insets.bottom) : insets.bottom;
  const tabBarHeight = mobileTabBarHeight(bottomInset);
  const scrollBottomPad = mobileWebScrollBottomPad(bottomInset);

  return {
    bottomInset,
    isMobileWeb,
    scrollBottomPad,
    tabBarHeight,
  };
}
