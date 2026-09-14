const SITE_URL = (process.env.PUBLIC_SITE_URL ?? 'https://getdroplinq.com').replace(/\/$/, '');
const STRIPE_API = 'https://api.stripe.com/v1';

const PRODUCT_PRO = process.env.STRIPE_PRODUCT_ID ?? 'prod_VFvX4cggggQGDW';
const PRICE_MONTHLY = process.env.STRIPE_PRICE_MONTHLY ?? 'price_1UFPgoRBL2iCt8U25j53wi6x';
const PRICE_ANNUAL = process.env.STRIPE_PRICE_ANNUAL ?? 'price_1UFPgpRBL2iCt8U2cnMhBf6T';

export const billingConfig = {
  siteUrl: SITE_URL,
  secretKey: process.env.STRIPE_SECRET_KEY ?? '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  supabaseUrl: process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  automaticTax: process.env.STRIPE_AUTOMATIC_TAX !== 'false',
};

export const billingReady = () => Boolean(billingConfig.secretKey);

const flatten = (value, prefix = '', out = {}) => {
  if (value === undefined || value === null) return out;
  if (Array.isArray(value)) {
    value.forEach((item, index) => flatten(item, `${prefix}[${index}]`, out));
    return out;
  }
  if (typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      flatten(nested, prefix ? `${prefix}[${key}]` : key, out);
    }
    return out;
  }
  out[prefix] = String(value);
  return out;
};

export async function stripeRequest(method, path, body) {
  if (!billingConfig.secretKey) throw new Error('Stripe is not configured on the monitor.');
  const headers = {
    Authorization: `Bearer ${billingConfig.secretKey}`,
    'Stripe-Version': '2024-06-20',
  };
  let encoded;
  if (body) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    encoded = new URLSearchParams(flatten(body)).toString();
  }
  const response = await fetch(`${STRIPE_API}${path}`, { method, headers, body: encoded });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error?.message ?? `Stripe request failed (${response.status})`);
  }
  return json;
}

export function priceIdForInterval(interval) {
  return interval === 'annual' ? PRICE_ANNUAL : PRICE_MONTHLY;
}

export function intervalFromPriceId(priceId) {
  if (priceId === PRICE_ANNUAL) return 'annual';
  if (priceId === PRICE_MONTHLY) return 'monthly';
  return 'monthly';
}

export async function requireSignedInUser(request) {
  const header = request.headers.authorization ?? '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token || token === 'guest.local') {
    throw new Error('Sign in with a real account before paying.');
  }
  if (!billingConfig.supabaseUrl || !billingConfig.supabaseAnonKey) {
    throw new Error('Auth is not configured on the monitor.');
  }
  const response = await fetch(`${billingConfig.supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: billingConfig.supabaseAnonKey,
    },
  });
  if (!response.ok) throw new Error('Your session expired. Sign in again, then retry checkout.');
  const user = await response.json();
  if (!user?.id || user.id === 'guest-local') {
    throw new Error('Guest mode cannot be billed. Create a real account first.');
  }
  if (typeof user.email !== 'string' || !user.email.includes('@') || user.email.endsWith('@droplinq.local')) {
    throw new Error('Add a real email to your account before checkout.');
  }
  return { id: String(user.id), email: String(user.email) };
}

export function isKnownPriceId(priceId) {
  return priceId === PRICE_MONTHLY || priceId === PRICE_ANNUAL;
}

export async function loadStripeCustomerId(userId, accessToken) {
  if (!billingConfig.supabaseUrl || !billingConfig.supabaseAnonKey || !accessToken) return null;
  const response = await fetch(
    `${billingConfig.supabaseUrl.replace(/\/$/, '')}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=stripe_customer_id`,
    {
      headers: {
        apikey: billingConfig.supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  if (!response.ok) return null;
  const rows = await response.json();
  const customerId = Array.isArray(rows) ? rows[0]?.stripe_customer_id : rows?.stripe_customer_id;
  return typeof customerId === 'string' && customerId.startsWith('cus_') ? customerId : null;
}

export async function createCheckoutSession({ user, interval, customerId }) {
  const price = priceIdForInterval(interval);
  const success = `${billingConfig.siteUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancel = `${billingConfig.siteUrl}/billing/cancel`;
  let customer = customerId;

  if (!customer) {
    const created = await stripeRequest('POST', '/customers', {
      email: user.email,
      metadata: { user_id: user.id },
    });
    customer = created.id;
  }

  const payload = {
    mode: 'subscription',
    customer,
    client_reference_id: user.id,
    success_url: success,
    cancel_url: cancel,
    billing_address_collection: 'required',
    allow_promotion_codes: 'false',
    payment_method_collection: 'always',
    line_items: [{ price, quantity: 1 }],
    subscription_data: {
      metadata: { user_id: user.id, interval },
    },
    metadata: { user_id: user.id, interval },
    custom_text: {
      submit: {
        message:
          'Taxes (GST/HST/VAT where required) are added on top of the plan price from your billing address. Subscriptions auto-renew until you cancel.',
      },
    },
  };

  if (billingConfig.automaticTax) {
    payload.automatic_tax = { enabled: 'true' };
    payload.tax_id_collection = { enabled: 'true' };
    payload.customer_update = { address: 'auto', name: 'auto' };
    payload.adaptive_pricing = { enabled: 'false' };
  }

  try {
    payload.consent_collection = { terms_of_service: 'required' };
    return await stripeRequest('POST', '/checkout/sessions', payload);
  } catch (error) {
    if (!/terms of service/i.test(error.message)) throw error;
    delete payload.consent_collection;
    return stripeRequest('POST', '/checkout/sessions', payload);
  }
}

export async function createPortalSession({ customerId }) {
  if (!customerId) throw new Error('No Stripe customer is on this account yet.');
  const body = {
    customer: customerId,
    return_url: `${billingConfig.siteUrl}/settings`,
  };
  try {
    return await stripeRequest('POST', '/billing_portal/sessions', body);
  } catch (error) {
    if (!/configuration|not been set up|default/i.test(error.message)) throw error;
    const configuration = await stripeRequest('POST', '/billing_portal/configurations', {
      business_profile: {
        privacy_policy_url: `${billingConfig.siteUrl}/legal/privacy`,
        terms_of_service_url: `${billingConfig.siteUrl}/legal/terms`,
      },
      features: {
        customer_update: { enabled: 'true', allowed_updates: ['email', 'address', 'name'] },
        invoice_history: { enabled: 'true' },
        payment_method_update: { enabled: 'true' },
        subscription_cancel: { enabled: 'true', mode: 'at_period_end' },
        subscription_update: {
          enabled: 'true',
          default_allowed_updates: ['price'],
          proration_behavior: 'create_prorations',
          products: [{ product: PRODUCT_PRO, prices: [PRICE_MONTHLY, PRICE_ANNUAL] }],
        },
      },
    });
    return stripeRequest('POST', '/billing_portal/sessions', {
      ...body,
      configuration: configuration.id,
    });
  }
}

export async function retrieveCheckoutSession(sessionId) {
  return stripeRequest('GET', `/checkout/sessions/${encodeURIComponent(sessionId)}`);
}

export async function retrieveSubscription(subscriptionId) {
  return stripeRequest('GET', `/subscriptions/${encodeURIComponent(subscriptionId)}`);
}
