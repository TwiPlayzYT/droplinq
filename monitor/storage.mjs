import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const emptyState = () => ({
  registrations: {},
  snapshot: {},
  pendingEvents: [],
  webhookEventIds: [],
  baselineReady: false,
  lastObservationAt: null,
  lastObservationCount: 0,
});

export class JsonStore {
  #state = emptyState();
  #writeQueue = Promise.resolve();

  constructor(filePath) {
    this.filePath = filePath;
  }

  async load() {
    try {
      const saved = JSON.parse(await readFile(this.filePath, 'utf8'));
      this.#state = {
        ...emptyState(),
        ...saved,
        registrations: saved.registrations ?? {},
        snapshot: saved.snapshot ?? {},
        pendingEvents: saved.pendingEvents ?? [],
        webhookEventIds: saved.webhookEventIds ?? [],
      };
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  getState() {
    return structuredClone(this.#state);
  }

  async update(mutator) {
    const next = mutator(structuredClone(this.#state));
    this.#state = next;
    await this.#persist();
    return this.getState();
  }

  async #persist() {
    const serialized = JSON.stringify(this.#state, null, 2);
    const temporaryPath = `${this.filePath}.tmp`;

    this.#writeQueue = this.#writeQueue.then(async () => {
      await mkdir(dirname(this.filePath), { recursive: true });
      await writeFile(temporaryPath, serialized, 'utf8');
      await rename(temporaryPath, this.filePath);
    });

    return this.#writeQueue;
  }
}
