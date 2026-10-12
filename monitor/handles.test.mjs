import assert from 'node:assert/strict';
import test from 'node:test';

import { handleShapeError, normalizeHandle } from './handles.mjs';
import { allowRequest, resetRateLimits } from './rate-limit.mjs';

test('handles need 4 characters and cannot repeat reserved names', () => {
  assert.equal(normalizeHandle('  @Zain.M '), 'zain.m');
  assert.equal(handleShapeError('ab'), 'Handle needs at least 4 characters.');
  assert.equal(handleShapeError('admin'), 'Already taken.');
  assert.equal(handleShapeError('zain'), null);
});

test('rate limit blocks the next call in the same window', () => {
  resetRateLimits();
  assert.equal(allowRequest('ip', 2, 1000, 0), true);
  assert.equal(allowRequest('ip', 2, 1000, 10), true);
  assert.equal(allowRequest('ip', 2, 1000, 20), false);
  assert.equal(allowRequest('ip', 2, 1000, 2000), true);
});
