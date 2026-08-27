import { AlertPreferences, Product, ProductFormat } from '@/types/dropdex';
import { defaultFilterPreferences } from '@/data/pokemon-center-filters';
import { droplinqTokens, paletteToken } from '@/constants/appearance';

/**
 * App color tokens. On web these are CSS variables so Appearance
 * (Dark / Light / DropLinq Special) can update the whole UI live.
 *
 * Naming note:
 * - black / white / * = page chrome (bg + text on the page)
 * - card* = bubble panels (cream/white cards with dark ink — stay readable in every theme)
 */
export const palette = {
  red: paletteToken('--dl-red', droplinqTokens.red),
  redDark: paletteToken('--dl-red-dark', droplinqTokens.redDark),
  redLight: paletteToken('--dl-red-light', droplinqTokens.redLight),
  black: paletteToken('--dl-bg', droplinqTokens.bg),
  blackRaised: paletteToken('--dl-raised', droplinqTokens.raised),
  blackSoft: paletteToken('--dl-soft', droplinqTokens.soft),
  white: paletteToken('--dl-text', droplinqTokens.text),
  whiteDim: paletteToken('--dl-text-dim', droplinqTokens.textDim),
  whiteShadow: paletteToken('--dl-text-muted', droplinqTokens.textMuted),
  card: paletteToken('--dl-card', droplinqTokens.card),
  cardInk: paletteToken('--dl-card-ink', droplinqTokens.cardInk),
  cardMuted: paletteToken('--dl-card-muted', droplinqTokens.cardMuted),
  cardBorder: paletteToken('--dl-card-border', droplinqTokens.cardBorder),
  control: paletteToken('--dl-control', droplinqTokens.control),
  controlInk: paletteToken('--dl-control-ink', droplinqTokens.controlInk),
  onRaised: paletteToken('--dl-on-raised', droplinqTokens.onRaised),
  onRaisedDim: paletteToken('--dl-on-raised-dim', droplinqTokens.onRaisedDim),
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
