import { Product, ProductFormat, RegionId, ReleaseType } from '@/types/dropdex';

export type StockStatus =
  | 'in-stock'
  | 'out-of-stock'
  | 'preorder'
  | 'coming-soon'
  | 'unknown';

export type DataSourceKind = 'supabase' | 'mock';

export type VerificationStatus = 'detected' | 'verified' | 'rejected' | 'unverified';

export type CatalogProduct = Product & {
  retailerId: string;
  retailerName: string;
  regionId: RegionId;
  regionName: string;
  tcgId: string;
  tcgName: string;
  categoryId: string;
  categoryName: string;
  price?: number | null;
  currency?: string | null;
  stockStatus: StockStatus;
  lastCheckedAt?: string;
  dataSource: DataSourceKind;
};

export type StockEventKind =
  | 'restock'
  | 'new_product'
  | 'preorder'
  | 'sold_out'
  | 'coming_soon';

export type CatalogStockEvent = {
  id: string;
  productId: string;
  productName: string;
  retailerName: string;
  regionName: string;
  kind: StockEventKind;
  previousStatus?: StockStatus | null;
  newStatus: StockStatus;
  detectedAt: string;
  verifiedAt?: string | null;
  verificationStatus: VerificationStatus;
  confidenceScore: number;
  source: string;
  dataSource: DataSourceKind;
};

export const formatToCategorySlug: Record<ProductFormat, string> = {
  etb: 'etb',
  'booster-bundle': 'booster-bundle',
  'booster-box': 'booster-box',
  upc: 'upc',
};

export function availabilityToStockStatus(
  availability: Product['availability'],
  releaseType?: ReleaseType,
): StockStatus {
  if (releaseType === 'preorder') return 'preorder';
  if (availability === 'in-stock') return 'in-stock';
  if (availability === 'sold-out') return 'out-of-stock';
  return 'unknown';
}

export function stockStatusLabel(status: StockStatus): string {
  switch (status) {
    case 'in-stock':
      return 'IN STOCK';
    case 'out-of-stock':
      return 'OUT OF STOCK';
    case 'preorder':
      return 'PREORDER';
    case 'coming-soon':
      return 'COMING SOON';
    default:
      return 'UNKNOWN';
  }
}
