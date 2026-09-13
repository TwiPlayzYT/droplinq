import { allPokemonCenterLeafCategories } from '@/data/pokemon-center-filters';
import { Product, ProductFormat } from '@/types/dropdex';

/**
 * Curated placeholders for every Pokémon Center Filter leaf category.
 * These fill Stock → Catalog for All TCG until live Supabase / scanner rows exist.
 * Do not invent "last seen in stock" times — leave soldOutAt / lastSeenAt unset.
 * Do not attach TCGplayer CDN images — wrong IDs show other games' art.
 */
const searchUrl = (query: string) =>
  `https://www.pokemoncenter.com/en-ca/search/${encodeURIComponent(query)}`;

const formatForCategory = (categoryId: string): ProductFormat => {
  if (categoryId === 'pokemon-pc-etb') return 'etb';
  if (categoryId === 'pokemon-upc') return 'upc';
  if (categoryId.includes('bundle')) return 'booster-bundle';
  if (categoryId.includes('box') && !categoryId.includes('collection')) return 'booster-box';
  return 'etb';
};

type SeedSpec = {
  categoryId: string;
  title: string;
  search: string;
  releaseDate: string;
};

/** At least one real-world-shaped SKU per Filter leaf so All TCG is complete. */
const SPECS: SeedSpec[] = [
  {
    categoryId: 'pokemon-pc-etb',
    title: 'Pokémon TCG: Prismatic Evolutions Pokémon Center Elite Trainer Box',
    search: 'prismatic evolutions pokemon center elite trainer box',
    releaseDate: '2025-01-17',
  },
  {
    categoryId: 'pokemon-premium-collections',
    title: 'Pokémon TCG: Premium Collection',
    search: 'pokemon tcg premium collection',
    releaseDate: '2025-11-14',
  },
  {
    categoryId: 'pokemon-upc',
    title: 'Pokémon TCG: Mega Charizard X ex Ultra-Premium Collection',
    search: 'mega charizard x ex ultra premium collection',
    releaseDate: '2025-11-14',
  },
  {
    categoryId: 'pokemon-major-special',
    title: 'Pokémon TCG: 30th Celebration Poster Collection',
    search: '30th celebration poster collection',
    releaseDate: '2026-09-16',
  },
  {
    categoryId: 'pokemon-collection-boxes',
    title: 'Pokémon TCG: Collection Box',
    search: 'pokemon tcg collection box',
    releaseDate: '2025-08-01',
  },
  {
    categoryId: 'pokemon-special-collections',
    title: 'Pokémon TCG: Special Collection',
    search: 'pokemon tcg special collection',
    releaseDate: '2025-07-18',
  },
  {
    categoryId: 'pokemon-poster-collections',
    title: 'Pokémon TCG: Ascended Heroes Premium Poster Collection—Mega Lucario',
    search: 'ascended heroes premium poster collection mega lucario',
    releaseDate: '2025-09-05',
  },
  {
    categoryId: 'pokemon-sticker-collections',
    title: 'Pokémon TCG: Ascended Heroes Tech Sticker Collection',
    search: 'ascended heroes tech sticker collection',
    releaseDate: '2025-06-20',
  },
  {
    categoryId: 'pokemon-pin-collections',
    title: 'Pokémon TCG: Pin Collection',
    search: 'pokemon tcg pin collection',
    releaseDate: '2025-05-09',
  },
  {
    categoryId: 'pokemon-figure-collections',
    title: 'Pokémon TCG: Figure Collection',
    search: 'pokemon tcg figure collection',
    releaseDate: '2025-04-11',
  },
  {
    categoryId: 'pokemon-mini-tins',
    title: 'Pokémon TCG: Mini Tin',
    search: 'pokemon tcg mini tin',
    releaseDate: '2025-03-14',
  },
  {
    categoryId: 'pokemon-collector-tins',
    title: 'Pokémon TCG: Collector Tin',
    search: 'pokemon tcg collector tin',
    releaseDate: '2025-02-21',
  },
  {
    categoryId: 'pokemon-premium-tins',
    title: 'Pokémon TCG: Premium Tin',
    search: 'pokemon tcg premium tin',
    releaseDate: '2025-01-17',
  },
  {
    categoryId: 'pokemon-collector-chests',
    title: 'Pokémon TCG: Collector Chest',
    search: 'pokemon tcg collector chest',
    releaseDate: '2024-12-06',
  },
  {
    categoryId: 'pokemon-build-battle',
    title: 'Pokémon TCG: Build & Battle Box',
    search: 'pokemon tcg build and battle box',
    releaseDate: '2025-09-26',
  },
  {
    categoryId: 'pokemon-battle-decks',
    title: 'Pokémon TCG: Battle Deck',
    search: 'pokemon tcg battle deck',
    releaseDate: '2025-08-22',
  },
  {
    categoryId: 'pokemon-league-battle-decks',
    title: 'Pokémon TCG: League Battle Deck',
    search: 'pokemon tcg league battle deck',
    releaseDate: '2025-07-25',
  },
  {
    categoryId: 'pokemon-pc-exclusives',
    title: 'Pokémon TCG: Shrouded Fable Pokémon Center Elite Trainer Box',
    search: 'shrouded fable pokemon center elite trainer box',
    releaseDate: '2024-08-02',
  },
  {
    categoryId: 'pokemon-holiday',
    title: 'Pokémon TCG: Holiday Calendar',
    search: 'pokemon tcg holiday calendar',
    releaseDate: '2025-11-01',
  },
  {
    categoryId: 'pokemon-anniversary',
    title: 'Pokémon TCG: 30th Celebration Collection',
    search: '30th celebration pokemon tcg',
    releaseDate: '2026-02-27',
  },
  {
    categoryId: 'pokemon-limited',
    title: 'Pokémon TCG: Limited Release',
    search: 'pokemon tcg limited release pokemon center',
    releaseDate: '2025-09-12',
  },
  {
    categoryId: 'pokemon-promo-tcg',
    title: 'Pokémon TCG: Promotional Booster Bundle',
    search: 'pokemon tcg promo booster bundle',
    releaseDate: '2025-06-01',
  },
  {
    categoryId: 'pokemon-collaborations',
    title: 'Pokémon TCG: Special Collaboration Bundle',
    search: 'pokemon tcg collaboration pokemon center',
    releaseDate: '2025-08-08',
  },
  {
    categoryId: 'pokemon-other-tcg',
    title: 'Pokémon TCG: Surging Sparks Booster Box',
    search: 'surging sparks booster box',
    releaseDate: '2024-11-08',
  },
];

function seedFromSpec(spec: SeedSpec): Product {
  const category = allPokemonCenterLeafCategories.find((item) => item.id === spec.categoryId);
  const format = formatForCategory(spec.categoryId);
  return {
    id: `pc-seed-${spec.categoryId}`,
    title: spec.title,
    category: 'Trading Card Game',
    format,
    pcCategoryId: spec.categoryId,
    releaseType: 'new',
    availability: 'sold-out',
    historical: false,
    releaseDate: spec.releaseDate,
    url: searchUrl(spec.search),
    // Image comes from live Pokémon Center / monitor sync — never guess a TCGplayer id.
    imageUrl: undefined,
    detectedAt: `${spec.releaseDate}T12:00:00.000Z`,
    tags: [
      'tcg',
      'pokemon-center',
      category?.slug ?? 'tcg',
      ...(category?.name.toLowerCase().split(/\s+/) ?? []),
    ],
  };
}

/** Ensure every Filter leaf has at least one catalog row. */
export const pcCategorySeedProducts: Product[] = SPECS.map(seedFromSpec);

export function missingCategorySeedCount() {
  const covered = new Set(pcCategorySeedProducts.map((product) => product.pcCategoryId));
  return allPokemonCenterLeafCategories.filter((category) => !covered.has(category.id)).length;
}
