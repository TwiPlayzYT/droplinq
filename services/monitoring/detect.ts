import { DetectedChange, NormalizedListing } from '@/services/monitoring/types';
import { StockStatus } from '@/types/catalog';

export function detectChanges(
  previous: Map<string, StockStatus>,
  current: NormalizedListing[],
): DetectedChange[] {
  const events: DetectedChange[] = [];

  for (const listing of current) {
    const prior = previous.get(listing.externalProductId) ?? null;
    if (!prior) {
      events.push({
        listing,
        previousStatus: null,
        kind: listing.stockStatus === 'preorder' ? 'preorder' : 'new_product',
      });
      continue;
    }
    if (prior !== 'in-stock' && listing.stockStatus === 'in-stock') {
      events.push({ listing, previousStatus: prior, kind: 'restock' });
    } else if (prior !== 'preorder' && listing.stockStatus === 'preorder') {
      events.push({ listing, previousStatus: prior, kind: 'preorder' });
    } else if (prior === 'in-stock' && listing.stockStatus === 'out-of-stock') {
      events.push({ listing, previousStatus: prior, kind: 'sold_out' });
    }
  }

  return events;
}
