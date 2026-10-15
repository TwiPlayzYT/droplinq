import assert from 'node:assert/strict';
import test from 'node:test';

import { isQueueObservation } from './coverage-match.mjs';

test('only the virtual-queue notice is accepted as a queue observation', () => {
  assert.equal(
    isQueueObservation({
      id: 'queue-pokemon-center-2026-10-15',
      title: 'Pokémon Center queue is live',
      releaseType: 'queue',
      url: 'https://www.pokemoncenter.com',
    }),
    true,
  );
  assert.equal(
    isQueueObservation({
      id: '10-10465-166',
      title: '30th Celebration Mini Tin',
      releaseType: 'queue',
      url: 'https://www.pokemoncenter.com/product/10-10465-166',
    }),
    false,
  );
  assert.equal(
    isQueueObservation({
      id: 'queue-pokemon-center-2026-10-15',
      title: 'Pokémon Center queue is live',
      releaseType: 'new',
      url: 'https://www.pokemoncenter.com',
    }),
    false,
  );
});
