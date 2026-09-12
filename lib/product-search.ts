import { categoryNamesForProduct } from '@/lib/filter-matcher';
import { Product } from '@/types/dropdex';

/** Fold accents/punctuation so "Pitch Black" matches titles with em-dashes, accents, etc. */
export function normalizeSearchText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[—–−-]+/g, ' ')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * True when every query token appears somewhere in the product’s searchable text.
 * Empty query matches everything.
 */
export function matchesProductSearch(product: Product, query: string) {
  const trimmed = query.trim();
  if (!trimmed) return true;

  const categories = categoryNamesForProduct(product);
  const haystack = normalizeSearchText(
    [product.title, product.id, product.category, product.format, ...product.tags, ...categories].join(
      ' ',
    ),
  );
  const terms = normalizeSearchText(trimmed).split(' ').filter(Boolean);
  if (!terms.length) return true;
  return terms.every((term) => haystack.includes(term));
}
