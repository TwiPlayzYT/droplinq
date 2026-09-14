import assert from 'node:assert/strict';
import test from 'node:test';

import { mergeRegistration } from './registration.mjs';

const subscription = {
  endpoint: 'https://web.push.apple.com/QH7/example',
  expirationTime: null,
  keys: { auth: 'auth-token', p256dh: 'public-key' },
};

test('keeps a stored Web Push subscription when a later register omits it', () => {
  const merged = mergeRegistration(
    {
      installationId: 'install-1',
      enabled: true,
      alerts: { push: true },
      webPushSubscription: subscription,
    },
    {
      installationId: 'install-1',
      enabled: true,
      alerts: { push: true },
      webPushSubscription: undefined,
    },
  );

  assert.deepEqual(merged.webPushSubscription, subscription);
  assert.equal(merged.alerts.push, true);
});

test('does not invent a subscription when none was ever stored', () => {
  const merged = mergeRegistration(undefined, {
    installationId: 'install-2',
    enabled: true,
    alerts: { push: true },
  });
  assert.equal(merged.webPushSubscription, undefined);
});
