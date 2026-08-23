import { NormalizedListing, RetailerMonitor } from '@/services/monitoring/types';

/**
 * TODO: Implement live Pokémon Center Canada fetching in the Node monitor
 * (`monitor/pokemon-center-source.mjs`), then map results through this adapter.
 * Do not run this fetch loop inside the iPhone app.
 */
export class PokemonCenterCanadaMonitor implements RetailerMonitor {
  id = 'pokemon-center-ca';
  retailerId = 'pokemon-center';
  regionId = 'ca';

  async fetchListings(): Promise<NormalizedListing[]> {
    throw new Error(
      'Live Pokémon Center fetching belongs on the DropLinq monitoring service, not the phone.',
    );
  }
}
