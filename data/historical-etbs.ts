import { pcCategorySeedProducts } from '@/data/pc-category-seeds';
import { Product, ProductFormat } from '@/types/dropdex';

const formatTags: Record<ProductFormat, string[]> = {
  etb: ['elite trainer box', 'pokemon center etb'],
  'booster-bundle': ['booster bundle'],
  'booster-box': ['booster box', 'display'],
  upc: ['ultra premium collection', 'upc'],
};

const makeProduct = (
  format: ProductFormat,
  id: string,
  title: string,
  releaseDate: string,
  url: string,
  imageId: string,
): Product => ({
  id,
  title,
  category: 'Trading Card Game',
  format,
  releaseType: 'new',
  availability: 'sold-out',
  // All seeded TCG products are live-watched — PC restocks older drops too.
  historical: false,
  releaseDate,
  url,
  imageUrl: `https://tcgplayer-cdn.tcgplayer.com/product/${imageId}_in_1000x1000.jpg`,
  detectedAt: new Date().toISOString(),
  tags: ['tcg', ...formatTags[format], ...title.toLowerCase().split(/\s+/)],
});

const productUrl = (id: string, slug: string) =>
  `https://www.pokemoncenter.com/en-ca/product/${id}/${slug}`;

// Items without a confirmed Pokémon Center SKU open a PC search for the product.
const searchUrl = (query: string) =>
  `https://www.pokemoncenter.com/en-ca/search/${encodeURIComponent(query)}`;

const makeEtb = (
  id: string,
  title: string,
  releaseDate: string,
  slug: string,
  imageId: string,
): Product => makeProduct('etb', id, title, releaseDate, productUrl(id, slug), imageId);

const makeBundle = (
  imageId: string,
  title: string,
  releaseDate: string,
  searchQuery: string,
): Product =>
  makeProduct(
    'booster-bundle',
    `tcg-bundle-${imageId}`,
    title,
    releaseDate,
    searchUrl(searchQuery),
    imageId,
  );

const makeBoosterBox = (
  imageId: string,
  title: string,
  releaseDate: string,
  searchQuery: string,
): Product =>
  makeProduct(
    'booster-box',
    `tcg-box-${imageId}`,
    title,
    releaseDate,
    searchUrl(searchQuery),
    imageId,
  );

const makeUpc = (
  imageId: string,
  title: string,
  releaseDate: string,
  searchQuery: string,
): Product =>
  makeProduct(
    'upc',
    `tcg-upc-${imageId}`,
    title,
    releaseDate,
    searchUrl(searchQuery),
    imageId,
  );

/**
 * Known Pokémon Center TCG products (older + current sets), grouped by set.
 * Keep each set's products consecutive (ETB, booster bundle, booster box, UPC).
 * Every entry is live-monitored — older “out of print” drops can come back.
 * Brand-new seeds that need a curated image/URL also live in watchedSoldOutProducts.
 */
export const historicalProducts: Product[] = [
  // Shrouded Fable — 2024-08-02 (special set: no booster box)
  makeEtb(
    '290-85854',
    'Scarlet & Violet—Shrouded Fable Pokémon Center Elite Trainer Box',
    '2024-08-02',
    'pokemon-tcg-scarlet-and-violet-shrouded-fable-pokemon-center-elite-trainer-box',
    '552998',
  ),
  makeBundle(
    '553031',
    'Scarlet & Violet—Shrouded Fable Booster Bundle',
    '2024-08-02',
    'shrouded fable booster bundle',
  ),

  // Stellar Crown — 2024-09-13
  makeEtb(
    '190-85923',
    'Scarlet & Violet—Stellar Crown Pokémon Center Elite Trainer Box',
    '2024-09-13',
    'pokemon-tcg-scarlet-and-violet-stellar-crown-pokemon-center-elite-trainer-box',
    '557340',
  ),
  makeBundle(
    '557345',
    'Scarlet & Violet—Stellar Crown Booster Bundle',
    '2024-09-13',
    'stellar crown booster bundle',
  ),
  makeBoosterBox(
    '557354',
    'Scarlet & Violet—Stellar Crown Booster Box',
    '2024-09-13',
    'stellar crown booster box',
  ),

  // Surging Sparks — 2024-11-08
  makeEtb(
    '191-85953',
    'Scarlet & Violet—Surging Sparks Pokémon Center Elite Trainer Box',
    '2024-11-08',
    'pokemon-tcg-scarlet-and-violet-surging-sparks-pokemon-center-elite-trainer-box',
    '565632',
  ),
  makeBundle(
    '565629',
    'Scarlet & Violet—Surging Sparks Booster Bundle',
    '2024-11-08',
    'surging sparks booster bundle',
  ),
  makeBoosterBox(
    '565606',
    'Scarlet & Violet—Surging Sparks Booster Box',
    '2024-11-08',
    'surging sparks booster box',
  ),

  // Prismatic Evolutions — 2025-01-17 (special set: no booster box)
  makeEtb(
    '100-10019',
    'Scarlet & Violet—Prismatic Evolutions Pokémon Center Elite Trainer Box',
    '2025-01-17',
    'pokemon-tcg-scarlet-and-violet-prismatic-evolutions-pokemon-center-elite-trainer-box',
    '593324',
  ),
  makeBundle(
    '600518',
    'Scarlet & Violet—Prismatic Evolutions Booster Bundle',
    '2025-01-17',
    'prismatic evolutions booster bundle',
  ),

  // Journey Together — 2025-03-28
  makeEtb(
    '100-10356',
    'Scarlet & Violet—Journey Together Pokémon Center Elite Trainer Box',
    '2025-03-28',
    'pokemon-tcg-scarlet-and-violet-journey-together-pokemon-center-elite-trainer-box',
    '610929',
  ),
  makeBundle(
    '610953',
    'Scarlet & Violet—Journey Together Booster Bundle',
    '2025-03-28',
    'journey together booster bundle',
  ),
  makeBoosterBox(
    '610931',
    'Scarlet & Violet—Journey Together Booster Box',
    '2025-03-28',
    'journey together booster box',
  ),

  // Destined Rivals — 2025-05-30
  makeEtb(
    '100-10653',
    'Scarlet & Violet—Destined Rivals Pokémon Center Elite Trainer Box',
    '2025-05-30',
    'pokemon-tcg-scarlet-and-violet-destined-rivals-pokemon-center-elite-trainer-box',
    '624675',
  ),
  makeBundle(
    '625670',
    'Scarlet & Violet—Destined Rivals Booster Bundle',
    '2025-05-30',
    'destined rivals booster bundle',
  ),
  makeBoosterBox(
    '624679',
    'Scarlet & Violet—Destined Rivals Booster Box',
    '2025-05-30',
    'destined rivals booster box',
  ),

  // Black Bolt — 2025-07-18 (special set: no booster box)
  makeEtb(
    '10-10037-118',
    'Scarlet & Violet—Black Bolt Pokémon Center Elite Trainer Box',
    '2025-07-18',
    'pokemon-tcg-scarlet-and-violet-black-bolt-pokemon-center-elite-trainer-box',
    '630687',
  ),
  makeBundle(
    '630431',
    'Scarlet & Violet—Black Bolt Booster Bundle',
    '2025-07-18',
    'black bolt booster bundle',
  ),

  // White Flare — 2025-07-18 (special set: no booster box)
  makeEtb(
    '10-10037-117',
    'Scarlet & Violet—White Flare Pokémon Center Elite Trainer Box',
    '2025-07-18',
    'pokemon-tcg-scarlet-and-violet-white-flare-pokemon-center-elite-trainer-box',
    '630688',
  ),
  makeBundle(
    '630696',
    'Scarlet & Violet—White Flare Booster Bundle',
    '2025-07-18',
    'white flare booster bundle',
  ),

  // Mega Evolution — 2025-09-26
  makeEtb(
    '10-10047-108',
    'Mega Evolution Pokémon Center Elite Trainer Box—Mega Lucario',
    '2025-09-26',
    'pokemon-tcg-mega-evolution-pokemon-center-elite-trainer-box-mega-lucario',
    '644282',
  ),
  makeEtb(
    '10-10047-120',
    'Mega Evolution Pokémon Center Elite Trainer Box—Mega Gardevoir',
    '2025-09-26',
    'pokemon-tcg-mega-evolution-pokemon-center-elite-trainer-box-mega-gardevoir',
    '648415',
  ),
  makeBundle(
    '644362',
    'Mega Evolution Booster Bundle',
    '2025-09-26',
    'mega evolution booster bundle',
  ),
  makeBoosterBox(
    '644298',
    'Mega Evolution Booster Box',
    '2025-09-26',
    'mega evolution booster box',
  ),

  // Phantasmal Flames — 2025-11-14
  makeEtb(
    '10-10186-109',
    'Mega Evolution—Phantasmal Flames Pokémon Center Elite Trainer Box',
    '2025-11-14',
    'pokemon-tcg-mega-evolution-phantasmal-flames-pokemon-center-elite-trainer-box',
    '654135',
  ),
  makeBundle(
    '654160',
    'Mega Evolution—Phantasmal Flames Booster Bundle',
    '2025-11-14',
    'phantasmal flames booster bundle',
  ),
  makeBoosterBox(
    '654137',
    'Mega Evolution—Phantasmal Flames Booster Box',
    '2025-11-14',
    'phantasmal flames booster box',
  ),
  makeUpc(
    '654213',
    'Mega Charizard X ex Ultra-Premium Collection',
    '2025-11-14',
    'mega charizard x ex ultra premium collection',
  ),

  // Ascended Heroes — 2026-01-30 (special set: no booster box)
  makeEtb(
    '10-10315-108',
    'Mega Evolution—Ascended Heroes Pokémon Center Elite Trainer Box',
    '2026-01-30',
    'pokemon-tcg-mega-evolution-ascended-heroes-pokemon-center-elite-trainer-box',
    '668497',
  ),
  makeBundle(
    '668541',
    'Mega Evolution—Ascended Heroes Booster Bundle',
    '2026-01-30',
    'ascended heroes booster bundle',
  ),

  // Perfect Order — 2026-03-27
  makeEtb(
    '10-10372-109',
    'Mega Evolution—Perfect Order Pokémon Center Elite Trainer Box',
    '2026-03-27',
    'pokemon-tcg-mega-evolution-perfect-order-pokemon-center-elite-trainer-box',
    '672404',
  ),
  makeBundle(
    '672396',
    'Mega Evolution—Perfect Order Booster Bundle',
    '2026-03-27',
    'perfect order booster bundle',
  ),
  makeBoosterBox(
    '672394',
    'Mega Evolution—Perfect Order Booster Box',
    '2026-03-27',
    'perfect order booster box',
  ),

  // Chaos Rising — 2026-05-22
  makeEtb(
    '10-10399-112',
    'Mega Evolution—Chaos Rising Pokémon Center Elite Trainer Box',
    '2026-05-22',
    'pokemon-tcg-mega-evolution-chaos-rising-pokemon-center-elite-trainer-box',
    '684452',
  ),
  makeBundle(
    '684456',
    'Mega Evolution—Chaos Rising Booster Bundle',
    '2026-05-22',
    'chaos rising booster bundle',
  ),
  makeBoosterBox(
    '684444',
    'Mega Evolution—Chaos Rising Booster Box',
    '2026-05-22',
    'chaos rising booster box',
  ),
];

/**
 * Extra curated seeds (images / exact URLs) merged into the live watchlist.
 * Seeded sold out until the catalog scanner sees them in stock.
 */
export const watchedSoldOutProducts: Product[] = [
  {
    id: '10-10447-111',
    title: 'Pokémon TCG: 30th Celebration Pokémon Center Elite Trainer Box',
    category: 'Trading Card Game',
    format: 'etb',
    releaseType: 'preorder',
    availability: 'sold-out',
    historical: false,
    releaseDate: '2026-09-16',
    url: 'https://www.pokemoncenter.com/en-ca/product/10-10447-111/pokemon-tcg-30th-celebration-pokemon-center-elite-trainer-box',
    imageUrl:
      'https://pokemonblog.com/wp-content/uploads/2026/07/pokemon_tcg_30th_celebration_pokemon_center_elite_trainer_box.jpg',
    soldOutAt: undefined,
    detectedAt: new Date().toISOString(),
    tags: [
      'tcg',
      'elite trainer box',
      'pokemon center etb',
      '30th',
      'celebration',
      'preorder',
    ],
  },
];

export const seededEtbs: Product[] = [
  ...historicalProducts,
  ...watchedSoldOutProducts,
  ...pcCategorySeedProducts,
];
