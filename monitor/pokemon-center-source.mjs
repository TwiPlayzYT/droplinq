const PRODUCT_LINK =
  /\/en-ca\/product\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9][a-zA-Z0-9-]*)/g;

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

export const extractProducts = (html) => {
  const normalizedHtml = html.replaceAll('\\/', '/');
  const products = new Map();

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
      region: 'ca',
      releaseType: title.toLowerCase().includes('preorder') ? 'preorder' : 'new',
      url: `https://www.pokemoncenter.com/en-ca/product/${id}/${slug}`,
      detectedAt: new Date().toISOString(),
      tags: ['tcg', format],
      inStock: true,
    });
  }

  return [...products.values()];
};

export async function fetchPokemonCenterProducts(urls, timeoutMs) {
  const products = new Map();
  const errors = [];

  await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url, {
          headers: {
            accept: 'text/html,application/xhtml+xml',
            'accept-language': 'en-CA,en;q=0.9',
            'user-agent':
              process.env.MONITOR_USER_AGENT ??
              'DropLinq/1.0 availability monitor (standard HTTP; no checkout automation)',
          },
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

        const html = await response.text();
        if (looksBlocked(html)) throw new Error('Pokémon Center security challenge returned');

        const found = extractProducts(html);
        if (found.length === 0) throw new Error('No supported TCG products found in page data');
        found.forEach((product) => products.set(product.id, product));
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
