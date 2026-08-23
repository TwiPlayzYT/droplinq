import { useEffect } from 'react';

import { RegionConfig } from '@/data/regions';
import { Product } from '@/types/dropdex';

type Props = {
  enabled: boolean;
  region: RegionConfig;
  onStatus: (status: {
    state: 'idle' | 'polling' | 'ok' | 'error';
    observedCount: number;
    lastCheckedAt?: string;
    message: string;
    progress?: number;
  }) => void;
  onProducts: (products: Product[]) => void | Promise<void>;
  reportObservations: (products: Product[]) => Promise<void>;
};

// react-native-webview has no browser implementation. The installed PWA relies
// on the Railway monitor for closed-app detection and Web Push delivery.
export function PokemonCenterLiveScanner({ enabled, onStatus }: Props) {
  useEffect(() => {
    onStatus(
      enabled
        ? {
            state: 'ok',
            observedCount: 0,
            lastCheckedAt: new Date().toISOString(),
            message: 'Cloud monitor active',
            progress: 100,
          }
        : {
            state: 'idle',
            observedCount: 0,
            message: 'Cloud monitor standby',
            progress: 0,
          },
    );
  }, [enabled, onStatus]);

  return null;
}
