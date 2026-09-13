const PRODUCT_LINK =
  /(?:\/([a-z]{2}-[a-z]{2}))?\/product\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9][a-zA-Z0-9-]*)/g;

const LOCALE_TO_REGION = {
  'en-ca': 'ca',
  'en-gb': 'uk',
  'de-de': 'de',
  'en-au': 'au',
  'en-nz': 'nz',
};

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

const decodeText = (value) =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&ndash;', '–')
    .replaceAll('&mdash;', '—');

const titleFromSlug = (slug) =>
  decodeText(
    slug
      .split('-')
      .filter(Boolean)
      .map((word) => (word.length <= 3 ? word.toUpperCase() : `${word[0].toUpperCase()}${word.slice(1)}`))
      .join(' '),
  );

export const classifyFormat = (title) => {
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
};

const looksBlocked = (html) => {
  const value = html.toLowerCase();
  return (
    value.includes('incapsula incident id') ||
    value.includes('pardon our interruption') ||
    value.includes('request unsuccessful') ||
    value.includes("something's gone wrong") ||
    value.includes('get you back on track') ||
    value.includes('incident id')
  );
};

const regionFromLocale = (locale) => LOCALE_TO_REGION[locale] ?? 'us';

const productUrl = (locale, id, slug) =>
  `https://www.pokemoncenter.com${locale ? `/${locale}` : ''}/product/${id}/${slug}`;

export const extractProducts = (html) => {
  const normalizedHtml = html.replaceAll('\\/', '/');
  const products = new Map();

  for (const match of normalizedHtml.matchAll(PRODUCT_LINK)) {
    const [, locale, id, slug] = match;
    const title = titleFromSlug(slug);
    const format = classifyFormat(title);
    if (!format) continue;

    const region = regionFromLocale(locale);
    products.set(`${region}:${id}`, {
      id,
      title,
      category: 'Trading Card Game',
      format,
      region,
      releaseType: title.toLowerCase().includes('preorder') ? 'preorder' : 'new',
      url: productUrl(locale, id, slug),
      detectedAt: new Date().toISOString(),
      tags: ['tcg', format],
      inStock: true,
    });
  }

  return [...products.values()];
};

async function fetchCatalogHtml(url, timeoutMs) {
  const response = await fetch(url, {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'en-CA,en;q=0.9',
      'cache-control': 'no-cache',
      'user-agent': process.env.MONITOR_USER_AGENT ?? BROWSER_UA,
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

  const html = await response.text();
  if (looksBlocked(html)) throw new Error('Pokémon Center security challenge returned');
  return html;
}

export async function fetchPokemonCenterProducts(urls, timeoutMs) {
  const products = new Map();
  const errors = [];

  await Promise.all(
    urls.map(async (url) => {
      try {
        const html = await fetchCatalogHtml(url, timeoutMs);
        const found = extractProducts(html);
        if (found.length === 0) throw new Error('No supported TCG products found in page data');
        found.forEach((product) => products.set(`${product.region}:${product.id}`, product));
      } catch (error) {
        errors.push(`${url}: ${error.message}`);
      }
    }),
  );

  if (products.size === 0) {
    throw new Error(`All Pokémon Center checks failed: ${errors.join(' | ')}`);
  }

  return {
    products: [...products.values()],
    complete: errors.length === 0,
    errors,
  };
}
