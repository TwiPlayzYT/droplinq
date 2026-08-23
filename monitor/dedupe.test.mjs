import assert from 'node:assert/strict';
import test from 'node:test';

const shouldNotify = ({ lastNotifiedAt, windowMs = 10 * 60 * 1000, now = Date.now() }) => {
  if (!lastNotifiedAt) return true;
  return now - new Date(lastNotifiedAt).getTime() >= windowMs;
};

test('dedupes alerts inside the quiet window', () => {
  const now = Date.parse('2026-01-01T12:00:00Z');
  assert.equal(shouldNotify({ lastNotifiedAt: null, now }), true);
  assert.equal(
    shouldNotify({ lastNotifiedAt: '2026-01-01T11:55:00Z', now }),
    false,
  );
  assert.equal(
    shouldNotify({ lastNotifiedAt: '2026-01-01T11:40:00Z', now }),
    true,
  );
});
