import { createHmac } from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';

import { verifyStripeSignature, billingPatchFromSubscription, applyStripeEvent } from './billing-webhook.mjs';

test('accepts a valid Stripe webhook signature and rejects tampering', () => {
  const secret = 'whsec_test';
  const rawBody = '{"id":"evt_1"}';
  const timestamp = String(Math.floor(Date.now() / 1000));
  const v1 = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  assert.equal(verifyStripeSignature(rawBody, `t=${timestamp},v1=${v1}`, secret), true);
  assert.equal(verifyStripeSignature(`${rawBody} `, `t=${timestamp},v1=${v1}`, secret), false);
});

test('maps an active Stripe subscription to paid Pro', () => {
  const patch = billingPatchFromSubscription({
    id: 'sub_1',
    customer: 'cus_1',
    status: 'active',
    items: { data: [{ price: { id: 'price_1UFPgpRBL2iCt8U2cnMhBf6T' } }] },
  });
  assert.equal(patch.subscription_tier, 'PRO');
  assert.equal(patch.subscription_status, 'active');
  assert.equal(patch.billing_interval, 'annual');
});

test('does not grant Pro for Stripe trial, incomplete, or unknown prices', () => {
  const trialing = billingPatchFromSubscription({
    id: 'sub_1',
    customer: 'cus_1',
    status: 'trialing',
    items: { data: [{ price: { id: 'price_1UFPgoRBL2iCt8U25j53wi6x' } }] },
  });
  assert.equal(trialing.subscription_tier, 'FREE');

  const unknown = billingPatchFromSubscription({
    id: 'sub_1',
    customer: 'cus_1',
    status: 'active',
    items: { data: [{ price: { id: 'price_other' } }] },
  });
  assert.equal(unknown.subscription_tier, 'FREE');
});

test('maps a deleted subscription back to free', () => {
  const patch = billingPatchFromSubscription({
    id: 'sub_1',
    customer: 'cus_1',
    status: 'canceled',
    items: { data: [{ price: { id: 'price_1UFPgoRBL2iCt8U25j53wi6x' } }] },
  });
  assert.equal(patch.subscription_tier, 'FREE');
  assert.equal(patch.subscription_status, 'canceled');
});

test('ignores unpaid or zero-amount checkout sessions', async () => {
  const unpaid = await applyStripeEvent({
    type: 'checkout.session.completed',
    data: {
      object: {
        mode: 'subscription',
        payment_status: 'unpaid',
        client_reference_id: 'user-1',
        amount_total: 699,
        amount_subtotal: 699,
        currency: 'cad',
      },
    },
  });
  assert.equal(unpaid.ignored, true);

  const free = await applyStripeEvent({
    type: 'checkout.session.completed',
    data: {
      object: {
        mode: 'subscription',
        payment_status: 'paid',
        client_reference_id: 'user-1',
        amount_total: 0,
        amount_subtotal: 0,
        currency: 'cad',
        subscription: 'sub_1',
      },
    },
  });
  assert.equal(free.ignored, true);

  const noPayRequired = await applyStripeEvent({
    type: 'checkout.session.completed',
    data: {
      object: {
        mode: 'subscription',
        payment_status: 'no_payment_required',
        client_reference_id: 'user-1',
        amount_total: 699,
        amount_subtotal: 699,
        currency: 'cad',
        subscription: 'sub_1',
      },
    },
  });
  assert.equal(noPayRequired.ignored, true);
});
