/**
 * Central DropLinq configuration.
 * Switch data sources here — do not scatter DATA_MODE checks across screens.
 */
export const brand = {
  name: 'DropLinq',
  displayName: 'DROPLINQ',
  legalName: 'DropLinq',
  /** Public support inbox — update if you later use a different domain. */
  contactEmail: 'hello@droplinq.app',
  /** Operating region for privacy / consumer-law notices. Not a street address. */
  jurisdiction: 'Canada',
  tagline: 'Monitor · Alert · Check',
  disclaimer:
    'DropLinq is an independent product availability monitoring service and is not affiliated with or endorsed by the retailers or brands it monitors.',
} as const;

/** Live static site (custom domain). onrender.com still works as a fallback host. */
export const productionWebOrigin = 'https://getdroplinq.com';

export type DataMode = 'mock' | 'supabase';

const rawMode = (process.env.EXPO_PUBLIC_DATA_MODE ?? 'mock').toLowerCase();

export const dataMode: DataMode = rawMode === 'supabase' ? 'supabase' : 'mock';

export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** Effective mode: supabase only when credentials exist. */
export const effectiveDataMode: DataMode =
  dataMode === 'supabase' && supabaseConfigured ? 'supabase' : 'mock';

export const isMockData = effectiveDataMode === 'mock';

export type SubscriptionTier = 'FREE' | 'PRO' | 'PRO_PLUS';

export const subscriptionLimits: Record<
  SubscriptionTier,
  {
    watchlistLimit: number | null;
    dropMode: boolean;
    extraRegions: boolean;
    extraRetailers: boolean;
    alertHistoryLimit: number;
    quietHours: boolean;
    productMute: boolean;
  }
> = {
  FREE: {
    watchlistLimit: 3,
    dropMode: false,
    extraRegions: false,
    extraRetailers: false,
    alertHistoryLimit: 10,
    quietHours: false,
    productMute: false,
  },
  PRO: {
    watchlistLimit: null,
    dropMode: true,
    extraRegions: true,
    extraRetailers: true,
    alertHistoryLimit: 100,
    quietHours: true,
    productMute: true,
  },
  PRO_PLUS: {
    watchlistLimit: null,
    dropMode: true,
    extraRegions: true,
    extraRetailers: true,
    alertHistoryLimit: 100,
    quietHours: true,
    productMute: true,
  },
};

/** Development-only override. Never treat this as a paid entitlement in production. */
export const devSubscriptionTier = ((): SubscriptionTier | undefined => {
  const value = (process.env.EXPO_PUBLIC_DEV_SUBSCRIPTION_TIER ?? '').toUpperCase();
  if (value === 'FREE' || value === 'PRO' || value === 'PRO_PLUS') return value;
  return undefined;
})();
