import { useWindowDimensions } from 'react-native';
import { Platform } from 'react-native';

/** Breakpoint where DropLinq web switches from phone chrome → full desktop site. */
export const WEB_DESKTOP_MIN = 900;

export function useWebLayout() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktopWeb = isWeb && width >= WEB_DESKTOP_MIN;
  const isMobileWeb = isWeb && width < WEB_DESKTOP_MIN;

  return {
    isWeb,
    isDesktopWeb,
    isMobileWeb,
    width,
    /** Catalog / region card columns on web desktop */
    contentColumns: !isDesktopWeb ? 1 : width >= 1280 ? 3 : 2,
  };
}
