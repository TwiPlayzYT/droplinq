import { effectiveDataMode } from '@/config/app-config';
import { CatalogRepository } from '@/services/data/catalog-repository';
import { mockCatalogRepository } from '@/services/data/mock-catalog';
import { supabaseCatalogRepository } from '@/services/data/supabase-catalog';

export const catalogRepository: CatalogRepository =
  effectiveDataMode === 'supabase' ? supabaseCatalogRepository : mockCatalogRepository;
