import { getSupabase } from '@/services/supabase/client';
import { CatalogRepository } from '@/services/data/catalog-repository';
import {
  CatalogProduct,
  CatalogStockEvent,
  StockEventKind,
  StockStatus,
  VerificationStatus,
} from '@/types/catalog';
import { ProductFormat } from '@/types/dropdex';

const slugToFormat = (slug: string): ProductFormat => {
  if (slug === 'etb' || slug === 'booster-bundle' || slug === 'booster-box' || slug === 'upc') {
    return slug;
  }
  return 'etb';
};

export const supabaseCatalogRepository: CatalogRepository = {
  async listProducts(query) {
    const supabase = getSupabase();
    if (!supabase) return [];
    let request = supabase.from('products').select(
      'id, name, product_url, image_url, price, currency, current_stock_status, last_checked_at, external_product_id, retailer_id, region_id, tcg_id, category_id, retailers(name), regions(name), tcgs(name), product_categories(name, slug)',
    );
    if (query.regionId) request = request.eq('region_id', query.regionId);
    if (query.retailerId) request = request.eq('retailer_id', query.retailerId);
    if (query.tcgId) request = request.eq('tcg_id', query.tcgId);
    const { data, error } = await request;
    if (error || !data) return [];

    return (data as Array<Record<string, unknown>>)
      .map(mapProduct)
      .filter((product) => {
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
    const supabase = getSupabase();
    if (!supabase) return null;
    const select =
      'id, name, product_url, image_url, price, currency, current_stock_status, last_checked_at, external_product_id, retailer_id, region_id, tcg_id, category_id, retailers(name), regions(name), tcgs(name), product_categories(name, slug)';

    const byExternal = await supabase
      .from('products')
      .select(select)
      .eq('external_product_id', id)
      .maybeSingle();
    if (!byExternal.error && byExternal.data) {
      return mapProduct(byExternal.data as Record<string, unknown>);
    }

    const byId = await supabase.from('products').select(select).eq('id', id).maybeSingle();
    if (byId.error || !byId.data) return null;
    return mapProduct(byId.data as Record<string, unknown>);
  },

  async listEvents(productId) {
    const supabase = getSupabase();
    if (!supabase) return [];
    let request = supabase
      .from('stock_events')
      .select('id, product_id, previous_status, new_status, event_kind, detected_at, verified_at, verification_status, confidence_score, source, products(name, retailers(name), regions(name))')
      .order('detected_at', { ascending: false })
      .limit(50);
    if (productId) request = request.eq('product_id', productId);
    const { data, error } = await request;
    if (error || !data) return [];
    return (data as Array<Record<string, unknown>>).map(mapEvent);
  },

  async listWatchlist(userId) {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase.from('watchlists').select('product_id').eq('user_id', userId);
    if (error || !data) return [];
    return (data as Array<{ product_id: string }>).map((row) => row.product_id);
  },

  async addWatch(userId, productId) {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, code: 'error', message: 'Supabase is not configured.' };
    const { error } = await supabase.from('watchlists').insert({ user_id: userId, product_id: productId });
    if (error) return { ok: false, code: 'error', message: error.message };
    return { ok: true };
  },

  async removeWatch(userId, productId) {
    await getSupabase()?.from('watchlists').delete().eq('user_id', userId).eq('product_id', productId);
  },

  async lastBackendUpdate() {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase
      .from('products')
      .select('last_checked_at')
      .order('last_checked_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as { last_checked_at?: string } | null)?.last_checked_at ?? null;
  },
};

function mapProduct(row: Record<string, unknown>): CatalogProduct {
  const category = row.product_categories as { name?: string; slug?: string } | null;
  const slug = (category?.slug ?? 'etb') as ProductFormat;
  const format = slugToFormat(slug);
  const status = (row.current_stock_status as StockStatus) ?? 'unknown';
  return {
    id: String(row.external_product_id ?? row.id),
    title: String(row.name),
    category: 'Trading Card Game',
    format,
    releaseType: status === 'preorder' ? 'preorder' : 'new',
    url: String(row.product_url),
    imageUrl: (row.image_url as string | null) ?? undefined,
    availability: status === 'in-stock' ? 'in-stock' : status === 'out-of-stock' ? 'sold-out' : 'unknown',
    detectedAt: (row.last_checked_at as string) ?? new Date().toISOString(),
    tags: ['tcg', format],
    retailerId: String(row.retailer_id),
    retailerName: String((row.retailers as { name?: string } | null)?.name ?? 'Retailer'),
    regionId: String(row.region_id) as CatalogProduct['regionId'],
    regionName: String((row.regions as { name?: string } | null)?.name ?? ''),
    tcgId: String(row.tcg_id),
    tcgName: String((row.tcgs as { name?: string } | null)?.name ?? ''),
    categoryId: String(row.category_id),
    categoryName: String(category?.name ?? ''),
    price: row.price == null ? null : Number(row.price),
    currency: (row.currency as string) ?? 'CAD',
    stockStatus: status,
    lastCheckedAt: (row.last_checked_at as string) ?? undefined,
    dataSource: 'supabase',
  };
}

function mapEvent(row: Record<string, unknown>): CatalogStockEvent {
  const product = row.products as {
    name?: string;
    retailers?: { name?: string };
    regions?: { name?: string };
  } | null;
  return {
    id: String(row.id),
    productId: String(row.product_id),
    productName: product?.name ?? 'Product',
    retailerName: product?.retailers?.name ?? 'Retailer',
    regionName: product?.regions?.name ?? '',
    kind: (row.event_kind as StockEventKind) ?? 'restock',
    previousStatus: (row.previous_status as StockStatus) ?? null,
    newStatus: (row.new_status as StockStatus) ?? 'unknown',
    detectedAt: String(row.detected_at),
    verifiedAt: (row.verified_at as string | null) ?? null,
    verificationStatus: (row.verification_status as VerificationStatus) ?? 'detected',
    confidenceScore: Number(row.confidence_score ?? 0),
    source: String(row.source ?? 'monitor'),
    dataSource: 'supabase',
  };
}
