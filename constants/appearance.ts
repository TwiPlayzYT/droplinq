import { Platform } from 'react-native';

export type AppearanceId = 'dark' | 'light' | 'droplinq';

export type AppearanceTokens = {
  red: string;
  redDark: string;
  redLight: string;
  black: string;
  blackRaised: string;
  blackSoft: string;
  white: string;
  whiteDim: string;
  whiteShadow: string;
};

export const APPEARANCE_STORAGE_KEY = 'droplinq.appearance.v1';

/** DropLinq Special — current brand look. */
export const droplinqTokens: AppearanceTokens = {
  red: '#D20D1E',
  redDark: '#7D0610',
  redLight: '#FF2638',
  black: '#090909',
  blackRaised: '#1B1B1B',
  blackSoft: '#303030',
  white: '#F7F5F2',
  whiteDim: '#D8D5D0',
  whiteShadow: '#A9A6A2',
};

export const darkTokens: AppearanceTokens = {
  red: '#FF3B4A',
  redDark: '#9B1020',
  redLight: '#FF6B76',
  black: '#0C0C0E',
  blackRaised: '#17171A',
  blackSoft: '#2A2A2E',
  white: '#F4F4F5',
  whiteDim: '#C8C8CC',
  whiteShadow: '#8E8E93',
};

export const lightTokens: AppearanceTokens = {
  red: '#D20D1E',
  redDark: '#7D0610',
  redLight: '#FF2638',
  black: '#F4F2EE',
  blackRaised: '#FFFFFF',
  blackSoft: '#E4E0D8',
  white: '#121212',
  whiteDim: '#3A3A3A',
  whiteShadow: '#6F6B66',
};

export const APPEARANCES: Record<
  AppearanceId,
  {
    id: AppearanceId;
    label: string;
    tokens: AppearanceTokens;
    /** Swatch colors shown in the Appearance picker. */
    preview: [string, string, string];
  }
> = {
  dark: {
    id: 'dark',
    label: 'Dark',
    tokens: darkTokens,
    preview: ['#0C0C0E', '#17171A', '#FF3B4A'],
  },
  light: {
    id: 'light',
    label: 'Light',
    tokens: lightTokens,
    preview: ['#F4F2EE', '#FFFFFF', '#D20D1E'],
  },
  droplinq: {
    id: 'droplinq',
    label: 'DropLinq Special',
    tokens: droplinqTokens,
    preview: ['#090909', '#D20D1E', '#F7F5F2'],
  },
};

export const APPEARANCE_ORDER: AppearanceId[] = ['dark', 'light', 'droplinq'];

const CSS_VARS: Record<keyof AppearanceTokens, string> = {
  red: '--dl-red',
  redDark: '--dl-red-dark',
  redLight: '--dl-red-light',
  black: '--dl-bg',
  blackRaised: '--dl-raised',
  blackSoft: '--dl-soft',
  white: '--dl-text',
  whiteDim: '--dl-text-dim',
  whiteShadow: '--dl-text-shadow',
};

export function applyAppearanceCss(tokens: AppearanceTokens, appearanceId: AppearanceId) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const root = document.documentElement;
  (Object.keys(CSS_VARS) as (keyof AppearanceTokens)[]).forEach((key) => {
    root.style.setProperty(CSS_VARS[key], tokens[key]);
  });
  root.setAttribute('data-appearance', appearanceId);
  root.style.colorScheme = appearanceId === 'light' ? 'light' : 'dark';
}

/** Web: CSS variables so StyleSheet colors update live. Native: hex fallbacks. */
export function paletteToken(cssVar: string, fallback: string): string {
  if (Platform.OS === 'web') {
    return `var(${cssVar}, ${fallback})`;
  }
  return fallback;
}
