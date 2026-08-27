import { AlertPreferences, Product, ProductFormat } from '@/types/dropdex';
import { defaultFilterPreferences } from '@/data/pokemon-center-filters';
import { droplinqTokens, paletteToken } from '@/constants/appearance';

/**
 * App color tokens. On web these are CSS variables so Appearance
 * (Dark / Light / DropLinq Special) can update the whole UI live.
 */
export const palette = {
  red: paletteToken('--dl-red', droplinqTokens.red),
  redDark: paletteToken('--dl-red-dark', droplinqTokens.redDark),
  redLight: paletteToken('--dl-red-light', droplinqTokens.redLight),
  black: paletteToken('--dl-bg', droplinqTokens.black),
  blackRaised: paletteToken('--dl-raised', droplinqTokens.blackRaised),
  blackSoft: paletteToken('--dl-soft', droplinqTokens.blackSoft),
  white: paletteToken('--dl-text', droplinqTokens.white),
  whiteDim: paletteToken('--dl-text-dim', droplinqTokens.whiteDim),
  whiteShadow: paletteToken('--dl-text-shadow', droplinqTokens.whiteShadow),
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
