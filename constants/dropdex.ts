import { AlertPreferences, Product, ProductFormat } from '@/types/dropdex';
import { defaultFilterPreferences } from '@/data/pokemon-center-filters';

export const palette = {
  red: '#D20D1E',
  redDark: '#7D0610',
  redLight: '#FF2638',
  black: '#090909',
  blackRaised: '#1B1B1B',
  blackSoft: '#303030',
  white: '#F7F5F2',
  whiteDim: '#D8D5D0',
  whiteShadow: '#A9A6A2',
} as const;

/** @deprecated Prefer Filter tab coverage modes */
export const productFormats: { id: ProductFormat; label: string; shortLabel: string }[] = [
  { id: 'etb', label: 'Elite Trainer Boxes', shortLabel: 'ETB' },
  { id: 'booster-bundle', label: 'Booster Bundles', shortLabel: 'Bundle' },
  { id: 'booster-box', label: 'Booster Boxes', shortLabel: 'Box' },
  { id: 'upc', label: 'Ultra-Premium Collections', shortLabel: 'UPC' },
];

export const defaultFilters = defaultFilterPreferences;

export const defaultAlertPreferences: AlertPreferences = {
  push: true,
  sound: true,
  vibration: true,
  speech: false,
  fullScreen: true,
  dropMode: false,
};

/** Used only by the Home/Alerts Test button — never treated as a real drop. */
export const testAlertProduct: Product = {
  id: 'droplinq-test-alert',
  title: 'DropLinq Test Alert',
  category: 'Trading Card Game',
  format: 'etb',
  releaseType: 'new',
  url: 'https://www.pokemoncenter.com/en-ca/category/trading-card-game',
  detectedAt: new Date().toISOString(),
  tags: ['test'],
};

export const previewSamples: Product[] = [
  {
    id: 'preview-etb',
    title: 'Sample Elite Trainer Box',
    category: 'Trading Card Game',
    format: 'etb',
    releaseType: 'new',
    url: 'https://www.pokemoncenter.com/en-ca/category/trading-card-game',
    detectedAt: new Date().toISOString(),
    tags: ['preview', 'etb'],
  },
  {
    id: 'preview-bundle',
    title: 'Sample Booster Bundle',
    category: 'Trading Card Game',
    format: 'booster-bundle',
    releaseType: 'restock',
    url: 'https://www.pokemoncenter.com/en-ca/category/trading-card-game',
    detectedAt: new Date().toISOString(),
    tags: ['preview', 'booster-bundle'],
  },
  {
    id: 'preview-box',
    title: 'Sample Booster Box',
    category: 'Trading Card Game',
    format: 'booster-box',
    releaseType: 'new',
    url: 'https://www.pokemoncenter.com/en-ca/category/trading-card-game',
    detectedAt: new Date().toISOString(),
    tags: ['preview', 'booster-box'],
  },
  {
    id: 'preview-upc',
    title: 'Sample Ultra-Premium Collection',
    category: 'Trading Card Game',
    format: 'upc',
    releaseType: 'preorder',
    url: 'https://www.pokemoncenter.com/en-ca/category/trading-card-game',
    detectedAt: new Date().toISOString(),
    tags: ['preview', 'upc'],
  },
];
