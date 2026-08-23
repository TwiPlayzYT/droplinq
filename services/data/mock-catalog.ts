import { getRegion } from '@/data/regions';
import { historicalProducts, watchedSoldOutProducts } from '@/data/historical-etbs';
import { CatalogRepository } from '@/services/data/catalog-repository';
import {
  availabilityToStockStatus,
  CatalogProduct,
  CatalogStockEvent,
} from '@/types/catalog';
import { ProductFormat, RegionId } from '@/types/dropdex';

const watchlists = new Map<string, Set<string>>();
const seededAt = new Date().toISOString();

function toCatalog(
  product: (typeof historicalProducts)[number] | (typeof watchedSoldOutProducts)[number],
  regionId: RegionId,
): CatalogProduct {
  const region = getRegion(regionId);
  const formatNames: Record<ProductFormat, string> = {
    etb: 'Elite Trainer Boxes',
    'booster-bundle': 'Booster Bundles',
    'booster-box': 'Booster Boxes',
    upc: 'Ultra-Premium Collections',
  };
  return {
    ...product,
    retailerId: 'pokemon-center',
    retailerName: 'Pokémon Center Canada',
    regionId,
    regionName: region.label,
    tcgId: 'pokemon',
    tcgName: 'Pokémon',
    categoryId: `pokemon-${product.format}`,
    categoryName: formatNames[product.format],
    price: null,
    currency: 'CAD',
    stockStatus: availabilityToStockStatus(product.availability, product.releaseType),
    lastCheckedAt: seededAt,
    dataSource: 'mock',
  };
}

function allProducts(regionId: RegionId): CatalogProduct[] {
  return [...watchedSoldOutProducts, ...historicalProducts].map((product) =>
    toCatalog(product, regionId),
  );
}

function mockEvents(regionId: RegionId): CatalogStockEvent[] {
  const products = allProducts(regionId).slice(0, 8);
  const now = Date.now();
  const kinds: CatalogStockEvent['kind'][] = [
    'restock',
    'new_product',
    'sold_out',
    'preorder',
    'restock',
    'sold_out',
    'new_product',
    'sold_out',
  ];
  return products.map((product, index) => ({
    id: `mock-event-${product.id}`,
    productId: product.id,
    productName: product.title,
    retailerName: product.retailerName,
    regionName: product.regionName,
    kind:
      product.releaseType === 'preorder' && index === 0
        ? 'preorder'
        : kinds[index % kinds.length],
    previousStatus: 'unknown',
    newStatus: product.stockStatus,
    detectedAt: new Date(now - (index + 1) * 7 * 60_000).toISOString(),
    verifiedAt: null,
    verificationStatus: 'unverified',
    confidenceScore: 0,
    source: 'mock-monitor',
    dataSource: 'mock',
  }));
}

export const mockCatalogRepository: CatalogRepository = {
  async listProducts(query) {
    const regionId = query.regionId ?? 'ca';
    return allProducts(regionId).filter((product) => {
      if (query.retailerId && product.retailerId !== query.retailerId) return false;
      if (query.tcgId && product.tcgId !== query.tcgId) return false;
      if (query.categorySlugs?.length && !query.categorySlugs.includes(product.format)) return false;
      if (query.statuses?.length && !query.statuses.includes(product.stockStatus)) return false;
      if (query.search) {
        const hay = `${product.title} ${product.retailerName}`.toLowerCase();
        if (!query.search.toLowerCase().split(/\s+/).every((term) => hay.includes(term))) {
          return false;
        }
      }
      return true;
    });
  },

  async getProduct(id) {
    const regions: RegionId[] = ['ca', 'us', 'uk', 'de', 'au', 'nz', 'jp'];
    for (const regionId of regions) {
      const match = allProducts(regionId).find((product) => product.id === id);
      if (match) return match;
    }
    return null;
  },

  async listEvents(productId) {
    const events = mockEvents('ca');
    return productId ? events.filter((event) => event.productId === productId) : events;
  },

  async listWatchlist(userId) {
    return [...(watchlists.get(userId) ?? new Set())];
  },

  async addWatch(userId, productId) {
    const set = watchlists.get(userId) ?? new Set();
    set.add(productId);
    watchlists.set(userId, set);
    return { ok: true };
  },

  async removeWatch(userId, productId) {
    watchlists.get(userId)?.delete(productId);
  },

  async lastBackendUpdate() {
    return seededAt;
  },
};
