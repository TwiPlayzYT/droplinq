import { matchesCoverage } from '@/lib/filter-matcher';
import { CatalogStockEvent } from '@/types/catalog';
import { ClassifiedProductSignals, CoverageMode, FilterPreferences } from '@/types/filters';

export type AlertUser = {
  userId: string;
  alertsActive: boolean;
  regionId: string;
  retailerIds: string[];
  tcgIds: string[];
  coverageMode: CoverageMode;
  customCategoryIds: string[];
  includeOtherTcgProducts: boolean;
  watchlistProductIds: string[];
  restockAlerts: boolean;
  newReleaseAlerts: boolean;
  preorderAlerts: boolean;
  pushEnabled: boolean;
  includeNewReleases: boolean;
  includeRestocks: boolean;
  includePreorders: boolean;
};

export function filtersFromAlertUser(user: AlertUser): FilterPreferences {
  return {
    retailerId: user.retailerIds[0] ?? 'pokemon-center',
    tcgId: user.tcgIds[0] ?? 'pokemon',
    coverageMode: user.coverageMode,
    customCategoryIds: user.customCategoryIds,
    includeOtherTcgProducts: user.includeOtherTcgProducts,
    includeNewReleases: user.includeNewReleases,
    includeRestocks: user.includeRestocks,
    includePreorders: user.includePreorders,
  };
}

export function userMatchesEvent(
  user: AlertUser,
  event: CatalogStockEvent,
  product: ClassifiedProductSignals,
): boolean {
  if (!user.alertsActive || !user.pushEnabled) return false;
  if (user.regionId !== product.regionId) return false;
  if (user.retailerIds.length && !user.retailerIds.includes(product.retailerId)) return false;
  if (user.tcgIds.length && !user.tcgIds.includes(product.tcgId)) return false;

  const watching = user.watchlistProductIds.includes(product.id);
  if (watching) return true;

  if (event.kind === 'restock' && !user.restockAlerts) return false;
  if (event.kind === 'new_product' && !user.newReleaseAlerts) return false;
  if (event.kind === 'preorder' && !user.preorderAlerts) return false;

  return matchesCoverage(product, filtersFromAlertUser(user));
}

export function pushCopy(event: CatalogStockEvent) {
  const titles: Record<typeof event.kind, string> = {
    restock: 'DROP DETECTED',
    new_product: 'DROP DETECTED',
    preorder: 'PREORDER DETECTED',
    sold_out: 'SOLD OUT',
    coming_soon: 'COMING SOON',
  };
  return {
    title: titles[event.kind],
    body: `${event.retailerName} · ${event.productName} · ${event.newStatus.replace('-', ' ').toUpperCase()}`,
  };
}
