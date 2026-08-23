import { StockStatus } from '@/types/catalog';

/**
 * Retailer monitors run on a backend process — never inside the React Native app.
 * The phone only displays results and stores user preferences.
 */
export type NormalizedListing = {
  externalProductId: string;
  retailerId: string;
  regionId: string;
  tcgId: string;
  categorySlug: string;
  name: string;
  productUrl: string;
  imageUrl?: string;
  price?: number | null;
  currency?: string | null;
  stockStatus: StockStatus;
  observedAt: string;
};

export type DetectedChange = {
  listing: NormalizedListing;
  previousStatus: StockStatus | null;
  kind: 'new_product' | 'restock' | 'preorder' | 'sold_out' | 'coming_soon';
};

export interface RetailerMonitor {
  id: string;
  retailerId: string;
  regionId: string;
  fetchListings(): Promise<NormalizedListing[]>;
}

export type VerificationResult = {
  verified: boolean;
  confidenceScore: number;
  verifiedAt?: string;
  reason: string;
};
