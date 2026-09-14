import { createHmac, timingSafeEqual } from 'node:crypto';

import { billingConfig, intervalFromPriceId, isKnownPriceId, stripeRequest } from './billing.mjs';

export function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!secret || !signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((item) => {
      const index = item.indexOf('=');
      return [item.slice(0, index), item.slice(index + 1)];
    }),
  );
  const timestamp = parts.t;
  const expected = parts.v1;
  if (!timestamp || !expected) return false;
  const ageMs = Math.abs(Date.now() - Number(timestamp) * 1000);
  if (!Number.isFinite(ageMs) || ageMs > 5 * 60_000) return false;
  const signed = `${timestamp}.${rawBody}`;
  const digest = createHmac('sha256', secret).update(signed, 'utf8').digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(digest, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

const supabaseHeaders = () => ({
  apikey: billingConfig.supabaseServiceKey,
  Authorization: `Bearer ${billingConfig.supabaseServiceKey}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
});

export async function updateProfileBilling(userId, patch) {
  if (!billingConfig.supabaseUrl || !billingConfig.supabaseServiceKey) {
    throw new Error('Supabase service role is not configured on the monitor.');
  }
  const response = await fetch(
    `${billingConfig.supabaseUrl.replace(/\/$/, '')}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
    {
      method: 'PATCH',
      headers: supabaseHeaders(),
      body: JSON.stringify({
        ...patch,
        updated_at: new Date().toISOString(),
      }),
    },
  );
  if (!response.ok) {
    throw new Error(`Profile billing update failed (${response.status})`);
  }
}

const ALLOWED_SUBTOTALS = new Set([699, 5988]);

export function billingPatchFromSubscription(subscription) {
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const status = subscription.status;
  const paid = status === 'active' && isKnownPriceId(priceId);
  return {
    stripe_customer_id: subscription.customer,
    stripe_subscription_id: subscription.id,
    billing_interval: intervalFromPriceId(priceId),
    subscription_tier: paid ? 'PRO' : 'FREE',
    subscription_status: paid
      ? 'active'
      : status === 'past_due'
        ? 'past_due'
        : 'canceled',
  };
}

function checkoutLooksPaid(session) {
  if (session.mode !== 'subscription') return false;
  if (session.payment_status !== 'paid') return false;
  if (session.currency && String(session.currency).toLowerCase() !== 'cad') return false;
  if (typeof session.amount_total === 'number' && session.amount_total <= 0) return false;
  if (typeof session.amount_subtotal === 'number' && !ALLOWED_SUBTOTALS.has(session.amount_subtotal)) {
    return false;
  }
  return true;
}

export async function applyStripeEvent(event) {
  const type = event.type;
  const object = event.data?.object;
  if (!object) return { ignored: true };

  if (type === 'checkout.session.completed') {
    const userId = object.client_reference_id ?? object.metadata?.user_id;
    if (!userId || !checkoutLooksPaid(object)) return { ignored: true };
    const subscriptionId = object.subscription;
    if (typeof subscriptionId !== 'string') return { ignored: true };
    const subscription = await stripeRequest('GET', `/subscriptions/${subscriptionId}`);
    const patch = billingPatchFromSubscription(subscription);
    if (patch.subscription_tier !== 'PRO') return { ignored: true };
    await updateProfileBilling(userId, {
      stripe_customer_id: object.customer ?? patch.stripe_customer_id,
      ...patch,
    });
    return { userId, applied: 'checkout' };
  }

  if (
    type === 'customer.subscription.created' ||
    type === 'customer.subscription.updated' ||
    type === 'customer.subscription.deleted'
  ) {
    const userId = object.metadata?.user_id;
    if (!userId) return { ignored: true };
    await updateProfileBilling(userId, billingPatchFromSubscription(object));
    return { userId, applied: type };
  }

  if (type === 'invoice.paid' || type === 'invoice.payment_failed') {
    if (type === 'invoice.paid' && typeof object.amount_paid === 'number' && object.amount_paid <= 0) {
      return { ignored: true };
    }
    const subscriptionId =
      typeof object.subscription === 'string' ? object.subscription : object.parent?.subscription_details?.subscription;
    if (!subscriptionId) return { ignored: true };
    const subscription = await stripeRequest('GET', `/subscriptions/${subscriptionId}`);
    const userId = subscription.metadata?.user_id;
    if (!userId) return { ignored: true };
    await updateProfileBilling(userId, billingPatchFromSubscription(subscription));
    return { userId, applied: type };
  }

  return { ignored: true };
}
