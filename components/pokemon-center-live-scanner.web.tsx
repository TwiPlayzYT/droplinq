import { useEffect } from 'react';

import { RegionConfig } from '@/data/regions';
import { remoteMonitorConfigured } from '@/services/monitor-service';
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

type MonitorStatus = {
  alwaysOn?: boolean;
  baselineReady?: boolean;
  observedProducts?: number;
  lastCheckAt?: string | null;
  lastObservationAt?: string | null;
  lastError?: string | null;
  sourceBlocked?: boolean;
};

const monitorBase = () =>
  (process.env.EXPO_PUBLIC_MONITOR_API_URL ?? 'https://droplinq-monitor.onrender.com').replace(
    /\/$/,
    '',
  );

// react-native-webview has no browser implementation. Desktop/mobile web rely on
// the always-on Render monitor for catalog checks and Web Push delivery.
export function PokemonCenterLiveScanner({ enabled, onStatus }: Props) {
  useEffect(() => {
    if (!enabled) {
      onStatus({
        state: 'idle',
        observedCount: 0,
        message: 'Cloud monitor standby',
        progress: 0,
      });
      return;
    }

    if (!remoteMonitorConfigured) {
      onStatus({
        state: 'error',
        observedCount: 0,
        message: 'Alert server is not configured.',
        progress: 0,
      });
      return;
    }

    let cancelled = false;

    const pull = async () => {
      try {
        const response = await fetch(`${monitorBase()}/v1/status`);
        const status = (await response.json()) as MonitorStatus;
        if (cancelled) return;

        if (status.sourceBlocked) {
          onStatus({
            state: 'ok',
            observedCount: status.observedProducts ?? 0,
            lastCheckedAt: status.lastCheckAt ?? status.lastObservationAt ?? new Date().toISOString(),
            message: 'Alert server is live. Storefront check is blocked; lock-screen delivery still works.',
            progress: 100,
          });
          return;
        }

        onStatus({
          state: status.baselineReady ? 'ok' : 'polling',
          observedCount: status.observedProducts ?? 0,
          lastCheckedAt: status.lastCheckAt ?? status.lastObservationAt ?? new Date().toISOString(),
          message: status.baselineReady
            ? `Cloud monitor live · ${status.observedProducts ?? 0} products`
            : 'Cloud monitor checking Pokémon Center…',
          progress: status.baselineReady ? 100 : 55,
        });
      } catch {
        if (cancelled) return;
        onStatus({
          state: 'error',
          observedCount: 0,
          message: 'Could not reach the alert server.',
          progress: 0,
        });
      }
    };

    onStatus({
      state: 'polling',
      observedCount: 0,
      message: 'Connecting to the always-on alert server…',
      progress: 20,
    });
    void pull();
    const timer = setInterval(() => void pull(), 30_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [enabled, onStatus]);

  return null;
}
