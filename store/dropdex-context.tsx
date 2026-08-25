import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { defaultAlertPreferences, defaultFilters, testAlertProduct } from '@/constants/dropdex';
import { migrateLegacyFilters } from '@/data/pokemon-center-filters';
import { catalogRepository } from '@/services/data';
import { isMockData } from '@/config/app-config';
import { CatalogStockEvent } from '@/types/catalog';
import { syncCoveragePreferences } from '@/services/filters/coverage-prefs';
import { canAddToWatchlist } from '@/services/subscriptions/tiers';
import { isGuestUserId } from '@/services/auth/guest-auth';
import { useAuth } from '@/store/auth-context';
import { seededEtbs } from '@/data/historical-etbs';
import {
  defaultRegionId,
  getRegion,
  localizeProduct,
  regions,
} from '@/data/regions';
import { matchesFilters } from '@/lib/filter-matcher';
import { openPokemonCenterProduct } from '@/lib/open-product';
import {
  detectLiveChanges,
  isSyntheticProductId,
  LivePollStatus,
} from '@/services/live-monitor';
import {
  monitorService,
  remoteMonitorConfigured,
  WebPushSubscriptionPayload,
} from '@/services/monitor-service';
import {
  configureNotifications,
  deliverProductAlert,
  getExpoPushToken,
  stopAlertSignals,
  subscribeToIncomingProductAlerts,
} from '@/services/notification-service';
import {
  getExistingWebPushSubscription,
  getWebPushState,
  subscribeToWebPush,
  WebPushState,
} from '@/services/web-push-service';
import {
  AlertPreferences,
  DropAlert,
  FilterPreferences,
  PersistedState,
  Product,
  RecentVisit,
  RegionId,
  WatchedItem,
} from '@/types/dropdex';

const STORAGE_KEY = '@dropdex/state/v2';
const MAX_RECENTS = 40;
const MAX_WATCHLIST = 40;

type SyncState = 'local' | 'syncing' | 'connected' | 'error';

export type UXFeedback = {
  id: number;
  tone: 'info' | 'success' | 'error';
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export type UXOperation = {
  title: string;
  message: string;
};

type DropDexContextValue = PersistedState & {
  hydrated: boolean;
  syncState: SyncState;
  liveStatus: LivePollStatus;
  liveProducts: Product[];
  stockEvents: CatalogStockEvent[];
  lastBackendUpdate: string | null;
  catalogLoading: boolean;
  dataModeLabel: 'mock' | 'supabase';
  refreshCatalog: () => Promise<void>;
  activeAlert: DropAlert | null;
  feedback: UXFeedback | null;
  operation: UXOperation | null;
  webPushState: WebPushState;
  enableWebPush: () => Promise<void>;
  setMonitoring: (enabled: boolean) => void;
  setRegion: (region: RegionId) => void;
  retryMonitoring: () => void;
  clearFeedback: () => void;
  updateFilters: (filters: FilterPreferences) => void;
  updateAlertPreferences: (alerts: AlertPreferences) => void;
  triggerTestAlert: () => void;
  acknowledgeAlert: () => void;
  openProductBrowser: (product: Product) => void;
  removeRecentVisit: (visitId: string) => void;
  addToWatchlist: (
    product: Product,
  ) => { ok: true } | { ok: false; code: 'limit' | 'duplicate'; message: string };
  removeFromWatchlist: (productId: string) => void;
  isWatched: (productId: string) => boolean;
};

const initialState: PersistedState = {
  installationId: `dropdex-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  monitoring: true,
  region: defaultRegionId,
  filters: defaultFilters,
  alerts: defaultAlertPreferences,
  alertHistory: [],
  recentVisits: [],
  watchlist: [],
};

const idleLiveStatus: LivePollStatus = {
  state: 'idle',
  observedCount: 0,
  message: 'Live monitor standby',
  progress: 0,
};

/** Keep in sync with GlobalUXFeedback countdown bar. */
const FEEDBACK_DURATION_MS = 4500;

const DropDexContext = createContext<DropDexContextValue | null>(null);

const sanitizeHistory = (history: DropAlert[] = []) =>
  history.filter((alert) => !isSyntheticProductId(alert.product.id));

export function DropDexProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [state, setState] = useState<PersistedState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>('local');
  const [liveStatus, setLiveStatus] = useState<LivePollStatus>(idleLiveStatus);
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [stockEvents, setStockEvents] = useState<CatalogStockEvent[]>([]);
  const [lastBackendUpdate, setLastBackendUpdate] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [activeAlert, setActiveAlert] = useState<DropAlert | null>(null);
  const [browserOpen, setBrowserOpen] = useState(false);
  const [feedback, setFeedback] = useState<UXFeedback | null>(null);
  const [operation, setOperation] = useState<UXOperation | null>(null);
  const [webPushState, setWebPushState] = useState<WebPushState>('checking');
  const [webPushChecked, setWebPushChecked] = useState(false);
  const [webPushPublicKey, setWebPushPublicKey] = useState<string>();
  const [webPushSubscription, setWebPushSubscription] =
    useState<WebPushSubscriptionPayload>();
  const [scannerSession, setScannerSession] = useState(0);
  const stateRef = useRef(state);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Suppress noisy cloud-registration toasts across filter/region re-registers. */
  const cloudSyncWarnRef = useRef({
    consecutiveFailures: 0,
    cloudToasted: false,
    permissionToasted: false,
  });

  const showFeedback = useCallback(
    (
      tone: UXFeedback['tone'],
      title: string,
      message: string,
      action?: Pick<UXFeedback, 'actionLabel' | 'onAction'>,
    ) => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      setFeedback({ id: Date.now(), tone, title, message, ...action });
      feedbackTimerRef.current = setTimeout(() => setFeedback(null), FEEDBACK_DURATION_MS);
    },
    [],
  );

  useEffect(
    () => () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    configureNotifications().catch(() => undefined);

    const hydrate = async () => {
      try {
        const [current, legacy] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem('@dropdex/state/v1'),
        ]);
        const raw = current ?? legacy;
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<PersistedState>;
          setState({
            ...initialState,
            ...parsed,
            // Monitoring is active on every launch so the device and cloud
            // registration recover automatically after an app restart.
            monitoring: true,
            region: regions.some((item) => item.id === parsed.region)
              ? (parsed.region as RegionId)
              : defaultRegionId,
            filters: { ...defaultFilters, ...migrateLegacyFilters(parsed.filters) },
            alerts: { ...defaultAlertPreferences, ...parsed.alerts },
            alertHistory: sanitizeHistory(parsed.alertHistory),
            recentVisits: Array.isArray(parsed.recentVisits) ? parsed.recentVisits : [],
            watchlist: Array.isArray(parsed.watchlist) ? parsed.watchlist : [],
          });
        }
        await AsyncStorage.removeItem('@dropdex/live-snapshot/v1');
        if (legacy && !current) {
          await AsyncStorage.removeItem('@dropdex/state/v1');
        }
      } catch {
        showFeedback(
          'error',
          'Saved preferences unavailable',
          'DropLinq started safely with default settings. You can keep using the app.',
        );
      } finally {
        setHydrated(true);
      }
    };

    hydrate();
  }, [showFeedback]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getWebPushState(),
      getExistingWebPushSubscription(),
      monitorService.getWebPushPublicKey().catch(() => undefined),
    ])
      .then(([pushState, subscription, publicKey]) => {
        if (cancelled) return;
        setWebPushSubscription(subscription);
        setWebPushPublicKey(publicKey);
        setWebPushState(
          (pushState === 'ready' || pushState === 'subscribed') && !publicKey
            ? 'error'
            : pushState,
        );
      })
      .finally(() => {
        if (!cancelled) setWebPushChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced persistence: serializing the whole state is expensive enough to
  // drop frames if it runs synchronously on every tap.
  useEffect(() => {
    if (!hydrated || !webPushChecked) return;
    const timer = setTimeout(() => {
      AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...state,
          alertHistory: sanitizeHistory(state.alertHistory),
        }),
      ).catch(() => undefined);
    }, 400);
    return () => clearTimeout(timer);
  }, [hydrated, state]);

  const processProduct = useCallback((
    product: Product,
    force = false,
    alreadyNotified = false,
    forceOverlay = false,
  ) => {
    const current = stateRef.current;
    if (!force && (!current.monitoring || !matchesFilters(product, current.filters))) return;

    const isSynthetic = isSyntheticProductId(product.id);
    const alert: DropAlert = {
      id: `${product.id}-${Date.now()}`,
      product,
      seen: false,
      createdAt: new Date().toISOString(),
    };

    if (!isSynthetic) {
      setState((previous) => ({
        ...previous,
        alertHistory: sanitizeHistory([alert, ...previous.alertHistory]).slice(0, 30),
      }));
    }

    if (current.alerts.fullScreen || forceOverlay) setActiveAlert(alert);
    const deliverySettings = alreadyNotified
      ? { ...current.alerts, push: false, sound: false, vibration: false }
      : current.alerts;
    deliverProductAlert(product, deliverySettings).catch(() => undefined);
  }, []);

  useEffect(
    () => subscribeToIncomingProductAlerts((product) => processProduct(product, true, true)),
    [processProduct],
  );

  useEffect(() => {
    if (!activeAlert) return;

    const interval = setInterval(() => {
      const current = stateRef.current;
      deliverProductAlert(activeAlert.product, {
        ...current.alerts,
        push: false,
        fullScreen: false,
      }).catch(() => undefined);
    }, 6000);

    return () => clearInterval(interval);
  }, [activeAlert]);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;

    const register = async () => {
      const remoteConfigured = remoteMonitorConfigured;
      setSyncState(remoteConfigured ? 'syncing' : 'local');
      const expoPushToken =
        state.monitoring && state.alerts.push ? await getExpoPushToken() : undefined;
      const remotePushUnavailable =
        remoteConfigured &&
        state.monitoring &&
        state.alerts.push &&
        !expoPushToken &&
        !webPushSubscription;
      let registrationFailed = false;

      try {
        await monitorService.register({
          installationId: state.installationId,
          enabled: state.monitoring,
          region: state.region,
          filters: state.filters,
          alerts: state.alerts,
          expoPushToken,
          webPushSubscription,
        });
        if (cancelled) return;

        cloudSyncWarnRef.current.consecutiveFailures = 0;
        cloudSyncWarnRef.current.cloudToasted = false;

        if (remotePushUnavailable) {
          setSyncState('error');
          // Permission gap — tell once per app session, not on every re-register.
          if (!cloudSyncWarnRef.current.permissionToasted && session) {
            cloudSyncWarnRef.current.permissionToasted = true;
            showFeedback(
              'error',
              'Lock-screen alerts need permission',
              'On iPhone, install the web app from Safari, then enable lock-screen alerts in Settings.',
            );
          }
        } else {
          attempts = 0;
          setSyncState(remoteConfigured ? 'connected' : 'local');
        }
      } catch {
        registrationFailed = true;
        if (!cancelled) {
          setSyncState('error');
          cloudSyncWarnRef.current.consecutiveFailures += 1;
          // Transient Railway/network blips are silent. Only toast after a sustained outage.
          const outage =
            cloudSyncWarnRef.current.consecutiveFailures >= 3 &&
            !cloudSyncWarnRef.current.cloudToasted;
          if (state.monitoring && session && outage) {
            cloudSyncWarnRef.current.cloudToasted = true;
            showFeedback(
              'error',
              'Cloud alerts are offline',
              'The monitor could not be reached after several tries. DropLinq will keep retrying.',
            );
          }
        }
      }

      if (!cancelled && (remotePushUnavailable || registrationFailed)) {
        const delay = Math.min(60_000 * 2 ** attempts, 15 * 60_000);
        attempts += 1;
        retryTimer = setTimeout(register, delay);
      }
    };

    register();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [
    hydrated,
    session,
    showFeedback,
    state.alerts,
    state.filters,
    state.installationId,
    state.monitoring,
    state.region,
    webPushChecked,
    webPushSubscription,
  ]);

  const liveProductsRef = useRef<Product[]>([]);
  useEffect(() => {
    liveProductsRef.current = liveProducts;
  }, [liveProducts]);

  const refreshCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const regionId = stateRef.current.region;
      const regionConfig = getRegion(regionId);
      const now = new Date().toISOString();
      const seedProducts: Product[] = seededEtbs.map((raw) => {
        const seed = localizeProduct(raw, regionConfig);
        return {
          ...seed,
          historical: false,
          availability: seed.availability ?? 'sold-out',
          // Only keep a real sold-out timestamp — never invent "just now".
          soldOutAt: seed.soldOutAt,
          lastSeenAt: seed.lastSeenAt,
          detectedAt: seed.detectedAt || now,
          retailerName: regionConfig.storefront,
          regionName: regionConfig.label,
          lastCheckedAt: now,
        } as Product & { retailerName: string; regionName: string; lastCheckedAt: string };
      });

      const [remoteProducts, remoteEvents, updatedAt] = await Promise.all([
        catalogRepository.listProducts({
          regionId,
          categorySlugs: undefined,
        }),
        catalogRepository.listEvents(),
        catalogRepository.lastBackendUpdate(),
      ]);

      // Supabase may be empty (no rows yet) or blocked for guests (RLS).
      // Always keep the curated seed catalog so Stock is never blank.
      const byId = new Map<string, Product>();
      seedProducts.forEach((product) => byId.set(product.id, product));
      remoteProducts.forEach((product) => {
        const existing = byId.get(product.id);
        byId.set(product.id, {
          ...existing,
          ...product,
          historical: false,
          imageUrl: product.imageUrl || existing?.imageUrl,
          releaseDate: product.releaseDate ?? existing?.releaseDate,
        });
      });

      const products = [...byId.values()];
      setLiveProducts(products);
      setStockEvents(remoteEvents);
      setLastBackendUpdate(updatedAt ?? (products.length ? now : null));
      setLiveStatus({
        state: stateRef.current.monitoring ? 'ok' : 'idle',
        observedCount: products.length,
        lastCheckedAt: updatedAt ?? now,
        message: stateRef.current.monitoring
          ? isMockData || remoteProducts.length === 0
            ? 'Alerts on. Showing curated catalog until live backend products sync.'
            : 'Alerts on. Showing the latest backend catalog.'
          : 'Alerts paused. Backend monitoring of retailers is separate.',
        progress: stateRef.current.monitoring ? 100 : 0,
      });
    } catch {
      // Network / Supabase failure — still surface local seeds.
      const regionConfig = getRegion(stateRef.current.region);
      const now = new Date().toISOString();
      const fallback = seededEtbs.map((raw) => {
        const seed = localizeProduct(raw, regionConfig);
        return {
          ...seed,
          historical: false,
          availability: seed.availability ?? 'sold-out',
          soldOutAt: seed.soldOutAt,
          lastSeenAt: seed.lastSeenAt,
          detectedAt: seed.detectedAt || now,
        };
      });
      if (fallback.length && liveProductsRef.current.length === 0) {
        setLiveProducts(fallback);
      }
      setLiveStatus({
        state: 'error',
        observedCount: Math.max(liveProductsRef.current.length, fallback.length),
        message: 'Could not refresh catalog.',
        progress: 0,
      });
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void refreshCatalog();
    const timer = setInterval(() => void refreshCatalog(), 30_000);
    return () => clearInterval(timer);
  }, [hydrated, refreshCatalog, state.filters.coverageMode, state.filters.customCategoryIds, state.monitoring, state.region]);

  const handleObservedCatalog = useCallback(
    async (products: Product[]) => {
      // The scanner republishes constantly; only produce a new array (and
      // re-render every consumer) when something meaningful actually changed.
      const previous = liveProductsRef.current;
      const byId = new Map(previous.map((product) => [product.id, product]));
      let changed = false;

      products.forEach((product) => {
        const existing = byId.get(product.id);
        const availability =
          product.availability && product.availability !== 'unknown'
            ? product.availability
            : existing?.availability && existing.availability !== 'unknown'
              ? existing.availability
              : 'sold-out';

        const soldOutAt =
          availability === 'sold-out'
            ? product.soldOutAt ||
              (existing?.availability === 'sold-out' ? existing.soldOutAt : undefined) ||
              new Date().toISOString()
            : undefined;

        const imageUrl = product.imageUrl || existing?.imageUrl;

        if (
          existing &&
          existing.availability === availability &&
          existing.soldOutAt === soldOutAt &&
          existing.imageUrl === imageUrl &&
          existing.title === product.title &&
          existing.url === product.url &&
          existing.historical === false &&
          existing.releaseDate === (product.releaseDate ?? existing.releaseDate)
        ) {
          return;
        }

        byId.set(product.id, {
          ...existing,
          ...product,
          historical: false,
          imageUrl,
          availability,
          soldOutAt,
        });
        changed = true;
      });

      if (!changed) return;

      const next = [...byId.values()];
      liveProductsRef.current = next;
      setLiveProducts(next);

      const events = await detectLiveChanges(products);
      events.forEach((product) => processProduct(product));
    },
    [processProduct],
  );

  // Region change: everything on screen belongs to the old storefront, so
  // rebuild the list from region-localized seeds immediately.
  const seededRegionRef = useRef<RegionId | null>(null);

  // Keep curated seeds available even when alerts are off / backend is empty.
  useEffect(() => {
    if (!hydrated) return;

    const regionConfig = getRegion(state.region);
    const regionChanged =
      seededRegionRef.current !== null && seededRegionRef.current !== state.region;
    seededRegionRef.current = state.region;

    setLiveProducts((previous) => {
      const byId = new Map(
        regionChanged ? [] : previous.map((product) => [product.id, product] as const),
      );
      const now = new Date().toISOString();
      let changed = regionChanged || previous.length === 0;

      seededEtbs.forEach((rawSeed) => {
        const seed = localizeProduct(rawSeed, regionConfig);
        const existing = byId.get(seed.id);
        if (!existing) {
          byId.set(seed.id, {
            ...seed,
            historical: false,
            availability: seed.availability ?? 'sold-out',
            soldOutAt: seed.soldOutAt,
            lastSeenAt: seed.lastSeenAt,
            detectedAt: seed.detectedAt || now,
          });
          changed = true;
          return;
        }

        const imageUrl = seed.imageUrl || existing.imageUrl;
        const soldOutAt = seed.soldOutAt ?? existing.soldOutAt;

        if (
          imageUrl === existing.imageUrl &&
          existing.historical === false &&
          existing.url === seed.url &&
          existing.releaseDate === (seed.releaseDate ?? existing.releaseDate) &&
          existing.soldOutAt === soldOutAt &&
          existing.pcCategoryId === seed.pcCategoryId
        ) {
          return;
        }

        byId.set(seed.id, {
          ...existing,
          imageUrl,
          url: seed.url,
          historical: false,
          pcCategoryId: seed.pcCategoryId ?? existing.pcCategoryId,
          releaseDate: seed.releaseDate ?? existing.releaseDate,
          releaseType: seed.releaseType ?? existing.releaseType,
          soldOutAt,
        });
        changed = true;
      });

      return changed ? [...byId.values()] : previous;
    });
  }, [hydrated, state.monitoring, state.region]);

  // Stable callbacks (reading current values through refs) so screens and
  // memoized cards don't re-render every time unrelated state changes.
  const activeAlertRef = useRef(activeAlert);
  useEffect(() => {
    activeAlertRef.current = activeAlert;
  }, [activeAlert]);

  const setMonitoring = useCallback(
    (monitoring: boolean) => setState((previous) => ({ ...previous, monitoring })),
    [],
  );

  const setRegion = useCallback(
    (region: RegionId) => {
      if (region === stateRef.current.region) return;
      const monitoring = stateRef.current.monitoring;
      const selected = getRegion(region);
      setLiveStatus({
        state: monitoring ? 'polling' : 'idle',
        observedCount: 0,
        message: monitoring
          ? `Switching to ${selected.storefront}…`
          : `${selected.storefront} selected`,
        progress: monitoring ? 8 : 0,
      });
      setState((previous) => ({ ...previous, region }));
    },
    [],
  );

  const retryMonitoring = useCallback(() => {
    if (!stateRef.current.monitoring) {
      setState((previous) => ({ ...previous, monitoring: true }));
    }
    setLiveStatus({
      state: 'polling',
      observedCount: liveProductsRef.current.length,
      message: `Retrying ${getRegion(stateRef.current.region).storefront}…`,
      progress: 8,
    });
    setScannerSession((value) => value + 1);
  }, []);

  const clearFeedback = useCallback(() => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback(null);
  }, []);

  const updateFilters = useCallback(
    (filters: FilterPreferences) => {
      setState((previous) => ({ ...previous, filters }));
      const userId = session?.user.id;
      if (userId && !isGuestUserId(userId)) {
        void syncCoveragePreferences(userId, stateRef.current.region, filters).catch(() => {
          // Local filters still apply; cloud sync is best-effort.
        });
      }
    },
    [session?.user.id],
  );

  const updateAlertPreferences = useCallback(
    (alerts: AlertPreferences) => setState((previous) => ({ ...previous, alerts })),
    [],
  );

  const enableWebPush = useCallback(async () => {
    if (!webPushPublicKey) {
      setWebPushState('error');
      showFeedback(
        'error',
        'Web Push is not configured',
        'Add the VAPID environment variables to Railway, deploy, then try again.',
      );
      return;
    }

    setWebPushState('checking');
    try {
      const subscription = await subscribeToWebPush(webPushPublicKey);
      setWebPushSubscription(subscription);
      setWebPushState('subscribed');
      await monitorService.register({
        installationId: stateRef.current.installationId,
        enabled: stateRef.current.monitoring,
        region: stateRef.current.region,
        filters: stateRef.current.filters,
        alerts: stateRef.current.alerts,
        webPushSubscription: subscription,
      });
      showFeedback(
        'success',
        'Lock-screen alerts enabled',
        'DropLinq can now alert this Home Screen app while it is closed.',
      );
    } catch (error) {
      const nextState = await getWebPushState();
      setWebPushState(nextState === 'checking' ? 'error' : nextState);
      showFeedback(
        'error',
        'Could not enable Web Push',
        error instanceof Error ? error.message : 'Check notification permissions and try again.',
      );
    }
  }, [showFeedback, webPushPublicKey]);

  const triggerTestAlert = useCallback(() => {
    processProduct(
      { ...testAlertProduct, detectedAt: new Date().toISOString() },
      true,
      false,
      true,
    );
  }, [processProduct]);

  const acknowledgeAlert = useCallback(() => {
    const alert = activeAlertRef.current;
    if (!alert) return;
    if (!isSyntheticProductId(alert.product.id)) {
      setState((previous) => ({
        ...previous,
        alertHistory: previous.alertHistory.map((item) =>
          item.id === alert.id ? { ...item, seen: true } : item,
        ),
      }));
    }
    setActiveAlert(null);
    stopAlertSignals().catch(() => undefined);
  }, []);

  const openProductBrowser = useCallback(
    (product: Product) => {
      const visit: RecentVisit = {
        id: `${product.id}-${Date.now()}`,
        product,
        openedAt: new Date().toISOString(),
      };
      setState((previous) => ({
        ...previous,
        recentVisits: [
          visit,
          ...previous.recentVisits.filter((item) => item.product.id !== product.id),
        ].slice(0, MAX_RECENTS),
      }));
      setBrowserOpen(true);
      setOperation({
        title: 'OPENING POKÉMON CENTER',
        message: `Connecting to ${getRegion(stateRef.current.region).storefront}. This can take a moment.`,
      });
      void openPokemonCenterProduct(product.url)
        .catch(() => {
          showFeedback(
            'error',
            'Could not open Pokémon Center',
            'Check your connection, then tap the product to try again.',
          );
        })
        .finally(() => {
          setOperation(null);
          setBrowserOpen(false);
        });
    },
    [showFeedback],
  );

  const removeRecentVisit = useCallback(
    (visitId: string) => {
      const removed = stateRef.current.recentVisits.find((item) => item.id === visitId);
      setState((previous) => ({
        ...previous,
        recentVisits: previous.recentVisits.filter((item) => item.id !== visitId),
      }));
      if (removed) {
        showFeedback('info', 'Removed from Recents', removed.product.title, {
          actionLabel: 'UNDO',
          onAction: () => {
            setState((previous) => ({
              ...previous,
              recentVisits: [
                removed,
                ...previous.recentVisits.filter((item) => item.id !== removed.id),
              ].slice(0, MAX_RECENTS),
            }));
            setFeedback(null);
          },
        });
      }
    },
    [showFeedback],
  );

  const isWatched = useCallback(
    (productId: string) => stateRef.current.watchlist.some((item) => item.product.id === productId),
    [],
  );

  const addToWatchlist = useCallback(
    (product: Product) => {
      const current = stateRef.current.watchlist;
      if (current.some((item) => item.product.id === product.id)) {
        return {
          ok: false as const,
          code: 'duplicate' as const,
          message: 'Already on your watchlist.',
        };
      }
      if (!canAddToWatchlist('FREE', current.length)) {
        return {
          ok: false as const,
          code: 'limit' as const,
          message: 'Free plans can watch 3 products. Remove one or upgrade.',
        };
      }

      const entry: WatchedItem = {
        id: product.id,
        product,
        watchedAt: new Date().toISOString(),
      };
      setState((previous) => ({
        ...previous,
        watchlist: [
          entry,
          ...previous.watchlist.filter((item) => item.product.id !== product.id),
        ].slice(0, MAX_WATCHLIST),
      }));
      showFeedback('success', 'Added to Watchlist', product.title);
      return { ok: true as const };
    },
    [showFeedback],
  );

  const removeFromWatchlist = useCallback(
    (productId: string) => {
      const removed = stateRef.current.watchlist.find((item) => item.product.id === productId);
      setState((previous) => ({
        ...previous,
        watchlist: previous.watchlist.filter((item) => item.product.id !== productId),
      }));
      if (removed) {
        showFeedback('info', 'Removed from Watchlist', removed.product.title, {
          actionLabel: 'UNDO',
          onAction: () => {
            setState((previous) => ({
              ...previous,
              watchlist: [
                removed,
                ...previous.watchlist.filter((item) => item.product.id !== removed.product.id),
              ].slice(0, MAX_WATCHLIST),
            }));
            setFeedback(null);
          },
        });
      }
    },
    [showFeedback],
  );

  const value = useMemo<DropDexContextValue>(
    () => ({
      ...state,
      alertHistory: sanitizeHistory(state.alertHistory),
      hydrated,
      syncState,
      liveStatus,
      liveProducts,
      stockEvents,
      lastBackendUpdate,
      catalogLoading,
      dataModeLabel: isMockData ? 'mock' : 'supabase',
      refreshCatalog,
      activeAlert,
      feedback,
      operation,
      webPushState,
      enableWebPush,
      setMonitoring,
      setRegion,
      retryMonitoring,
      clearFeedback,
      updateFilters,
      updateAlertPreferences,
      triggerTestAlert,
      acknowledgeAlert,
      openProductBrowser,
      removeRecentVisit,
      addToWatchlist,
      removeFromWatchlist,
      isWatched,
    }),
    [
      acknowledgeAlert,
      activeAlert,
      addToWatchlist,
      clearFeedback,
      enableWebPush,
      feedback,
      hydrated,
      isWatched,
      liveProducts,
      stockEvents,
      lastBackendUpdate,
      catalogLoading,
      liveStatus,
      refreshCatalog,
      openProductBrowser,
      operation,
      removeFromWatchlist,
      removeRecentVisit,
      retryMonitoring,
      setMonitoring,
      setRegion,
      state,
      syncState,
      triggerTestAlert,
      updateAlertPreferences,
      updateFilters,
      webPushState,
    ],
  );

  return (
    <DropDexContext.Provider value={value}>{children}</DropDexContext.Provider>
  );
}

export function useDropDex() {
  const context = useContext(DropDexContext);
  if (!context) throw new Error('useDropDex must be used inside DropDexProvider');
  return context;
}
