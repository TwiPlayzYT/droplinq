import {
  CoverageMode,
  FilterCategory,
  FilterCategoryGroup,
  FilterPreferences,
} from '@/types/filters';

/** Client catalog for Pokémon Center until Supabase category rows are loaded. */
export const POKEMON_CENTER_RETAILER_ID = 'pokemon-center';
export const POKEMON_TCG_ID = 'pokemon';

const leaf = (
  partial: Omit<FilterCategory, 'parentId'> & { parentId: string },
): FilterCategory => partial;

export const pokemonCenterFilterGroups: FilterCategoryGroup[] = [
  {
    key: 'POPULAR',
    id: 'pokemon-group-popular',
    title: 'Popular Drops',
    categories: [
      leaf({
        id: 'pokemon-pc-etb',
        name: 'Pokémon Center Elite Trainer Boxes',
        slug: 'pc-etb',
        parentId: 'pokemon-group-popular',
        groupKey: 'POPULAR',
        isPopular: true,
        isOtherFallback: false,
        legacyFormats: ['etb'],
      }),
      leaf({
        id: 'pokemon-premium-collections',
        name: 'Premium Collections',
        slug: 'premium-collections',
        parentId: 'pokemon-group-popular',
        groupKey: 'POPULAR',
        isPopular: true,
        isOtherFallback: false,
      }),
      leaf({
        id: 'pokemon-upc',
        name: 'Ultra-Premium Collections',
        slug: 'upc',
        parentId: 'pokemon-group-popular',
        groupKey: 'POPULAR',
        isPopular: true,
        isOtherFallback: false,
        legacyFormats: ['upc'],
      }),
      leaf({
        id: 'pokemon-major-special',
        name: 'Major Special Releases',
        slug: 'major-special',
        parentId: 'pokemon-group-popular',
        groupKey: 'POPULAR',
        isPopular: true,
        isOtherFallback: false,
      }),
    ],
  },
  {
    key: 'COLLECTIONS',
    id: 'pokemon-group-collections',
    title: 'Collections & Special Products',
    categories: [
      leaf({
        id: 'pokemon-collection-boxes',
        name: 'Collection Boxes',
        slug: 'collection-boxes',
        parentId: 'pokemon-group-collections',
        groupKey: 'COLLECTIONS',
        isPopular: false,
        isOtherFallback: false,
      }),
      leaf({
        id: 'pokemon-special-collections',
        name: 'Special Collections',
        slug: 'special-collections',
        parentId: 'pokemon-group-collections',
        groupKey: 'COLLECTIONS',
        isPopular: false,
        isOtherFallback: false,
      }),
      leaf({
        id: 'pokemon-poster-collections',
        name: 'Poster Collections',
        slug: 'poster-collections',
        parentId: 'pokemon-group-collections',
        groupKey: 'COLLECTIONS',
        isPopular: false,
        isOtherFallback: false,
      }),
      leaf({
        id: 'pokemon-sticker-collections',
        name: 'Sticker Collections',
        slug: 'sticker-collections',
        parentId: 'pokemon-group-collections',
        groupKey: 'COLLECTIONS',
        isPopular: false,
        isOtherFallback: false,
      }),
      leaf({
        id: 'pokemon-pin-collections',
        name: 'Pin Collections',
        slug: 'pin-collections',
        parentId: 'pokemon-group-collections',
        groupKey: 'COLLECTIONS',
        isPopular: false,
        isOtherFallback: false,
      }),
      leaf({
        id: 'pokemon-figure-collections',
        name: 'Figure Collections',
        slug: 'figure-collections',
        parentId: 'pokemon-group-collections',
        groupKey: 'COLLECTIONS',
        isPopular: false,
        isOtherFallback: false,
      }),
    ],
  },
  {
    key: 'TINS',
    id: 'pokemon-group-tins',
    title: 'Tins & Collector Products',
    categories: [
      leaf({
        id: 'pokemon-mini-tins',
        name: 'Mini Tins',
        slug: 'mini-tins',
        parentId: 'pokemon-group-tins',
        groupKey: 'TINS',
        isPopular: false,
        isOtherFallback: false,
      }),
      leaf({
        id: 'pokemon-collector-tins',
        name: 'Collector Tins',
        slug: 'collector-tins',
        parentId: 'pokemon-group-tins',
        groupKey: 'TINS',
        isPopular: false,
        isOtherFallback: false,
      }),
      leaf({
        id: 'pokemon-premium-tins',
        name: 'Premium Tins',
        slug: 'premium-tins',
        parentId: 'pokemon-group-tins',
        groupKey: 'TINS',
        isPopular: false,
        isOtherFallback: false,
      }),
      leaf({
        id: 'pokemon-collector-chests',
        name: 'Collector Chests',
        slug: 'collector-chests',
        parentId: 'pokemon-group-tins',
        groupKey: 'TINS',
        isPopular: false,
        isOtherFallback: false,
      }),
    ],
  },
  {
    key: 'DECKS',
    id: 'pokemon-group-decks',
    title: 'Decks & Gameplay Products',
    categories: [
      leaf({
        id: 'pokemon-build-battle',
        name: 'Build & Battle Products',
        slug: 'build-battle',
        parentId: 'pokemon-group-decks',
        groupKey: 'DECKS',
        isPopular: false,
        isOtherFallback: false,
      }),
      leaf({
        id: 'pokemon-battle-decks',
        name: 'Battle Decks',
        slug: 'battle-decks',
        parentId: 'pokemon-group-decks',
        groupKey: 'DECKS',
        isPopular: false,
        isOtherFallback: false,
      }),
      leaf({
        id: 'pokemon-league-battle-decks',
        name: 'League Battle Decks',
        slug: 'league-battle-decks',
        parentId: 'pokemon-group-decks',
        groupKey: 'DECKS',
        isPopular: false,
        isOtherFallback: false,
      }),
    ],
  },
  {
    key: 'SPECIAL',
    id: 'pokemon-group-special',
    title: 'Special Releases',
    categories: [
      leaf({
        id: 'pokemon-pc-exclusives',
        name: 'Pokémon Center Exclusives',
        slug: 'pc-exclusives',
        parentId: 'pokemon-group-special',
        groupKey: 'SPECIAL',
        isPopular: true,
        isOtherFallback: false,
      }),
      leaf({
        id: 'pokemon-holiday',
        name: 'Holiday Releases',
        slug: 'holiday',
        parentId: 'pokemon-group-special',
        groupKey: 'SPECIAL',
        isPopular: false,
        isOtherFallback: false,
      }),
      leaf({
        id: 'pokemon-anniversary',
        name: 'Anniversary Products',
        slug: 'anniversary',
        parentId: 'pokemon-group-special',
        groupKey: 'SPECIAL',
        isPopular: false,
        isOtherFallback: false,
      }),
      leaf({
        id: 'pokemon-limited',
        name: 'Limited Releases',
        slug: 'limited',
        parentId: 'pokemon-group-special',
        groupKey: 'SPECIAL',
        isPopular: false,
        isOtherFallback: false,
      }),
      leaf({
        id: 'pokemon-promo-tcg',
        name: 'Promotional TCG Products',
        slug: 'promo-tcg',
        parentId: 'pokemon-group-special',
        groupKey: 'SPECIAL',
        isPopular: false,
        isOtherFallback: false,
      }),
      leaf({
        id: 'pokemon-collaborations',
        name: 'Special Collaborations',
        slug: 'collaborations',
        parentId: 'pokemon-group-special',
        groupKey: 'SPECIAL',
        isPopular: false,
        isOtherFallback: false,
      }),
    ],
  },
  {
    key: 'OTHER',
    id: 'pokemon-group-other',
    title: 'Other',
    categories: [
      {
        id: 'pokemon-other-tcg',
        name: 'Other Pokémon Center TCG Products',
        slug: 'other-tcg',
        parentId: null,
        groupKey: 'OTHER',
        isPopular: false,
        isOtherFallback: true,
        legacyFormats: ['booster-bundle', 'booster-box'],
      },
    ],
  },
];

export const allPokemonCenterLeafCategories: FilterCategory[] =
  pokemonCenterFilterGroups.flatMap((group) => group.categories);

export const popularPokemonCenterCategoryIds = allPokemonCenterLeafCategories
  .filter((category) => category.isPopular)
  .map((category) => category.id);

export const coverageModeCopy: Record<
  CoverageMode,
  { title: string; emoji: string; description: string }
> = {
  POPULAR: {
    title: 'Popular Drops',
    emoji: '🔥',
    description: 'Alerts for the most popular Pokémon Center TCG releases.',
  },
  ALL_TCG: {
    title: 'All Pokémon Center TCG',
    emoji: '🎴',
    description: 'Alerts for every qualifying Pokémon TCG product on Pokémon Center.',
  },
  CUSTOM: {
    title: 'Custom',
    emoji: '🎯',
    description: 'Choose exact Pokémon Center TCG product types.',
  },
};

export const defaultFilterPreferences: FilterPreferences = {
  retailerId: POKEMON_CENTER_RETAILER_ID,
  tcgId: POKEMON_TCG_ID,
  coverageMode: 'ALL_TCG',
  customCategoryIds: [],
  includeOtherTcgProducts: true,
  includeNewReleases: true,
  includeRestocks: true,
  includePreorders: true,
};

export function migrateLegacyFilters(raw: Partial<FilterPreferences> | undefined): FilterPreferences {
  const base = { ...defaultFilterPreferences, ...raw };
  if (!raw?.coverageMode && raw?.formats?.length) {
    return {
      ...base,
      coverageMode: 'CUSTOM',
      customCategoryIds: allPokemonCenterLeafCategories
        .filter((category) =>
          category.legacyFormats?.some((format) => raw.formats?.includes(format)),
        )
        .map((category) => category.id),
      includeOtherTcgProducts: true,
    };
  }
  return {
    ...defaultFilterPreferences,
    ...base,
    customCategoryIds: base.customCategoryIds ?? [],
  };
}
