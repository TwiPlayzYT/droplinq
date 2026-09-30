import { useEffect } from 'react';

import { RegionConfig } from '@/data/regions';
import { preferProductImageUrl, sanitizeProductImageUrl } from '@/lib/product-image';
import { remoteMonitorConfigured } from '@/services/monitor-service';
import { Product, ProductAvailability, ProductFormat } from '@/types/dropdex';

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

type CatalogPayload = {
  products?: Array<
    Partial<Product> & {
      id?: string;
      title?: string;
      url?: string;
      format?: ProductFormat;
      inStock?: boolean;
      imageUrl?: string;
      region?: string;
    }
  >;
};

const monitorBase = () =>
  (process.env.EXPO_PUBLIC_MONITOR_API_URL ?? 'https://droplinq-monitor.onrender.com').replace(
    /\/$/,
    '',
  );

function toClientProduct(
  row: NonNullable<CatalogPayload['products']>[number],
  region: RegionConfig,
): Product | null {
  if (!row?.id || !row.title || !row.url) return null;
  const availability: ProductAvailability =
    row.availability === 'in-stock' || row.inStock === true
      ? 'in-stock'
      : row.availability === 'sold-out' || row.inStock === false
        ? 'sold-out'
        : row.availability ?? 'unknown';

  return {
    id: row.id,
    title: row.title,
    category: row.category ?? 'Trading Card Game',
    format: row.format,
    releaseType: row.releaseType ?? 'new',
    availability,
    historical: false,
    url: row.url,
    imageUrl: sanitizeProductImageUrl(row.imageUrl),
    detectedAt: row.detectedAt ?? row.lastSeenAt ?? new Date().toISOString(),
    lastSeenAt: row.lastSeenAt,
    tags: row.tags ?? ['tcg'],
    retailerName: region.storefront,
    regionName: region.label,
  };
}

// react-native-webview has no browser implementation. Desktop/mobile web rely on
// the always-on Render monitor for catalog checks, images, and Web Push delivery.
export function PokemonCenterLiveScanner({
  enabled,
  region,
  onStatus,
  onProducts,
  reportObservations,
}: Props) {
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
        const [statusRes, catalogRes] = await Promise.all([
          fetch(`${monitorBase()}/v1/status`),
          fetch(`${monitorBase()}/v1/catalog`),
        ]);
        const status = (await statusRes.json()) as MonitorStatus;
        const catalog = (await catalogRes.json()) as CatalogPayload;
        if (cancelled) return;

        const mapped = (catalog.products ?? [])
          .map((row) => toClientProduct(row, region))
          .filter((product): product is Product => Boolean(product));

        if (mapped.length > 0) {
          const withImages = mapped.map((product) => ({
            ...product,
            imageUrl: preferProductImageUrl(undefined, product.imageUrl),
          }));
          await onProducts(withImages);
          const inStock = withImages.filter((product) => product.availability === 'in-stock');
          if (inStock.length > 0) {
            void reportObservations(inStock).catch(() => undefined);
          }
        }

        // Reaching the always-on monitor means alerts are armed. Never leave the
        // Home progress bar stuck at ~50% because Pokémon Center blocked the scrape.
        const ready = true;
        const blocked = status.sourceBlocked === true || Boolean(status.lastError);
        onStatus({
          state: 'ok',
          observedCount: mapped.length || status.observedProducts || 0,
          lastCheckedAt: status.lastCheckAt ?? status.lastObservationAt ?? new Date().toISOString(),
          message: blocked
            ? mapped.length > 0
              ? `Cloud monitor live · ${mapped.length} products`
              : 'Alert server live — storefront scrape blocked; push delivery still armed.'
            : status.baselineReady || mapped.length > 0
              ? `Cloud monitor live · ${mapped.length || status.observedProducts || 0} products`
              : 'Cloud monitor live · watching for drops',
          progress: ready ? 100 : 55,
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
  }, [enabled, onProducts, onStatus, region, reportObservations]);

  return null;
}
