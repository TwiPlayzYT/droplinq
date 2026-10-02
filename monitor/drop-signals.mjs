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
    assumeStore: true,
  },
  {
    kind: 'feed',
    url: 'https://www.polygon.com/rss/index.xml',
  },
];

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

const DROP_HEADLINE = /pok[eé]mon\s+center|pokemoncenter/i;
const DROP_ACTION =
  /pre-?orders?|now live|goes live|in stock|restock|back in stock|available now|queue\b.{0,24}(?:live|up)|listings?\b.{0,16}live/i;

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
  /\b(case|code card|booster pack|sleeved booster|half booster|plush|squishmallow)\b/i.test(title);

/** ETB / box / bundle / UPC, plus the other sealed products the catalog alerts on. */
const sealedFormat = (title) => {
  const known = classifyFormat(title);
  if (known) return known;
  const value = title.toLowerCase();
  if (
    /\b(collection|tin|deck|blister|calendar|build & battle|build and battle)\b/.test(value)
  ) {
    return 'other';
  }
  return undefined;
};

const isQueueHeading = (heading) => /queue/i.test(heading) && /\b(live|up|open|opened|start)/i.test(heading);

const dropSlug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'pokemon-center';

/** Set name pulled out of a headline, such as "Delta Reign" from a queue title. */
export function dropNameFromHeading(heading) {
  const cleaned = decodeText(String(heading ?? ''))
    .replace(/pok[eé]mon\s+center/gi, ' ')
    .replace(
      /\b(queue|pre-?orders?|now|goes|going|is|are|live|up|open|opens|opened|start|restock|stock|available|listing|listings|the|and|for|from|this|week|next|big|tcg|set|select|products|product|expected|virtual)\b/gi,
      ' ',
    )
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length >= 3 ? cleaned : '';
}

export function queueProduct(title, { detectedAt, assumeStore = false } = {}) {
  const heading = decodeText(String(title ?? ''));
  if (!heading || !isQueueHeading(heading)) return null;
  const namesStore = DROP_HEADLINE.test(heading);
  if (!namesStore && !assumeStore) return null;

  const name = dropNameFromHeading(heading);
  const detected = detectedAt ?? new Date().toISOString();
  return {
    id: `queue-${dropSlug(name || 'pokemon-center')}`,
    title: name ? `${name} queue is live` : 'Pokémon Center queue is live',
    category: 'Trading Card Game',
    format: 'other',
    region: 'us',
    releaseType: 'queue',
    url: 'https://www.pokemoncenter.com',
    detectedAt: detected,
    tags: ['tcg', 'queue'],
    inStock: true,
    availability: 'in-stock',
    releaseDate: detected,
  };
}

/** A public listing is not a live stock check. Preorders stay unconfirmed until the product page is seen. */
function listingStock(releaseType) {
  if (releaseType === 'preorder') return { inStock: false, availability: 'unknown' };
  return { inStock: true, availability: 'in-stock' };
}

const headlineId = (title) =>
  `headline-${title
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)}`;

export function headlineProduct(title, { detectedAt, url, assumeStore = false } = {}) {
  const queued = queueProduct(title, { detectedAt, assumeStore });
  if (queued) return queued;

  const heading = decodeText(String(title ?? ''));
  if (!heading || !DROP_ACTION.test(heading)) return null;
  const namesStore = DROP_HEADLINE.test(heading);
  if (!namesStore && !assumeStore) return null;
  if (
    !namesStore &&
    !/\b(etb|booster|bundle|tin|upc|collection|pre-?order|queue|listing)\b/i.test(heading)
  ) {
    return null;
  }

  return {
    id: headlineId(heading),
    title: heading,
    category: 'Trading Card Game',
    format: 'other',
    region: 'us',
    releaseType: /pre-?order/i.test(heading)
      ? 'preorder'
      : /restock|in stock/i.test(heading)
        ? 'restock'
        : 'new',
    url: typeof url === 'string' && /^https?:/i.test(url) ? url : 'https://www.pokemoncenter.com',
    detectedAt: detectedAt ?? new Date().toISOString(),
    tags: ['tcg', 'headline'],
    ...listingStock(
      /pre-?order/i.test(heading) ? 'preorder' : /restock|in stock/i.test(heading) ? 'restock' : 'new',
    ),
    releaseDate: detectedAt ?? new Date().toISOString(),
  };
}

/** SKUs win over a queue or headline in the same check, so the alert names the product. */
export function preferLinkedProducts(products) {
  const linked = products.filter((product) => !/^(headline|queue)-/.test(String(product?.id ?? '')));
  return linked.length > 0 ? linked : products;
}

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
    const format = sealedFormat(title);
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
      ...listingStock(releaseType),
      releaseDate: detectedAt ?? new Date().toISOString(),
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
    const linked = productsFromPostHtml(item?.body ?? '', { releaseType, detectedAt });
    for (const product of linked) {
      products.set(`${product.region}:${product.id}`, product);
    }
    if (linked.length === 0) {
      const headline = headlineProduct(heading, {
        detectedAt,
        url: typeof item?.fullUrl === 'string' ? item.fullUrl : item?.url,
      });
      if (headline) products.set(headline.id, headline);
    }
  }

  return [...products.values()];
}

const articleUrlFromBlock = (block) => {
  const href = block.match(/<link\b[^>]*\bhref=["']([^"']+)["']/i)?.[1];
  if (href && /^https?:/i.test(href)) return href;
  const text = block.match(/<link>([^<]+)<\/link>/i)?.[1]?.trim();
  if (text && /^https?:/i.test(text)) return text;
  return undefined;
};

export function productsFromFeedXml(xml, now = Date.now(), { assumeStore = false } = {}) {
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
      (block.match(/<title\b[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1] ?? '').replace(
        /<!\[CDATA\[|\]\]>/g,
        '',
      ),
    );
    const releaseType = /pre-?order/i.test(heading)
      ? 'preorder'
      : /restock|in stock/i.test(heading)
        ? 'restock'
        : 'new';
    const detectedAt = new Date(published).toISOString();
    const linked = productsFromPostHtml(block, { releaseType, detectedAt });
    for (const product of linked) {
      products.set(`${product.region}:${product.id}`, product);
    }
    if (linked.length === 0) {
      const headline = headlineProduct(heading, {
        detectedAt,
        url: articleUrlFromBlock(block),
        assumeStore,
      });
      if (headline) products.set(headline.id, headline);
    }
  }

  return [...products.values()];
}

async function readSource(source, timeoutMs) {
  const response = await fetch(source.url, {
    headers: {
      accept:
        source.kind === 'blog-json'
          ? 'application/json'
          : 'application/rss+xml, application/atom+xml, text/xml, */*',
      'accept-language': 'en-US,en;q=0.9',
      'user-agent': BROWSER_UA,
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`${source.url} returned ${response.status}`);
  if (source.kind === 'blog-json') {
    return productsFromBlogCollection(await response.json());
  }
  return productsFromFeedXml(await response.text(), Date.now(), {
    assumeStore: source.assumeStore === true,
  });
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
  return preferLinkedProducts([...products.values()]);
}
