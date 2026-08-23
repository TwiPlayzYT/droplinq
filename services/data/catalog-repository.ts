import { CatalogProduct, CatalogStockEvent, StockStatus } from '@/types/catalog';
import { ProductFormat, RegionId } from '@/types/dropdex';

export type CatalogQuery = {
  regionId?: RegionId;
  retailerId?: string;
  tcgId?: string;
  categorySlugs?: ProductFormat[];
  search?: string;
  statuses?: StockStatus[];
};

export interface CatalogRepository {
  listProducts(query: CatalogQuery): Promise<CatalogProduct[]>;
  getProduct(id: string): Promise<CatalogProduct | null>;
  listEvents(productId?: string): Promise<CatalogStockEvent[]>;
  listWatchlist(userId: string): Promise<string[]>;
  addWatch(userId: string, productId: string): Promise<{ ok: true } | { ok: false; code: 'limit' | 'error'; message: string }>;
  removeWatch(userId: string, productId: string): Promise<void>;
  lastBackendUpdate(): Promise<string | null>;
}
