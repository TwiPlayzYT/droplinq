import assert from 'node:assert/strict';
import test from 'node:test';

import { isValidWebPushSubscription } from './web-push.mjs';

test('accepts a standards-based HTTPS Web Push subscription', () => {
  assert.equal(
    isValidWebPushSubscription({
      endpoint: 'https://web.push.apple.com/QH7/example',
      expirationTime: null,
      keys: {
        auth: 'auth-token',
        p256dh: 'public-key',
      },
    }),
    true,
  );
});

test('rejects insecure or incomplete Web Push subscriptions', () => {
  assert.equal(
    isValidWebPushSubscription({
      endpoint: 'http://example.com/push',
      keys: { auth: 'auth-token', p256dh: 'public-key' },
    }),
    false,
  );
  assert.equal(
    isValidWebPushSubscription({
      endpoint: 'https://example.com/push',
      keys: { auth: 'auth-token' },
    }),
    false,
  );
});
