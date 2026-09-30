import { allPokemonCenterLeafCategories } from '@/data/pokemon-center-filters';
import { hostedProductPhotoUrl } from '@/lib/product-photo';
import { Product, ProductFormat } from '@/types/dropdex';

/**
 * Curated placeholders for every Pokémon Center Filter leaf category.
 * These fill Stock → Catalog for All TCG until live Supabase / scanner rows exist.
 * Do not invent "last seen in stock" times — leave soldOutAt / lastSeenAt unset.
 * Packshots are DropLinq-hosted under /product-photos (never guess TCGplayer ids).
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

/** Representative curated packshot id per category leaf (files in /public/product-photos). */
const CATEGORY_PHOTO: Record<string, string> = {
  'pokemon-pc-etb': '593324',
  'pokemon-premium-collections': '690660',
  'pokemon-upc': '654213',
  'pokemon-major-special': '704153',
  'pokemon-collection-boxes': '656950',
  'pokemon-special-collections': '553002',
  'pokemon-knockout-collections': '628493',
  'pokemon-poster-collections': '668536',
  'pokemon-sticker-collections': '666909',
  'pokemon-pin-collections': '672391',
  'pokemon-figure-collections': '656487',
  'pokemon-mini-tins': '528049',
  'pokemon-collector-tins': '562357',
  'pokemon-premium-tins': '616296',
  'pokemon-collector-chests': '244727',
  'pokemon-build-battle': '644363',
  'pokemon-battle-decks': '527671',
  'pokemon-league-battle-decks': '283599',
  'pokemon-pc-exclusives': '552998',
  'pokemon-holiday': '639828',
  'pokemon-anniversary': '704189',
  'pokemon-limited': '688712',
  'pokemon-promo-tcg': '600518',
  'pokemon-collaborations': '531539',
  'pokemon-other-tcg': '565606',
};

type SeedSpec = {
  categoryId: string;
  title: string;
  search: string;
  releaseDate: string;
  photoId?: string;
  idSuffix?: string;
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
    title: 'Pokémon TCG: Mega Greninja ex Premium Collection',
    search: 'mega greninja ex premium collection',
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
    title: 'Pokémon TCG: Greninja ex & Kingdra ex Special Collection',
    search: 'greninja ex kingdra ex special collection',
    releaseDate: '2025-08-01',
  },
  {
    categoryId: 'pokemon-special-collections',
    title: 'Pokémon TCG: Greninja ex Special Illustration Collection',
    search: 'greninja ex special illustration collection',
    releaseDate: '2025-07-18',
  },
  {
    categoryId: 'pokemon-knockout-collections',
    title: 'Pokémon TCG: Knock Out Collection—Alakazam',
    search: 'knock out collection alakazam',
    releaseDate: '2025-06-13',
  },
  {
    categoryId: 'pokemon-poster-collections',
    title: 'Pokémon TCG: Ascended Heroes Premium Poster Collection—Mega Lucario',
    search: 'ascended heroes premium poster collection mega lucario',
    releaseDate: '2025-09-05',
  },
  {
    categoryId: 'pokemon-sticker-collections',
    title: 'Pokémon TCG: Ascended Heroes Tech Sticker Collection—Gastly',
    search: 'ascended heroes tech sticker collection gastly',
    releaseDate: '2025-06-20',
  },
  {
    categoryId: 'pokemon-pin-collections',
    title: 'Pokémon TCG: Ascended Heroes First Partners Deluxe Pin Collection',
    search: 'ascended heroes first partners deluxe pin collection',
    releaseDate: '2025-05-09',
  },
  {
    categoryId: 'pokemon-figure-collections',
    title: 'Pokémon TCG: Mega Lucario ex Figure Collection',
    search: 'mega lucario ex figure collection',
    releaseDate: '2025-04-11',
  },
  {
    categoryId: 'pokemon-mini-tins',
    title: 'Pokémon TCG: Paldean Fates Mini Tin',
    search: 'paldean fates mini tin',
    releaseDate: '2025-03-14',
  },
  {
    categoryId: 'pokemon-collector-tins',
    title: 'Pokémon TCG: Paradox Destinies Tin',
    search: 'paradox destinies tin',
    releaseDate: '2025-02-21',
  },
  {
    categoryId: 'pokemon-premium-tins',
    title: 'Pokémon TCG: Stacking Tin',
    search: 'pokemon tcg stacking tin',
    releaseDate: '2025-01-17',
  },
  {
    categoryId: 'pokemon-collector-chests',
    title: 'Pokémon TCG: Celebrations Collector Chest',
    search: 'celebrations collector chest',
    releaseDate: '2024-12-06',
  },
  {
    categoryId: 'pokemon-build-battle',
    title: 'Pokémon TCG: Mega Evolution Build & Battle Box',
    search: 'mega evolution build and battle box',
    releaseDate: '2025-09-26',
  },
  {
    categoryId: 'pokemon-battle-decks',
    title: 'Pokémon TCG: ex Battle Deck—Greninja ex',
    search: 'greninja ex battle deck',
    releaseDate: '2025-08-22',
  },
  {
    categoryId: 'pokemon-league-battle-decks',
    title: 'Pokémon TCG: League Battle Deck—Mew VMAX',
    search: 'mew vmax league battle deck',
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
    title: 'Pokémon TCG: 30th Celebration Ditto Premium Collection',
    search: '30th celebration ditto premium collection',
    releaseDate: '2026-02-27',
  },
  {
    categoryId: 'pokemon-limited',
    title: 'Pokémon TCG: First Partner Illustration Collection',
    search: 'first partner illustration collection',
    releaseDate: '2025-09-12',
  },
  {
    categoryId: 'pokemon-promo-tcg',
    title: 'Pokémon TCG: Prismatic Evolutions Booster Bundle',
    search: 'prismatic evolutions booster bundle',
    releaseDate: '2025-06-01',
  },
  {
    categoryId: 'pokemon-collaborations',
    title: 'Pokémon Center × Van Gogh Museum: Snorlax Double Deck Box',
    search: 'pokemon center van gogh snorlax',
    releaseDate: '2025-08-08',
  },
  {
    categoryId: 'pokemon-other-tcg',
    title: 'Pokémon TCG: Surging Sparks Booster Box',
    search: 'surging sparks booster box',
    releaseDate: '2024-11-08',
  },
];

const EXTRA_SPECS: SeedSpec[] = [
  {
    categoryId: 'pokemon-knockout-collections',
    title: 'Pokémon TCG: 30th Celebration Knock Out Collection',
    search: '30th celebration knock out collection',
    releaseDate: '2026-02-27',
    photoId: '704152',
    idSuffix: '30th',
  },
  {
    categoryId: 'pokemon-poster-collections',
    title: 'Pokémon TCG: Ascended Heroes Premium Poster Collection—Mega Gardevoir',
    search: 'ascended heroes premium poster collection mega gardevoir',
    releaseDate: '2025-09-05',
    photoId: '668537',
    idSuffix: 'gardevoir',
  },
];

function seedFromSpec(spec: SeedSpec): Product {
  const category = allPokemonCenterLeafCategories.find((item) => item.id === spec.categoryId);
  const format = formatForCategory(spec.categoryId);
  const photoId = spec.photoId ?? CATEGORY_PHOTO[spec.categoryId];
  return {
    id: `pc-seed-${spec.categoryId}${spec.idSuffix ? `-${spec.idSuffix}` : ''}`,
    title: spec.title,
    category: 'Trading Card Game',
    format,
    pcCategoryId: spec.categoryId,
    releaseType: 'new',
    availability: 'sold-out',
    historical: false,
    releaseDate: spec.releaseDate,
    url: searchUrl(spec.search),
    imageUrl: photoId
      ? hostedProductPhotoUrl(photoId)
      : hostedProductPhotoUrl(format === 'upc' ? '648415' : '593324'),
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
export const pcCategorySeedProducts: Product[] = [...SPECS, ...EXTRA_SPECS].map(seedFromSpec);

export function missingCategorySeedCount() {
  const covered = new Set(pcCategorySeedProducts.map((product) => product.pcCategoryId));
  return allPokemonCenterLeafCategories.filter((category) => !covered.has(category.id)).length;
}
