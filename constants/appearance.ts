import { Platform } from 'react-native';

export type AppearanceId = 'dark' | 'light' | 'droplinq';

/**
 * Semantic tokens. Page chrome (bg/text) and card surfaces (card/cardInk)
 * stay in the same family: Dark/DropLinq cards are raised dark panels,
 * Light cards are white. Never put cream cards on a dark page.
 */
export type AppearanceTokens = {
  red: string;
  redDark: string;
  redLight: string;
  /** Page / shell background */
  bg: string;
  /** Nav, tab bar, raised chrome */
  raised: string;
  /** Borders on chrome */
  soft: string;
  /** Primary text on page/chrome */
  text: string;
  textDim: string;
  textMuted: string;
  /** Default bubble / light panel fill */
  card: string;
  /** Text on card bubbles */
  cardInk: string;
  cardMuted: string;
  cardBorder: string;
  /** Metal controls sitting on cards */
  control: string;
  controlInk: string;
  /** Text meant for dark/raised panels (adapts in light theme) */
  onRaised: string;
  onRaisedDim: string;
};

export const APPEARANCE_STORAGE_KEY = 'droplinq.appearance.v1';

export const droplinqTokens: AppearanceTokens = {
  red: '#D20D1E',
  redDark: '#7D0610',
  redLight: '#FF2638',
  bg: '#090909',
  raised: '#141414',
  soft: '#2C2C2C',
  text: '#F7F5F2',
  textDim: '#D8D5D0',
  textMuted: '#A9A6A2',
  card: '#1B1B1B',
  cardInk: '#F7F5F2',
  cardMuted: '#A9A6A2',
  cardBorder: '#2C2C2C',
  control: '#242424',
  controlInk: '#F7F5F2',
  onRaised: '#F7F5F2',
  onRaisedDim: '#D8D5D0',
};

export const darkTokens: AppearanceTokens = {
  red: '#FF3B4A',
  redDark: '#9B1020',
  redLight: '#FF6B76',
  bg: '#0C0C0E',
  raised: '#17171A',
  soft: '#2A2A2E',
  text: '#F4F4F5',
  textDim: '#C8C8CC',
  textMuted: '#A8A8AE',
  card: '#1C1C22',
  cardInk: '#F4F4F5',
  cardMuted: '#A8A8AE',
  cardBorder: '#2E2E36',
  control: '#26262C',
  controlInk: '#F4F4F5',
  onRaised: '#F4F4F5',
  onRaisedDim: '#C8C8CC',
};

export const lightTokens: AppearanceTokens = {
  red: '#D20D1E',
  redDark: '#7D0610',
  redLight: '#FF2638',
  bg: '#F4F2EE',
  raised: '#FFFFFF',
  soft: '#E4E0D8',
  text: '#121212',
  textDim: '#3A3A3A',
  textMuted: '#6F6B66',
  card: '#FFFFFF',
  cardInk: '#121212',
  cardMuted: '#6F6B66',
  cardBorder: '#E4E0D8',
  control: '#FFFFFF',
  controlInk: '#121212',
  onRaised: '#121212',
  onRaisedDim: '#6F6B66',
};

export const APPEARANCES: Record<
  AppearanceId,
  {
    id: AppearanceId;
    label: string;
    tokens: AppearanceTokens;
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
    preview: ['#090909', '#1B1B1B', '#D20D1E'],
  },
};

export const APPEARANCE_ORDER: AppearanceId[] = ['dark', 'light', 'droplinq'];

const CSS_VARS: Record<keyof AppearanceTokens, string> = {
  red: '--dl-red',
  redDark: '--dl-red-dark',
  redLight: '--dl-red-light',
  bg: '--dl-bg',
  raised: '--dl-raised',
  soft: '--dl-soft',
  text: '--dl-text',
  textDim: '--dl-text-dim',
  textMuted: '--dl-text-muted',
  card: '--dl-card',
  cardInk: '--dl-card-ink',
  cardMuted: '--dl-card-muted',
  cardBorder: '--dl-card-border',
  control: '--dl-control',
  controlInk: '--dl-control-ink',
  onRaised: '--dl-on-raised',
  onRaisedDim: '--dl-on-raised-dim',
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

export function paletteToken(cssVar: string, fallback: string): string {
  if (Platform.OS === 'web') {
    return `var(${cssVar}, ${fallback})`;
  }
  return fallback;
}
