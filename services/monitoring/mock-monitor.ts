import { historicalProducts } from '@/data/historical-etbs';
import { RetailerMonitor, NormalizedListing } from '@/services/monitoring/types';
import { availabilityToStockStatus } from '@/types/catalog';

/** Local stand-in used only when DATA_MODE=mock. Never presented as live retailer data. */
export class MockDevelopmentMonitor implements RetailerMonitor {
  id = 'mock-dev';
  retailerId = 'pokemon-center';
  regionId = 'ca';

  async fetchListings(): Promise<NormalizedListing[]> {
    return historicalProducts.slice(0, 8).map((product) => ({
      externalProductId: product.id,
      retailerId: this.retailerId,
      regionId: this.regionId,
      tcgId: 'pokemon',
      categorySlug: product.format,
      name: product.title,
      productUrl: product.url,
      imageUrl: product.imageUrl,
      price: null,
      currency: 'CAD',
      stockStatus: availabilityToStockStatus(product.availability, product.releaseType),
      observedAt: new Date().toISOString(),
    }));
  }
}
