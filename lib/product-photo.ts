import { productionWebOrigin } from '@/config/app-config';

/**
 * Curated sealed-product photos hosted on DropLinq (copied into /public/product-photos).
 * These are verified Pokémon TCG packshots — never invent IDs at runtime.
 */
export function hostedProductPhotoUrl(photoId: string): string {
  const id = photoId.trim();
  // Prefer custom domain; onrender stays as a stable mirror path on the same files.
  const origin = (productionWebOrigin || 'https://getdroplinq.com').replace(/\/$/, '');
  return `${origin}/product-photos/${id}.jpg`;
}

export function isHostedProductPhotoUrl(url?: string | null): boolean {
  if (!url) return false;
  const value = url.toLowerCase();
  return value.includes('/product-photos/') && value.endsWith('.jpg');
}
