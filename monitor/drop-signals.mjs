import { classifyFormat } from './pokemon-center-source.mjs';

/**
 * Pokémon Center blocks the monitor's datacenter IP, so a direct scrape never
 * sees a drop. Public posts that include the product links (the way Delta Reign
 * was announced) are readable and name the SKU. Only recent posts are used so
 * old articles do not replay as new alerts.
 */
const RECENT_MS = 72 * 60 * 60 * 1000;

const SOURCES = [
  {
    kind: 'blog-json',
    url: 'https://www.josephwriteranderson.com/blog?format=json',
  },
  {
    kind: 'feed',
    url: 'https://pokemonblog.com/feed/',
  },
  {
    kind: 'feed',
    url: 'https://www.reddit.com/r/pokemoncenter/.rss',
  },
];

const LOCALE_TO_REGION = {
  'en-ca': 'ca',
  'en-gb': 'uk',
  'de-de': 'de',
  'en-au': 'au',
  'en-nz': 'nz',
};

const decodeText = (value) =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&ndash;', '–')
    .replaceAll('&mdash;', '—')
    .replace(/\s+/g, ' ')
    .trim();

const skipTitle = (title) =>
  /\b(case|code card|booster pack|sleeved booster|half booster)\b/i.test(title);

export function productsFromPostHtml(html, { releaseType = 'new', detectedAt } = {}) {
  const products = new Map();
  const markup = String(html ?? '').replaceAll('\\/', '/');
  const links = markup.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi);

  for (const match of links) {
    const href = match[1];
    const urlMatch = href.match(
      /pokemoncenter\.com(?:\/([a-z]{2}-[a-z]{2}))?\/product\/([a-zA-Z0-9-]+)/i,
    );
    if (!urlMatch) continue;

    const title = decodeText(match[2].replace(/<[^>]+>/g, ' '));
    if (!title || skipTitle(title)) continue;
    const format = classifyFormat(title);
    if (!format) continue;

    const locale = urlMatch[1];
    const id = urlMatch[2];
    const region = locale ? (LOCALE_TO_REGION[locale] ?? 'us') : 'us';
    const path = href.startsWith('http')
      ? href
      : `https://www.pokemoncenter.com${href.startsWith('/') ? href : `/${href}`}`;
    const url = path.split('?')[0];

    products.set(`${region}:${id}`, {
      id,
      title,
      category: 'Trading Card Game',
      format,
      region,
      releaseType,
      url,
      detectedAt: detectedAt ?? new Date().toISOString(),
      tags: ['tcg', format],
      inStock: true,
    });
  }

  return [...products.values()];
}

export function productsFromBlogCollection(payload, now = Date.now()) {
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const products = new Map();

  for (const item of items) {
    const published = Number(item?.publishOn ?? item?.addedOn ?? 0);
    if (!Number.isFinite(published) || published <= 0) continue;
    if (now - published > RECENT_MS || published > now + 5 * 60_000) continue;

    const heading = String(item?.title ?? '');
    const releaseType = /pre-?order/i.test(heading) ? 'preorder' : 'new';
    const detectedAt = new Date(published).toISOString();
    for (const product of productsFromPostHtml(item?.body ?? '', { releaseType, detectedAt })) {
      products.set(`${product.region}:${product.id}`, product);
    }
  }

  return [...products.values()];
}

export function productsFromFeedXml(xml, now = Date.now()) {
  const markup = String(xml ?? '')
    .replaceAll('\\/', '/')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&');
  const blocks = markup.match(/<(?:item|entry)\b[\s\S]*?<\/(?:item|entry)>/gi) ?? [];
  const products = new Map();

  for (const block of blocks) {
    const published = Date.parse(
      block.match(/<(?:pubDate|updated|published)>([^<]+)<\//i)?.[1] ?? '',
    );
    if (!Number.isFinite(published)) continue;
    if (now - published > RECENT_MS || published > now + 5 * 60_000) continue;

    const heading = decodeText(
      (block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1] ?? '').replace(
        /<!\[CDATA\[|\]\]>/g,
        '',
      ),
    );
    const releaseType = /pre-?order/i.test(heading)
      ? 'preorder'
      : /restock|in stock/i.test(heading)
        ? 'restock'
        : 'new';
    for (const product of productsFromPostHtml(block, {
      releaseType,
      detectedAt: new Date(published).toISOString(),
    })) {
      products.set(`${product.region}:${product.id}`, product);
    }
  }

  return [...products.values()];
}

async function readSource(source, timeoutMs) {
  const response = await fetch(source.url, {
    headers: {
      accept: source.kind === 'blog-json' ? 'application/json' : 'application/rss+xml, application/atom+xml, text/xml',
      'user-agent': 'Mozilla/5.0 (compatible; DropLinq/1.0; +https://getdroplinq.com)',
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`${source.url} returned ${response.status}`);
  if (source.kind === 'blog-json') {
    return productsFromBlogCollection(await response.json());
  }
  return productsFromFeedXml(await response.text());
}

export async function fetchRecentDropProducts(timeoutMs = 15_000) {
  const results = await Promise.allSettled(SOURCES.map((source) => readSource(source, timeoutMs)));
  const products = new Map();
  const errors = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      for (const product of result.value) {
        products.set(`${product.region}:${product.id}`, product);
      }
      return;
    }
    const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
    errors.push(`${SOURCES[index].url}: ${message}`);
  });

  if (products.size === 0 && errors.length === SOURCES.length) {
    throw new Error(errors.join(' | '));
  }
  if (errors.length > 0) {
    console.warn('[monitor] Drop source missed:', errors.join(' | '));
  }
  return [...products.values()];
}
