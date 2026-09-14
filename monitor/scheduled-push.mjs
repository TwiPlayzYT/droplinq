import { randomUUID } from 'node:crypto';

import { isValidWebPushSubscription, sendTestWebPush } from './web-push.mjs';

const MAX_DELAY_MS = 15 * 60_000;
const MAX_JOBS = 80;

export function createScheduledPushRunner(store) {
  const timers = new Map();

  const persist = async (mutator) => store.update(mutator);

  const dropJob = async (id) => {
    const timer = timers.get(id);
    if (timer) clearTimeout(timer);
    timers.delete(id);
    await persist((state) => {
      state.scheduledPushes = (state.scheduledPushes ?? []).filter((job) => job.id !== id);
      return state;
    });
  };

  const arm = (job) => {
    if (timers.has(job.id)) return;
    const delay = Math.max(0, new Date(job.fireAt).getTime() - Date.now());
    const timer = setTimeout(() => {
      void (async () => {
        try {
          try {
            await sendTestWebPush(job.subscription, job.product);
          } catch (firstError) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            await sendTestWebPush(job.subscription, job.product).catch(() => {
              throw firstError;
            });
          }
          console.log(`[scheduled-push] sent ${job.id}`);
        } catch (error) {
          console.error(
            `[scheduled-push] ${job.id} failed:`,
            error instanceof Error ? error.message : error,
          );
        } finally {
          await dropJob(job.id);
        }
      })();
    }, delay);
    timers.set(job.id, timer);
  };

  return {
    async restore() {
      const jobs = store.getState().scheduledPushes ?? [];
      for (const job of jobs) arm(job);
    },

    async schedule({ subscription, product, delayMs, installationId }) {
      if (!isValidWebPushSubscription(subscription)) {
        throw new Error('A valid Web Push subscription is required.');
      }
      const delay = Math.min(Math.max(Number(delayMs) || 0, 0), MAX_DELAY_MS);
      const job = {
        id: randomUUID(),
        fireAt: new Date(Date.now() + delay).toISOString(),
        installationId:
          typeof installationId === 'string' ? installationId.slice(0, 128) : undefined,
        subscription,
        product: product ?? {
          id: 'droplinq-test-alert',
          title: 'DropLinq Test Alert',
          url: 'https://www.pokemoncenter.com/en-ca/category/trading-card-game',
        },
      };

      await persist((state) => {
        const existing = (state.scheduledPushes ?? []).filter(
          (item) => !job.installationId || item.installationId !== job.installationId,
        );
        state.scheduledPushes = [...existing, job].slice(-MAX_JOBS);
        return state;
      });
      arm(job);
      return { id: job.id, fireAt: job.fireAt };
    },
  };
}
