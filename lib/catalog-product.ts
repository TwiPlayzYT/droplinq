import { getRegion } from '@/data/regions';
import { CatalogProduct, availabilityToStockStatus } from '@/types/catalog';
import { Product, RegionId } from '@/types/dropdex';

/** Build a CatalogProduct from a local/seed Product when Supabase has no row. */
export function catalogProductFromLocal(
  product: Product,
  regionId: RegionId,
): CatalogProduct {
  const region = getRegion(regionId);
  const extra = product as Product & {
    retailerName?: string;
    regionName?: string;
    price?: number | null;
    currency?: string | null;
    lastCheckedAt?: string;
  };

  return {
    ...product,
    retailerId: 'pokemon-center',
    retailerName: extra.retailerName ?? region.storefront,
    regionId,
    regionName: extra.regionName ?? region.label,
    tcgId: 'pokemon',
    tcgName: 'Pokémon',
    categoryId: `pokemon-${product.format}`,
    categoryName: product.category,
    price: extra.price ?? null,
    currency: extra.currency ?? (regionId === 'ca' ? 'CAD' : 'USD'),
    stockStatus: availabilityToStockStatus(product.availability, product.releaseType),
    lastCheckedAt: extra.lastCheckedAt ?? product.lastSeenAt ?? product.detectedAt,
    dataSource: 'mock',
  };
}
