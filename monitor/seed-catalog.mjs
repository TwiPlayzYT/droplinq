/**
 * Baseline catalog used when Pokémon Center blocks the Render IP.
 * Live scrape / PageCrawl / device observations overwrite these rows.
 * Packshots are DropLinq-hosted under /product-photos.
 */

const photo = (id) => `https://getdroplinq.com/product-photos/${id}.jpg`;

const SEEDS = [
  {
    id: '100-10019',
    title: 'Scarlet & Violet—Prismatic Evolutions Pokémon Center Elite Trainer Box',
    format: 'etb',
    region: 'ca',
    url: 'https://www.pokemoncenter.com/en-ca/product/100-10019/pokemon-tcg-scarlet-and-violet-prismatic-evolutions-pokemon-center-elite-trainer-box',
    imageUrl: photo('593324'),
  },
  {
    id: '100-10356',
    title: 'Scarlet & Violet—Journey Together Pokémon Center Elite Trainer Box',
    format: 'etb',
    region: 'ca',
    url: 'https://www.pokemoncenter.com/en-ca/product/100-10356/pokemon-tcg-scarlet-and-violet-journey-together-pokemon-center-elite-trainer-box',
    imageUrl: photo('610929'),
  },
  {
    id: '100-10653',
    title: 'Scarlet & Violet—Destined Rivals Pokémon Center Elite Trainer Box',
    format: 'etb',
    region: 'ca',
    url: 'https://www.pokemoncenter.com/en-ca/product/100-10653/pokemon-tcg-scarlet-and-violet-destined-rivals-pokemon-center-elite-trainer-box',
    imageUrl: photo('624675'),
  },
  {
    id: '10-10447-111',
    title: 'Pokémon TCG: 30th Celebration Pokémon Center Elite Trainer Box',
    format: 'etb',
    region: 'ca',
    url: 'https://www.pokemoncenter.com/en-ca/product/10-10447-111/pokemon-tcg-30th-celebration-pokemon-center-elite-trainer-box',
    imageUrl: photo('30th-celebration-etb'),
  },
  {
    id: '290-85854',
    title: 'Scarlet & Violet—Shrouded Fable Pokémon Center Elite Trainer Box',
    format: 'etb',
    region: 'ca',
    url: 'https://www.pokemoncenter.com/en-ca/product/290-85854/pokemon-tcg-scarlet-and-violet-shrouded-fable-pokemon-center-elite-trainer-box',
    imageUrl: photo('552998'),
  },
  {
    id: '191-85953',
    title: 'Scarlet & Violet—Surging Sparks Pokémon Center Elite Trainer Box',
    format: 'etb',
    region: 'ca',
    url: 'https://www.pokemoncenter.com/en-ca/product/191-85953/pokemon-tcg-scarlet-and-violet-surging-sparks-pokemon-center-elite-trainer-box',
    imageUrl: photo('565632'),
  },
  {
    id: 'seed-prismatic-bundle',
    title: 'Scarlet & Violet—Prismatic Evolutions Booster Bundle',
    format: 'booster-bundle',
    region: 'ca',
    url: 'https://www.pokemoncenter.com/en-ca/search/prismatic%20evolutions%20booster%20bundle',
    imageUrl: photo('600518'),
  },
  {
    id: 'seed-surging-box',
    title: 'Scarlet & Violet—Surging Sparks Booster Box',
    format: 'booster-box',
    region: 'ca',
    url: 'https://www.pokemoncenter.com/en-ca/search/surging%20sparks%20booster%20box',
    imageUrl: photo('565606'),
  },
  {
    id: 'seed-charizard-upc',
    title: 'Pokémon TCG: Mega Charizard X ex Ultra-Premium Collection',
    format: 'upc',
    region: 'ca',
    url: 'https://www.pokemoncenter.com/en-ca/search/mega%20charizard%20x%20ex%20ultra%20premium%20collection',
    imageUrl: photo('648415'),
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
      imageUrl: seed.imageUrl,
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
  const existing = Object.keys(state.snapshot).length;
  await store.update((current) => {
    const seeds = buildSeedSnapshot(new Date().toISOString());
    let changed = false;
    for (const [key, seed] of Object.entries(seeds)) {
      const prev = current.snapshot[key];
      if (!prev) {
        current.snapshot[key] = seed;
        changed = true;
        continue;
      }
      if (!prev.imageUrl && seed.imageUrl) {
        current.snapshot[key] = { ...prev, imageUrl: seed.imageUrl };
        changed = true;
      }
    }
    if (changed || !current.baselineReady) {
      current.baselineReady = true;
      current.lastObservationAt = current.lastObservationAt ?? new Date().toISOString();
      current.lastObservationCount = Object.keys(current.snapshot).length;
      current.lastCheckAt = new Date().toISOString();
    }
    return current;
  });
  if (existing === 0) {
    console.log(`[monitor] Seeded ${SEEDS.length} catalog products with packshot images`);
  }
  return true;
}
