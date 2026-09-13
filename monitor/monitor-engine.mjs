import { sendMatchingPushes } from './expo-push.mjs';
import { fetchPokemonCenterProducts } from './pokemon-center-source.mjs';
import { sendMatchingWebPushes } from './web-push.mjs';

const snapshotKey = (product) => `${product.region ?? 'ca'}:${product.id}`;

export class MonitorEngine {
  #running = false;
  #timer;
  #urlCursor = 0;

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
            ...product,
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
        state.sourceBlocked = /challenge|incapsula|blocked|unsuccessful/i.test(message);
        return state;
      });
    } finally {
      this.#running = false;
    }
  }

  async ingestObservations(products, { complete = true, emitEvents = true } = {}) {
    if (!Array.isArray(products) || products.length === 0) {
      throw new Error('Observation products are required');
    }

    const now = new Date().toISOString();
    const updated = await this.store.update((state) => {
      const observedIds = new Set(products.map((product) => snapshotKey(product)));
      const newEvents = [];

      for (const product of products) {
        const previous = state.snapshot[snapshotKey(product)];
        const observedInStock =
          product.availability === 'in-stock'
            ? true
            : product.availability === 'sold-out'
              ? false
              : (previous?.inStock ?? true);
        let releaseType;

        if (state.baselineReady && emitEvents) {
          if (!previous) {
            releaseType = product.releaseType ?? 'new';
          } else if (!previous.inStock && observedInStock) {
            releaseType = 'restock';
          } else if (previous.title !== product.title || previous.url !== product.url) {
            releaseType = 'new';
          }
        }

        if (releaseType) {
          newEvents.push({
            id: `${snapshotKey(product)}-${Date.now()}-${releaseType}`,
            product: { ...product, releaseType, detectedAt: now },
            attempts: 0,
          });
        }

        state.snapshot[snapshotKey(product)] = {
          ...product,
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
          ...product,
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

    for (const event of state.pendingEvents) {
      try {
        const expoSent = await sendMatchingPushes(event.product, state.registrations);
        const webResult = await sendMatchingWebPushes(event.product, state.registrations);
        const sent = expoSent + webResult.sent;
        console.log(
          `[push] ${event.product.title}: sent ${sent} matching notification(s)`,
        );
        await this.store.update((current) => {
          current.pendingEvents = current.pendingEvents.filter((item) => item.id !== event.id);
          for (const installationId of webResult.expiredInstallationIds) {
            if (current.registrations[installationId]) {
              delete current.registrations[installationId].webPushSubscription;
            }
          }
          return current;
        });
      } catch (error) {
        console.error(`[push] ${event.product.id} failed:`, error.message);
        await this.store.update((current) => {
          current.pendingEvents = current.pendingEvents.map((item) =>
            item.id === event.id ? { ...item, attempts: item.attempts + 1 } : item,
          );
          return current;
        });
      }
    }
  }
}
