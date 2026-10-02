import { billingConfig } from './billing.mjs';

/**
 * Packshots for a newly detected SKU. The search result's product id is used
 * only after the name matches that SKU (set words + format). Cases, packs, and
 * a single set logo are not reused across different products.
 */
const SEARCH_URL = 'https://mp-search-api.tcgplayer.com/v1/search/request';
const PHOTO_BUCKET = 'product-photos';

const REJECT =
  /\b(case|half booster|sleeved|booster pack|art bundle|code card|mini tin display)\b/i;

const FORMAT_NEEDLES = [
  ['elite trainer box', 'elite trainer box'],
  ['booster bundle', 'booster bundle'],
  ['booster box', 'booster box'],
  ['booster display', 'booster box'],
  ['ultra-premium collection', 'ultra-premium'],
  ['ultra premium collection', 'ultra premium'],
  ['build & battle', 'build'],
  ['build and battle', 'build'],
];

const STOP = new Set([
  'elite',
  'trainer',
  'box',
  'booster',
  'bundle',
  'pokemon',
  'center',
  'the',
  'and',
  'with',
  'collection',
  'mega',
  'evolution',
  'tcg',
]);

const normalize = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/pokémon/g, 'pokemon')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export function choosePackshot(title, results) {
  const want = normalize(title);
  const needle = FORMAT_NEEDLES.find(([phrase]) => want.includes(phrase));
  if (!needle) return null;
  const tokens = want.split(' ').filter((word) => word.length > 3 && !STOP.has(word));
  const matches = (Array.isArray(results) ? results : []).filter((row) => {
    const name = normalize(row?.productName);
    if (!name.includes(needle[1])) return false;
    if (REJECT.test(name)) return false;
    if (tokens.length > 0 && !tokens.every((token) => name.includes(token))) return false;
    const productId = Number(row?.productId);
    return Number.isFinite(productId) && productId > 0;
  });
  if (matches.length === 0) return null;
  matches.sort((a, b) => {
    const score = (row) => (normalize(row.productName).includes('pokemon center') ? 1 : 0);
    return score(b) - score(a);
  });
  return {
    productId: String(Math.trunc(Number(matches[0].productId))),
    productName: matches[0].productName,
  };
}

const configured = () =>
  Boolean(billingConfig.supabaseUrl && billingConfig.supabaseServiceKey);

let bucketReady = false;

async function ensurePublicBucket() {
  if (bucketReady || !configured()) return;
  const root = billingConfig.supabaseUrl.replace(/\/$/, '');
  const response = await fetch(`${root}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      apikey: billingConfig.supabaseServiceKey,
      Authorization: `Bearer ${billingConfig.supabaseServiceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: PHOTO_BUCKET, name: PHOTO_BUCKET, public: true }),
  });
  if (response.ok || response.status === 409 || response.status === 400) bucketReady = true;
}

async function searchProducts(title) {
  const url = `${SEARCH_URL}?q=${encodeURIComponent(title)}&isList=false`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    },
    body: JSON.stringify({
      algorithm: 'sales_synonym_v2',
      from: 0,
      size: 12,
      filters: { term: { productLineName: ['pokemon'] } },
      listingSearch: {
        context: { cart: {} },
        filters: {
          term: { sellerStatus: 'Live', channelId: 0 },
          range: { quantity: { gte: 1 } },
          exclude: { channelExclusion: 0 },
        },
      },
      context: { cart: {}, shippingCountry: 'US', userProfile: {} },
      settings: { useFuzzySearch: true, didYouMean: {} },
      sort: {},
    }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Packshot search returned ${response.status}`);
  const payload = await response.json();
  return payload?.results?.[0]?.results ?? [];
}

async function hostPackshot(productId, sourceId) {
  if (!configured()) return undefined;
  const source = await fetch(
    `https://tcgplayer-cdn.tcgplayer.com/product/${productId}_in_1000x1000.jpg`,
    { signal: AbortSignal.timeout(12_000) },
  );
  if (!source.ok) return undefined;
  const bytes = Buffer.from(await source.arrayBuffer());
  if (bytes.length < 8_000) return undefined;

  await ensurePublicBucket();
  const root = billingConfig.supabaseUrl.replace(/\/$/, '');
  const objectPath = `${encodeURIComponent(sourceId)}.jpg`;
  const response = await fetch(`${root}/storage/v1/object/${PHOTO_BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: {
      apikey: billingConfig.supabaseServiceKey,
      Authorization: `Bearer ${billingConfig.supabaseServiceKey}`,
      'Content-Type': 'image/jpeg',
      'x-upsert': 'true',
    },
    body: bytes,
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Packshot upload failed ${response.status} ${detail.slice(0, 120)}`);
  }
  return `${root}/storage/v1/object/public/${PHOTO_BUCKET}/${objectPath}`;
}

const hosted = new Map();

/** Public image URL for this SKU, or undefined when no matching packshot exists. */
export async function lookupPackshot(product) {
  if (!product?.id || !product?.title) return undefined;
  if (hosted.has(product.id)) return hosted.get(product.id);
  const results = await searchProducts(product.title);
  const match = choosePackshot(product.title, results);
  if (!match) return undefined;
  const imageUrl = await hostPackshot(match.productId, product.id);
  if (imageUrl) hosted.set(product.id, imageUrl);
  return imageUrl;
}

export async function attachPackshots(products) {
  const next = [];
  for (const product of products) {
    if (product?.imageUrl && !/tcgplayer/i.test(product.imageUrl)) {
      next.push(product);
      continue;
    }
    try {
      const imageUrl = await lookupPackshot(product);
      next.push(imageUrl ? { ...product, imageUrl } : product);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[monitor] Packshot skipped for ${product?.id}:`, message);
      next.push(product);
    }
  }
  return next;
}
