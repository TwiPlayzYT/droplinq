/**
 * Product imagery rules:
 * Prefer Pokémon Center / retailer photos. Never show TCGplayer CDN packshots as
 * seeds — those IDs collide across games and can load Magic cards for Pokémon SKUs.
 */

export function isPokemonRetailerImageUrl(url?: string | null): boolean {
  if (!url) return false;
  const value = url.toLowerCase();
  return (
    value.includes('pokemoncenter.com') ||
    value.includes('pokemon.com') ||
    (value.includes('scene7.com') && value.includes('pokemon')) ||
    value.includes('pokemonblog.com') ||
    value.includes('pokemon-center')
  );
}

export function isUntrustedSeedImageUrl(url?: string | null): boolean {
  if (!url) return false;
  const value = url.toLowerCase();
  return value.includes('tcgplayer-cdn.tcgplayer.com') || value.includes('product_images.tcgplayer.com');
}

/** Drop wrong-game CDN art; keep retailer / trusted host images. */
export function sanitizeProductImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (isUntrustedSeedImageUrl(trimmed)) return undefined;
  return trimmed;
}

/** Prefer retailer imagery; never let a TCGplayer seed override a PC photo. */
export function preferProductImageUrl(
  current?: string | null,
  incoming?: string | null,
): string | undefined {
  const a = sanitizeProductImageUrl(current);
  const b = sanitizeProductImageUrl(incoming);
  if (isPokemonRetailerImageUrl(b)) return b;
  if (isPokemonRetailerImageUrl(a)) return a;
  return b || a;
}
