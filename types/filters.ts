import { ProductFormat, RegionId, ReleaseType } from '@/types/dropdex';

export type CoverageMode = 'POPULAR' | 'ALL_TCG' | 'CUSTOM';

export type FilterCategoryGroupKey =
  | 'POPULAR'
  | 'COLLECTIONS'
  | 'TINS'
  | 'DECKS'
  | 'SPECIAL'
  | 'OTHER';

export type FilterCategory = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  groupKey: FilterCategoryGroupKey;
  isPopular: boolean;
  isOtherFallback: boolean;
  /** Legacy Product.format mapping for local catalog until Supabase products are classified */
  legacyFormats?: ProductFormat[];
};

export type FilterCategoryGroup = {
  key: FilterCategoryGroupKey;
  id: string;
  title: string;
  categories: FilterCategory[];
};

export type FilterPreferences = {
  retailerId: string;
  tcgId: string;
  coverageMode: CoverageMode;
  customCategoryIds: string[];
  includeOtherTcgProducts: boolean;
  includeNewReleases: boolean;
  includeRestocks: boolean;
  includePreorders: boolean;
  /** @deprecated kept for AsyncStorage migration from older builds */
  formats?: ProductFormat[];
};

export type ClassifiedProductSignals = {
  id: string;
  retailerId: string;
  regionId: RegionId | string;
  tcgId: string;
  isTcgProduct: boolean;
  classificationStatus?: 'classified' | 'needs_review' | 'excluded' | 'unknown';
  primaryCategoryId?: string | null;
  subcategoryId?: string | null;
  categoryIds: string[];
  tagIds: string[];
  isPopular?: boolean;
  format?: ProductFormat;
  releaseType?: ReleaseType;
  categoryLabel?: string;
};
