import AsyncStorage from '@react-native-async-storage/async-storage';

import { Product } from '@/types/dropdex';

const SNAPSHOT_KEY = '@dropdex/live-snapshot/v2';

type SnapshotEntry = {
  product: Product;
  inStock: boolean;
  missingPolls: number;
};

type LiveSnapshot = {
  baselineReady: boolean;
  products: Record<string, SnapshotEntry>;
};

export type LivePollStatus = {
  state: 'idle' | 'polling' | 'ok' | 'error';
  observedCount: number;
  lastCheckedAt?: string;
  message: string;
  progress?: number;
};

const emptySnapshot = (): LiveSnapshot => ({
  baselineReady: false,
  products: {},
});

async function loadSnapshot(): Promise<LiveSnapshot> {
  try {
    const saved = await AsyncStorage.getItem(SNAPSHOT_KEY);
    if (!saved) return emptySnapshot();
    return { ...emptySnapshot(), ...(JSON.parse(saved) as LiveSnapshot) };
  } catch {
    return emptySnapshot();
  }
}

async function saveSnapshot(snapshot: LiveSnapshot) {
  await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
}

export async function clearLiveSnapshot() {
  await AsyncStorage.removeItem(SNAPSHOT_KEY);
  await AsyncStorage.removeItem('@dropdex/live-snapshot/v1');
}

export async function detectLiveChanges(observed: Product[]): Promise<Product[]> {
  const snapshot = await loadSnapshot();
  const now = new Date().toISOString();
  const observedIds = new Set(observed.map((product) => product.id));
  const events: Product[] = [];
  const nextProducts: Record<string, SnapshotEntry> = { ...snapshot.products };

  for (const product of observed) {
    const previous = snapshot.products[product.id];
    const observedInStock =
      product.availability === 'in-stock'
        ? true
        : product.availability === 'sold-out'
          ? false
          : (previous?.inStock ?? true);
    let releaseType: Product['releaseType'] | undefined;

    if (snapshot.baselineReady) {
      if (!previous) {
        releaseType = product.releaseType;
      } else if (!previous.inStock && observedInStock) {
        releaseType = 'restock';
      }
    }

    if (releaseType) {
      events.push({ ...product, releaseType, detectedAt: now });
    }

    nextProducts[product.id] = {
      product: { ...product, detectedAt: now },
      inStock: observedInStock,
      missingPolls: 0,
    };
  }

  for (const [id, previous] of Object.entries(nextProducts)) {
    if (observedIds.has(id)) continue;
    const missingPolls = previous.missingPolls + 1;
    nextProducts[id] = {
      ...previous,
      missingPolls,
      inStock: missingPolls < 2 ? previous.inStock : false,
    };
  }

  await saveSnapshot({
    baselineReady: true,
    products: nextProducts,
  });

  return events;
}

export function isSyntheticProductId(id: string) {
  return (
    id.startsWith('mock-') ||
    id.startsWith('preview-') ||
    id.startsWith('dropdex-test') ||
    id === 'test-alert' ||
    id === '100-test'
  );
}
