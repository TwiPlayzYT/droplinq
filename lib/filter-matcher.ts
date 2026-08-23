import {
  allPokemonCenterLeafCategories,
  popularPokemonCenterCategoryIds,
} from '@/data/pokemon-center-filters';
import { ClassifiedProductSignals, FilterPreferences } from '@/types/filters';
import { Product } from '@/types/dropdex';

/** Map a local/legacy Product into classification signals used by coverage matching. */
export function signalsFromLegacyProduct(product: Product): ClassifiedProductSignals {
  const fromExplicit = product.pcCategoryId
    ? allPokemonCenterLeafCategories.filter((category) => category.id === product.pcCategoryId)
    : [];
  const matched =
    fromExplicit.length > 0
      ? fromExplicit
      : allPokemonCenterLeafCategories.filter((category) =>
          category.legacyFormats?.includes(product.format),
        );
  const categoryIds = matched.map((category) => category.id);
  const isPopular = matched.some((category) => category.isPopular);
  const isOther = categoryIds.length === 0;

  return {
    id: product.id,
    retailerId: 'pokemon-center',
    regionId: 'ca',
    tcgId: 'pokemon',
    isTcgProduct: product.category === 'Trading Card Game' && !product.tags.includes('merch'),
    classificationStatus: isOther ? 'needs_review' : 'classified',
    primaryCategoryId: categoryIds[0] ?? 'pokemon-other-tcg',
    subcategoryId: categoryIds[0] ?? 'pokemon-other-tcg',
    categoryIds: isOther ? ['pokemon-other-tcg'] : categoryIds,
    tagIds: [
      'tag-pokemon',
      'tag-tcg',
      'tag-sealed',
      ...(isPopular ? ['tag-popular'] : []),
      ...(isOther ? ['tag-other'] : []),
    ],
    isPopular,
    format: product.format,
    releaseType: product.releaseType,
    categoryLabel: product.category,
  };
}

function matchesReleaseType(product: ClassifiedProductSignals, filters: FilterPreferences) {
  if (!product.releaseType) return true;
  if (product.releaseType === 'new') return filters.includeNewReleases;
  if (product.releaseType === 'restock') return filters.includeRestocks;
  return filters.includePreorders;
}

/**
 * Core coverage matching for Pokémon Center (and future retailers with the same shape).
 * ALL_TCG does not require a known detailed category — only qualifying TCG products.
 * @param options.ignoreReleaseType — catalog listing should show coverage products even when
 *   only some stock-event toggles are enabled (those toggles gate alerts, not the catalog).
 */
export function matchesCoverage(
  product: ClassifiedProductSignals,
  filters: FilterPreferences,
  options?: { ignoreReleaseType?: boolean },
): boolean {
  if (product.classificationStatus === 'excluded') return false;
  if (filters.retailerId && product.retailerId !== filters.retailerId) return false;
  if (filters.tcgId && product.tcgId !== filters.tcgId) return false;
  if (!product.isTcgProduct) return false;
  if (!options?.ignoreReleaseType && !matchesReleaseType(product, filters)) return false;

  if (filters.coverageMode === 'ALL_TCG') {
    return true;
  }

  if (filters.coverageMode === 'POPULAR') {
    if (product.isPopular) return true;
    if (product.tagIds.includes('tag-popular')) return true;
    return product.categoryIds.some((id) => popularPokemonCenterCategoryIds.includes(id));
  }

  // CUSTOM — match selected leaf categories; OTHER covers unclassified / fallback TCG only.
  const selected = new Set(filters.customCategoryIds);
  if (product.categoryIds.some((id) => selected.has(id))) return true;

  const isOtherBucket =
    product.categoryIds.includes('pokemon-other-tcg') ||
    product.classificationStatus === 'needs_review' ||
    product.classificationStatus === 'unknown';

  if (filters.includeOtherTcgProducts && isOtherBucket) return true;
  if (selected.has('pokemon-other-tcg') && isOtherBucket) return true;

  return false;
}

export function matchesFilters(product: Product, filters: FilterPreferences): boolean {
  return matchesCoverage(signalsFromLegacyProduct(product), filters);
}

/** Coverage only (Popular / All TCG / Custom) — for Stock catalog listing. */
export function matchesCatalogCoverage(product: Product, filters: FilterPreferences): boolean {
  return matchesCoverage(signalsFromLegacyProduct(product), filters, {
    ignoreReleaseType: true,
  });
}

export function categoryNamesForProduct(product: Product): string[] {
  const signals = signalsFromLegacyProduct(product);
  const names = allPokemonCenterLeafCategories
    .filter((category) => signals.categoryIds.includes(category.id))
    .map((category) => category.name);
  if (names.length) return names;
  if (signals.classificationStatus === 'needs_review') {
    return ['Other Pokémon Center TCG Products'];
  }
  return ['Pokémon TCG'];
}

export function getMatchingReasons(product: Product, filters: FilterPreferences): string[] {
  if (!matchesFilters(product, filters)) return [];
  if (filters.coverageMode === 'ALL_TCG') return ['All Pokémon Center TCG'];
  if (filters.coverageMode === 'POPULAR') return ['Popular Drops'];
  return categoryNamesForProduct(product);
}
