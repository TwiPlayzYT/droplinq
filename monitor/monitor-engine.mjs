import { sendMatchingPushes } from './expo-push.mjs';
import { fetchPokemonCenterProducts } from './pokemon-center-source.mjs';
import { sendMatchingWebPushes } from './web-push.mjs';

export class MonitorEngine {
  #running = false;
  #timer;

  constructor({ store, urls, pollIntervalMs, requestTimeoutMs }) {
    this.store = store;
    this.urls = urls;
    this.pollIntervalMs = pollIntervalMs;
    this.requestTimeoutMs = requestTimeoutMs;
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
      const result = await fetchPokemonCenterProducts(this.urls, this.requestTimeoutMs);
      const now = new Date().toISOString();

      const updated = await this.store.update((state) => {
        const observedIds = new Set(result.products.map((product) => product.id));
        const newEvents = [];

        for (const product of result.products) {
          const previous = state.snapshot[product.id];
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
              id: `${product.id}-${Date.now()}-${releaseType}`,
              product: { ...product, releaseType, detectedAt: now },
              attempts: 0,
            });
          }

          state.snapshot[product.id] = {
            ...product,
            inStock: true,
            missingPolls: 0,
            lastSeenAt: now,
          };
        }

        if (state.baselineReady && result.complete) {
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
      const observedIds = new Set(products.map((product) => product.id));
      const newEvents = [];

      for (const product of products) {
        const previous = state.snapshot[product.id];
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
            id: `${product.id}-${Date.now()}-${releaseType}`,
            product: { ...product, releaseType, detectedAt: now },
            attempts: 0,
          });
        }

        state.snapshot[product.id] = {
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
        state.snapshot[product.id] = {
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
