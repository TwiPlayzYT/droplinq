import { fetchRecentDropProducts } from './drop-signals.mjs';
import { sendMatchingPushes } from './expo-push.mjs';
import { fetchPokemonCenterProducts } from './pokemon-center-source.mjs';
import { attachPackshots } from './product-photo-lookup.mjs';
import { saveNotifiedDropIds, saveRecentDrops } from './registration-backup.mjs';
import { sendMatchingWebPushes } from './web-push.mjs';

const snapshotKey = (product) => `${product.region ?? 'ca'}:${product.id}`;

const snapshotEntryKey = (state, product) => {
  const direct = snapshotKey(product);
  if (state.snapshot[direct]?.id === product.id) return direct;
  const existing = Object.keys(state.snapshot).find((key) => state.snapshot[key]?.id === product.id);
  return existing ?? direct;
};
const REMEMBER_LIMIT = 80;
/** How long a missed push is retried. An alerts-on device is notified when the drop is detected. */
const RETRY_MS = 14 * 24 * 60 * 60 * 1000;

const listedProduct = (product, seenAt) => ({
  ...product,
  availability: product.availability ?? (product.inStock === false ? 'sold-out' : 'in-stock'),
  releaseDate: product.releaseDate ?? product.detectedAt ?? seenAt,
  inStock: product.inStock !== false,
});

export function mergeRecentDropsIntoSnapshot(state) {
  for (const drop of state.recentDrops ?? []) {
    const product = drop?.product;
    if (!product?.id) continue;
    const key = snapshotKey(product);
    if (state.snapshot[key]) continue;
    const seenAt = drop.detectedAt ?? product.detectedAt ?? new Date().toISOString();
    state.snapshot[key] = {
      ...listedProduct(product, seenAt),
      missingPolls: 0,
      lastSeenAt: seenAt,
    };
  }
}

const rememberDrop = (state, product, detectedAt) => {
  const cutoff = Date.now() - RETRY_MS;
  const drops = (Array.isArray(state.recentDrops) ? state.recentDrops : []).filter(
    (drop) => Date.parse(drop.detectedAt) >= cutoff && drop.product?.id !== product.id,
  );
  drops.push({ product: listedProduct(product, detectedAt), detectedAt });
  state.recentDrops = drops.slice(-REMEMBER_LIMIT);
};

export class MonitorEngine {
  #running = false;
  #timer;
  #urlCursor = 0;
  #recentDropsJson = '';

  constructor({ store, urls, pollIntervalMs, requestTimeoutMs }) {
    this.store = store;
    this.urls = urls;
    this.pollIntervalMs = pollIntervalMs;
    this.requestTimeoutMs = requestTimeoutMs;
  }

  #nextUrlBatch() {
    if (this.urls.length <= 2) return { urls: this.urls, completeSweep: true };
    const first = this.urls[this.#urlCursor % this.urls.length];
    const second = this.urls[(this.#urlCursor + 1) % this.urls.length];
    this.#urlCursor = (this.#urlCursor + 2) % this.urls.length;
    return { urls: [first, second], completeSweep: false };
  }

  start() {
    this.runOnce().catch((error) => console.error('[monitor] Initial check failed:', error.message));
    this.#timer = setInterval(
      () => this.runOnce().catch((error) => console.error('[monitor] Check failed:', error.message)),
      this.pollIntervalMs,
    );
  }

  stop() {
    clearInterval(this.#timer);
  }

  async runOnce() {
    if (this.#running) return;
    this.#running = true;
    const signalPromise = fetchRecentDropProducts(this.requestTimeoutMs).then(
      (products) => ({ products, error: null }),
      (error) => ({
        products: [],
        error: error instanceof Error ? error.message : String(error),
      }),
    );

    try {
      const { urls, completeSweep } = this.#nextUrlBatch();
      const result = await fetchPokemonCenterProducts(urls, this.requestTimeoutMs);
      const now = new Date().toISOString();

      const updated = await this.store.update((state) => {
        const observedIds = new Set(result.products.map((product) => snapshotKey(product)));
        const newEvents = [];

        for (const product of result.products) {
          const key = snapshotKey(product);
          const previous = state.snapshot[key];
          let releaseType;

          if (state.baselineReady) {
            if (!previous) {
              releaseType = product.releaseType;
            } else if (!previous.inStock) {
              releaseType = 'restock';
            } else if (previous.title !== product.title || previous.url !== product.url) {
              releaseType = 'new';
            }
          }

          if (releaseType) {
            newEvents.push({
              id: `${key}-${Date.now()}-${releaseType}`,
              product: { ...product, releaseType, detectedAt: now },
              attempts: 0,
            });
          }

          state.snapshot[key] = {
            ...previous,
            ...product,
            imageUrl: product.imageUrl || previous?.imageUrl,
            inStock: true,
            missingPolls: 0,
            lastSeenAt: now,
          };
        }

        if (state.baselineReady && result.complete && completeSweep) {
          for (const [id, previous] of Object.entries(state.snapshot)) {
            if (observedIds.has(id)) continue;
            const missingPolls = (previous.missingPolls ?? 0) + 1;
            state.snapshot[id] = {
              ...previous,
              missingPolls,
              inStock: missingPolls < 2 ? previous.inStock : false,
            };
          }
        }

        state.pendingEvents.push(...newEvents);
        state.baselineReady = true;
        state.lastObservationAt = now;
        state.lastObservationCount = result.products.length;
        state.lastCheckAt = now;
        state.lastError = result.errors[0] ?? null;
        state.sourceBlocked = false;
        return state;
      });

      if (result.errors.length > 0) {
        console.warn('[monitor] Partial page failure:', result.errors.join(' | '));
      }

      console.log(
        `[monitor] ${now}: observed ${result.products.length} supported products; ` +
          `${updated.pendingEvents.length} event(s) pending`,
      );
      await this.#flushPendingEvents();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[monitor] Check failed:', message);
      await this.store.update((state) => {
        state.lastCheckAt = new Date().toISOString();
        state.lastError = message;
        state.sourceBlocked = /challenge|incapsula|blocked|unsuccessful|403|forbidden/i.test(message);
        return state;
      });
    } finally {
      let signalCount = 0;
      let signalError = null;
      try {
        const signaled = await signalPromise;
        signalCount = signaled.products.length;
        signalError = signaled.error;
        if (!signalError) {
          const added = await this.ingestUnseenProducts(signaled.products);
          if (added > 0) {
            console.log(`[monitor] Drop signal: notifying ${added} new product(s)`);
          }
        } else {
          console.warn('[monitor] Drop signal failed:', signalError);
        }
      } catch (error) {
        signalError = error instanceof Error ? error.message : String(error);
        console.warn('[monitor] Drop signal failed:', signalError);
      }
      try {
        await this.store.update((state) => {
          state.lastDropSignalAt = new Date().toISOString();
          state.lastDropSignalCount = signalCount;
          state.lastDropSignalError = signalError;
          return state;
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn('[monitor] Could not record drop-signal status:', message);
      }
      try {
        await this.#flushPendingEvents();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn('[monitor] Push flush failed:', message);
      }
      this.#running = false;
    }
  }

  /** Push products the storefront scrape has never seen. Each id alerts once. */
  async ingestUnseenProducts(products) {
    if (!Array.isArray(products) || products.length === 0) return 0;
    const prepared = await attachPackshots(products);
    const now = new Date().toISOString();
    const freshIds = [];

    await this.store.update((state) => {
      const notified = new Set(state.notifiedDropIds ?? []);
      for (const product of prepared) {
        if (!product?.id) continue;
        rememberDrop(state, product, product.detectedAt ?? now);
        const key = snapshotEntryKey(state, product);
        const alreadyListed = Boolean(state.snapshot[key]);
        if (!alreadyListed) {
          state.snapshot[key] = {
            ...listedProduct(product, now),
            missingPolls: 0,
            lastSeenAt: now,
          };
        } else {
          const current = state.snapshot[key];
          const preorderListing = product.releaseType === 'preorder' && product.availability !== 'in-stock';
          state.snapshot[key] = {
            ...current,
            imageUrl: product.imageUrl || current.imageUrl,
            ...(preorderListing && current.availability === 'in-stock'
              ? { availability: 'unknown', inStock: false, releaseType: 'preorder' }
              : {}),
          };
        }
        if (notified.has(product.id) || alreadyListed) {
          notified.add(product.id);
          continue;
        }
        notified.add(product.id);
        freshIds.push(product.id);
        state.pendingEvents.push({
          id: `signal-${product.id}-${Date.now()}`,
          product: { ...product, detectedAt: product.detectedAt ?? now },
          attempts: 0,
        });
        state.snapshot[key] = {
          ...listedProduct(product, now),
          missingPolls: 0,
          lastSeenAt: now,
        };
      }
      state.notifiedDropIds = [...notified].slice(-500);
      return state;
    });

    const serialized = JSON.stringify(this.store.getState().recentDrops ?? []);
    if (serialized !== this.#recentDropsJson) {
      this.#recentDropsJson = serialized;
      await saveRecentDrops(this.store.getState().recentDrops ?? []);
    }
    if (freshIds.length > 0) {
      await this.#flushPendingEvents();
      await saveNotifiedDropIds(this.store.getState().notifiedDropIds ?? []);
    }
    return freshIds.length;
  }

  /** If a push was missed, deliver it the next time this alerts-on device checks in. */
  async replayRecentDrops(installationId) {
    const state = this.store.getState();
    const registration = state.registrations?.[installationId];
    if (!registration?.enabled || registration.alerts?.push === false) return 0;
    const delivered = new Set(registration.deliveredDropIds ?? []);
    const cutoff = Date.now() - RETRY_MS;
    const due = (state.recentDrops ?? []).filter(
      (drop) =>
        drop?.product?.id &&
        Date.parse(drop.detectedAt) >= cutoff &&
        !delivered.has(drop.product.id),
    );
    let sent = 0;
    for (const drop of due) {
      const one = { [installationId]: this.store.getState().registrations[installationId] };
      if (!one[installationId]) break;
      const expoResult = await sendMatchingPushes(drop.product, one);
      const webResult = await sendMatchingWebPushes(drop.product, one);
      if (expoResult.count + webResult.sent > 0) {
        delivered.add(drop.product.id);
        sent += 1;
      }
    }
    if (sent > 0) {
      await this.store.update((current) => {
        const currentRegistration = current.registrations[installationId];
        if (currentRegistration) {
          currentRegistration.deliveredDropIds = [...delivered].slice(-100);
        }
        return current;
      });
    }
    return sent;
  }

  async ingestObservations(products, { complete = true, emitEvents = true } = {}) {
    if (!Array.isArray(products) || products.length === 0) {
      throw new Error('Observation products are required');
    }

    const now = new Date().toISOString();
    const updated = await this.store.update((state) => {
      const observedIds = new Set();
      const newEvents = [];

      for (const product of products) {
        const key = snapshotEntryKey(state, product);
        observedIds.add(key);
        const previous = state.snapshot[key];
        const observedInStock =
          product.availability === 'in-stock'
            ? true
            : product.availability === 'sold-out'
              ? false
              : (previous?.inStock ?? true);
        let releaseType;

        // Restocks always notify (even before baseline) so a blocked scrape
        // cannot silence customers when a device later confirms stock.
        if (emitEvents) {
          const alreadyAlerted = (state.notifiedDropIds ?? []).includes(product.id);
          if (previous && !previous.inStock && observedInStock) {
            releaseType = 'restock';
          } else if (state.baselineReady && !previous && !alreadyAlerted) {
            releaseType = product.releaseType ?? 'new';
          }
        }

        if (releaseType) {
          newEvents.push({
            id: `${key}-${Date.now()}-${releaseType}`,
            product: { ...product, releaseType, detectedAt: now },
            attempts: 0,
          });
        }

        state.snapshot[key] = {
          ...previous,
          ...product,
          imageUrl: product.imageUrl || previous?.imageUrl,
          inStock: observedInStock,
          missingPolls: 0,
          lastSeenAt: now,
        };
      }

      if (state.baselineReady && complete) {
        for (const [id, previous] of Object.entries(state.snapshot)) {
          if (observedIds.has(id)) continue;
          const missingPolls = (previous.missingPolls ?? 0) + 1;
          state.snapshot[id] = {
            ...previous,
            missingPolls,
            inStock: missingPolls < 2 ? previous.inStock : false,
          };
        }
      }

      if (emitEvents) state.pendingEvents.push(...newEvents);
      state.baselineReady = true;
      state.lastObservationAt = now;
      state.lastObservationCount = products.length;
      return state;
    });

    if (emitEvents) await this.#flushPendingEvents();

    return {
      observed: products.length,
      pendingEvents: updated.pendingEvents.length,
      baselineReady: updated.baselineReady,
    };
  }

  async ingestWebhookProducts(products, eventId) {
    if (products.length === 0) return 0;

    const updated = await this.store.update((state) => {
      if (state.webhookEventIds.includes(eventId)) return state;

      state.webhookEventIds = [eventId, ...state.webhookEventIds].slice(0, 200);
      for (const product of products) {
        state.pendingEvents.push({
          id: `${eventId}-${product.id}`,
          product,
          attempts: 0,
        });
        state.snapshot[snapshotKey(product)] = {
          ...(state.snapshot[snapshotKey(product)] ?? {}),
          ...product,
          imageUrl: product.imageUrl || state.snapshot[snapshotKey(product)]?.imageUrl,
          inStock: true,
          missingPolls: 0,
          lastSeenAt: product.detectedAt,
        };
      }
      return state;
    });

    await this.#flushPendingEvents();
    return updated.pendingEvents.filter((event) => event.id.startsWith(`${eventId}-`)).length;
  }

  async #flushPendingEvents() {
    const state = this.store.getState();
    const MAX_ATTEMPTS = 8;

    for (const event of state.pendingEvents) {
      if ((event.attempts ?? 0) >= MAX_ATTEMPTS) {
        console.error(`[push] Giving up on ${event.product?.id} after ${MAX_ATTEMPTS} attempts`);
        await this.store.update((current) => {
          current.pendingEvents = current.pendingEvents.filter((item) => item.id !== event.id);
          return current;
        });
        continue;
      }

      try {
        const expoResult = await sendMatchingPushes(event.product, state.registrations);
        const webResult = await sendMatchingWebPushes(event.product, state.registrations);
        const sent = expoResult.count + webResult.sent;
        const deliveredTo = [...expoResult.installationIds, ...(webResult.sentInstallationIds ?? [])];
        if (sent === 0) {
          console.warn(`[push] ${event.product?.title}: no device accepted the alert yet, retrying`);
          await this.store.update((current) => {
            current.pendingEvents = current.pendingEvents.map((item) =>
              item.id === event.id ? { ...item, attempts: (item.attempts ?? 0) + 1 } : item,
            );
            return current;
          });
          continue;
        }
        console.log(
          `[push] ${event.product.title}: sent ${sent} matching notification(s) ` +
            `(expo=${expoResult.count}, web=${webResult.sent}, regs=${Object.keys(state.registrations).length})`,
        );
        await this.store.update((current) => {
          current.pendingEvents = current.pendingEvents.filter((item) => item.id !== event.id);
          for (const installationId of webResult.expiredInstallationIds) {
            if (current.registrations[installationId]) {
              delete current.registrations[installationId].webPushSubscription;
            }
          }
          for (const installationId of deliveredTo) {
            const registration = current.registrations[installationId];
            if (!registration || !event.product?.id) continue;
            const seen = new Set(registration.deliveredDropIds ?? []);
            seen.add(event.product.id);
            registration.deliveredDropIds = [...seen].slice(-100);
          }
          return current;
        });
      } catch (error) {
        console.error(`[push] ${event.product.id} failed:`, error.message);
        await this.store.update((current) => {
          current.pendingEvents = current.pendingEvents.map((item) =>
            item.id === event.id ? { ...item, attempts: (item.attempts ?? 0) + 1 } : item,
          );
          return current;
        });
      }
    }
  }
}
