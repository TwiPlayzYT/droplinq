/**
 * Baseline catalog used when Pokémon Center blocks the Render IP.
 * Live scrape / PageCrawl / device observations overwrite these rows.
 * Image URLs point at DropLinq-hosted format art until retailer photos arrive.
 */

const ART = {
  etb: 'https://droplinq-web.onrender.com/product-art/etb.png',
  'booster-bundle': 'https://droplinq-web.onrender.com/product-art/booster-bundle.png',
  'booster-box': 'https://droplinq-web.onrender.com/product-art/booster-box.png',
  upc: 'https://droplinq-web.onrender.com/product-art/upc.png',
};

const SEEDS = [
  {
    id: '100-10019',
    title: 'Scarlet & Violet—Prismatic Evolutions Pokémon Center Elite Trainer Box',
    format: 'etb',
    region: 'ca',
    url: 'https://www.pokemoncenter.com/en-ca/product/100-10019/pokemon-tcg-scarlet-and-violet-prismatic-evolutions-pokemon-center-elite-trainer-box',
  },
  {
    id: '100-10356',
    title: 'Scarlet & Violet—Journey Together Pokémon Center Elite Trainer Box',
    format: 'etb',
    region: 'ca',
    url: 'https://www.pokemoncenter.com/en-ca/product/100-10356/pokemon-tcg-scarlet-and-violet-journey-together-pokemon-center-elite-trainer-box',
  },
  {
    id: '100-10653',
    title: 'Scarlet & Violet—Destined Rivals Pokémon Center Elite Trainer Box',
    format: 'etb',
    region: 'ca',
    url: 'https://www.pokemoncenter.com/en-ca/product/100-10653/pokemon-tcg-scarlet-and-violet-destined-rivals-pokemon-center-elite-trainer-box',
  },
  {
    id: '10-10447-111',
    title: 'Pokémon TCG: 30th Celebration Pokémon Center Elite Trainer Box',
    format: 'etb',
    region: 'ca',
    url: 'https://www.pokemoncenter.com/en-ca/product/10-10447-111/pokemon-tcg-30th-celebration-pokemon-center-elite-trainer-box',
    imageUrl:
      'https://pokemonblog.com/wp-content/uploads/2026/07/pokemon_tcg_30th_celebration_pokemon_center_elite_trainer_box.jpg',
  },
  {
    id: '290-85854',
    title: 'Scarlet & Violet—Shrouded Fable Pokémon Center Elite Trainer Box',
    format: 'etb',
    region: 'ca',
    url: 'https://www.pokemoncenter.com/en-ca/product/290-85854/pokemon-tcg-scarlet-and-violet-shrouded-fable-pokemon-center-elite-trainer-box',
  },
  {
    id: '191-85953',
    title: 'Scarlet & Violet—Surging Sparks Pokémon Center Elite Trainer Box',
    format: 'etb',
    region: 'ca',
    url: 'https://www.pokemoncenter.com/en-ca/product/191-85953/pokemon-tcg-scarlet-and-violet-surging-sparks-pokemon-center-elite-trainer-box',
  },
  {
    id: 'seed-prismatic-bundle',
    title: 'Scarlet & Violet—Prismatic Evolutions Booster Bundle',
    format: 'booster-bundle',
    region: 'ca',
    url: 'https://www.pokemoncenter.com/en-ca/search/prismatic%20evolutions%20booster%20bundle',
  },
  {
    id: 'seed-surging-box',
    title: 'Scarlet & Violet—Surging Sparks Booster Box',
    format: 'booster-box',
    region: 'ca',
    url: 'https://www.pokemoncenter.com/en-ca/search/surging%20sparks%20booster%20box',
  },
  {
    id: 'seed-charizard-upc',
    title: 'Pokémon TCG: Mega Charizard X ex Ultra-Premium Collection',
    format: 'upc',
    region: 'ca',
    url: 'https://www.pokemoncenter.com/en-ca/search/mega%20charizard%20x%20ex%20ultra%20premium%20collection',
  },
];

export function buildSeedSnapshot(now = new Date().toISOString()) {
  const snapshot = {};
  for (const seed of SEEDS) {
    const key = `${seed.region}:${seed.id}`;
    snapshot[key] = {
      id: seed.id,
      title: seed.title,
      category: 'Trading Card Game',
      format: seed.format,
      region: seed.region,
      releaseType: 'new',
      url: seed.url,
      imageUrl: seed.imageUrl ?? ART[seed.format] ?? ART.etb,
      detectedAt: now,
      tags: ['tcg', seed.format, 'seed'],
      inStock: false,
      missingPolls: 0,
      lastSeenAt: now,
    };
  }
  return snapshot;
}

export async function ensureSeedCatalog(store) {
  const state = store.getState();
  if (Object.keys(state.snapshot).length > 0) return false;

  const now = new Date().toISOString();
  await store.update((current) => {
    if (Object.keys(current.snapshot).length > 0) return current;
    current.snapshot = buildSeedSnapshot(now);
    current.baselineReady = true;
    current.lastObservationAt = now;
    current.lastObservationCount = Object.keys(current.snapshot).length;
    current.lastCheckAt = now;
    return current;
  });
  console.log(`[monitor] Seeded ${SEEDS.length} catalog products for images while scrape is blocked`);
  return true;
}
