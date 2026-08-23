import { Product, ProductFormat } from '@/types/dropdex';

const PRODUCT_LINK =
  /\/en-ca\/product\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9][a-zA-Z0-9-]*)/g;

const MONITOR_URLS = [
  'https://www.pokemoncenter.com/en-ca/category/trading-card-game',
  'https://www.pokemoncenter.com/en-ca/category/new-releases',
] as const;

const decodeText = (value: string) =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&ndash;', '–')
    .replaceAll('&mdash;', '—');

const titleFromSlug = (slug: string) =>
  decodeText(
    slug
      .split('-')
      .filter(Boolean)
      .map((word) =>
        word.length <= 3 ? word.toUpperCase() : `${word[0].toUpperCase()}${word.slice(1)}`,
      )
      .join(' '),
  );

export function classifyFormat(title: string): ProductFormat | undefined {
  const value = title.toLowerCase();
  if (value.includes('elite trainer box') || /\betb\b/.test(value)) return 'etb';
  if (value.includes('booster bundle')) return 'booster-bundle';
  if (value.includes('booster box') || value.includes('booster display')) return 'booster-box';
  if (
    value.includes('ultra-premium collection') ||
    value.includes('ultra premium collection') ||
    /\bupc\b/.test(value)
  ) {
    return 'upc';
  }
  return undefined;
}

export function normalizeImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim().replaceAll('\\/', '/').replaceAll('\\u002F', '/');
  if (!trimmed || trimmed.startsWith('data:') || trimmed === 'null' || trimmed === 'undefined') {
    return undefined;
  }
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `https://www.pokemoncenter.com${trimmed}`;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return undefined;
}

export function extractProductImageUrl(html: string): string | undefined {
  const normalized = html.replaceAll('\\/', '/');

  const ogMatch =
    normalized.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ??
    normalized.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  const og = normalizeImageUrl(ogMatch?.[1]);
  if (og) return og;

  const twitterMatch =
    normalized.match(/name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ??
    normalized.match(/content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
  const twitter = normalizeImageUrl(twitterMatch?.[1]);
  if (twitter) return twitter;

  const imgMatch = normalized.match(
    /https?:\/\/[^"'\\\s]+(?:pokemon|product|media|scene7|images|demandware)[^"'\\\s]+\.(?:jpg|jpeg|png|webp)/i,
  );
  return normalizeImageUrl(imgMatch?.[0]);
}

/** Pull the best image URL near a product id inside catalog HTML. */
export function extractImageForProductId(html: string, productId: string): string | undefined {
  // Locate the id first and normalize only the small window around it —
  // running replaceAll over a full 280 KB page per product froze the JS thread.
  const idIndex = html.indexOf(productId);
  if (idIndex < 0) return undefined;

  const windowStart = Math.max(0, idIndex - 2500);
  const windowEnd = Math.min(html.length, idIndex + 2500);
  const slice = html.slice(windowStart, windowEnd).replaceAll('\\/', '/');

  const candidates = [
    ...slice.matchAll(
      /(?:src|data-src|data-lazy-src)=["']([^"']+)["']/gi,
    ),
    ...slice.matchAll(/https?:\/\/[^"'\\\s]+(?:scene7|demandware|images|media)[^"'\\\s]+\.(?:jpg|jpeg|png|webp)/gi),
  ];

  for (const match of candidates) {
    const url = normalizeImageUrl(Array.isArray(match) ? match[1] ?? match[0] : match[0]);
    if (url && !url.includes('placeholder') && !url.includes('spacer')) return url;
  }

  return undefined;
}

const looksBlocked = (html: string) => {
  const value = html.toLowerCase();
  return (
    value.includes('incapsula incident id') ||
    value.includes('pardon our interruption') ||
    value.includes('request unsuccessful') ||
    value.includes('checking your browser before accessing') ||
    value.includes('_incapsula_resource') ||
    value.includes("something's gone wrong") ||
    value.includes('get you back on track, trainer')
  );
};

export function looksBlockedHtml(html: string) {
  return looksBlocked(html);
}

export function extractProducts(html: string): Product[] {
  const normalizedHtml = html.replaceAll('\\/', '/');
  const products = new Map<string, Product>();

  for (const match of normalizedHtml.matchAll(PRODUCT_LINK)) {
    const [, id, slug] = match;
    const title = titleFromSlug(slug);
    const format = classifyFormat(title);
    if (!format) continue;

    products.set(id, {
      id,
      title,
      category: 'Trading Card Game',
      format,
      releaseType: title.toLowerCase().includes('preorder') ? 'preorder' : 'new',
      url: `https://www.pokemoncenter.com/en-ca/product/${id}/${slug}`,
      imageUrl: extractImageForProductId(normalizedHtml, id),
      availability: 'unknown',
      detectedAt: new Date().toISOString(),
      tags: ['tcg', format],
    });
  }

  return [...products.values()];
}

export async function fetchLivePokemonCenterProducts(): Promise<{
  products: Product[];
  errors: string[];
}> {
  const products = new Map<string, Product>();
  const errors: string[] = [];

  await Promise.all(
    MONITOR_URLS.map(async (url) => {
      try {
        const response = await fetch(url, {
          headers: {
            Accept: 'text/html,application/xhtml+xml',
            'Accept-Language': 'en-CA,en;q=0.9',
          },
        });

        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

        const html = await response.text();
        if (looksBlocked(html)) throw new Error('Pokémon Center security challenge returned');

        const found = extractProducts(html);
        if (found.length === 0) throw new Error('No supported TCG products found');
        found.forEach((product) => products.set(product.id, product));
      } catch (error) {
        errors.push(`${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),
  );

  if (products.size === 0) {
    throw new Error(errors.join(' | ') || 'Unable to read Pokémon Center Canada');
  }

  return { products: [...products.values()], errors };
}
