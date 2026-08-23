import type { FilterPreferences } from '@/types/filters';

export type ReleaseType = 'new' | 'restock' | 'preorder';
export type ProductFormat = 'etb' | 'booster-bundle' | 'booster-box' | 'upc';
export type ProductAvailability = 'in-stock' | 'sold-out' | 'unknown';
export type RegionId = 'us' | 'ca' | 'uk' | 'de' | 'au' | 'nz' | 'jp';

export type { CoverageMode, FilterPreferences } from '@/types/filters';

export type Product = {
  id: string;
  title: string;
  category: string;
  format: ProductFormat;
  /** Pokémon Center filter leaf id when known (poster, sticker, build-battle, etc.). */
  pcCategoryId?: string;
  releaseType: ReleaseType;
  url: string;
  imageUrl?: string;
  availability?: ProductAvailability;
  /** @deprecated All products are live-watched; kept for older persisted state. */
  historical?: boolean;
  releaseDate?: string;
  soldOutAt?: string;
  lastSeenAt?: string;
  detectedAt: string;
  tags: string[];
};

export type AlertPreferences = {
  push: boolean;
  sound: boolean;
  vibration: boolean;
  speech: boolean;
  fullScreen: boolean;
  dropMode: boolean;
};

export type DropAlert = {
  id: string;
  product: Product;
  seen: boolean;
  createdAt: string;
};

export type RecentVisit = {
  id: string;
  product: Product;
  openedAt: string;
};

export type WatchedItem = {
  id: string;
  product: Product;
  watchedAt: string;
};

export type PersistedState = {
  installationId: string;
  monitoring: boolean;
  region: RegionId;
  filters: FilterPreferences;
  alerts: AlertPreferences;
  alertHistory: DropAlert[];
  recentVisits: RecentVisit[];
  watchlist: WatchedItem[];
};
