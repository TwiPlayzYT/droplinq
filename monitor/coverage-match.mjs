const POPULAR_FORMATS = new Set(['etb', 'upc']);
const ALLOWED_FORMATS = new Set(['etb', 'booster-bundle', 'booster-box', 'upc']);
const ALLOWED_MODES = new Set(['POPULAR', 'ALL_TCG', 'CUSTOM']);

/** Legacy format → category ids used by the mobile Filter catalog. */
const FORMAT_TO_CATEGORIES = {
  etb: ['pokemon-pc-etb'],
  upc: ['pokemon-upc'],
  'booster-bundle': ['pokemon-other-tcg'],
  'booster-box': ['pokemon-other-tcg'],
};

export function normalizeCoverageFilters(input) {
  const raw = input && typeof input === 'object' ? input : {};
  let coverageMode = ALLOWED_MODES.has(raw.coverageMode) ? raw.coverageMode : null;
  const customCategoryIds = Array.isArray(raw.customCategoryIds)
    ? [...new Set(raw.customCategoryIds.filter((id) => typeof id === 'string'))]
    : [];

  // Migrate old registrations that only sent formats[].
  const formats = Array.isArray(raw.formats)
    ? raw.formats.filter((format) => ALLOWED_FORMATS.has(format))
    : [];

  if (!coverageMode) {
    if (formats.length) {
      coverageMode = 'CUSTOM';
      for (const format of formats) {
        for (const id of FORMAT_TO_CATEGORIES[format] ?? []) {
          if (!customCategoryIds.includes(id)) customCategoryIds.push(id);
        }
      }
    } else {
      coverageMode = 'ALL_TCG';
    }
  }

  return {
    retailerId: typeof raw.retailerId === 'string' ? raw.retailerId : 'pokemon-center',
    tcgId: typeof raw.tcgId === 'string' ? raw.tcgId : 'pokemon',
    coverageMode,
    customCategoryIds,
    includeOtherTcgProducts: raw.includeOtherTcgProducts !== false,
    includeNewReleases: raw.includeNewReleases !== false,
    includeRestocks: raw.includeRestocks !== false,
    includePreorders: raw.includePreorders !== false,
    // Kept so older clients / storage stay readable during transition.
    formats,
  };
}

export function productMatchesCoverage(product, filters) {
  if (!filters) return false;
  if (product.releaseType === 'new' && !filters.includeNewReleases) return false;
  if (product.releaseType === 'restock' && !filters.includeRestocks) return false;
  if (product.releaseType === 'preorder' && !filters.includePreorders) return false;

  if (filters.coverageMode === 'ALL_TCG') return true;

  if (filters.coverageMode === 'POPULAR') {
    return POPULAR_FORMATS.has(product.format);
  }

  const categoryIds = FORMAT_TO_CATEGORIES[product.format] ?? ['pokemon-other-tcg'];
  if (categoryIds.some((id) => filters.customCategoryIds.includes(id))) return true;
  if (filters.includeOtherTcgProducts && categoryIds.includes('pokemon-other-tcg')) return true;
  return false;
}
