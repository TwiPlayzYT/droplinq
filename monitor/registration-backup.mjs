import { billingConfig } from './billing.mjs';

const BUCKET = 'monitor-private';
const OBJECT_PATH = 'registrations.json';

const configured = () =>
  Boolean(billingConfig.supabaseUrl && billingConfig.supabaseServiceKey);

const root = () => billingConfig.supabaseUrl.replace(/\/$/, '');

const headers = (extra = {}) => ({
  apikey: billingConfig.supabaseServiceKey,
  Authorization: `Bearer ${billingConfig.supabaseServiceKey}`,
  ...extra,
});

let bucketReady = false;

async function ensureBucket() {
  if (bucketReady || !configured()) return;
  const response = await fetch(`${root()}/storage/v1/bucket`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
  });
  // 200 created, 409 already exists.
  if (response.ok || response.status === 409 || response.status === 400) {
    bucketReady = true;
  }
}

/** Restore push subscribers after a deploy. Uses the free Supabase project — no Render disk. */
export async function loadRegistrationsBackup() {
  if (!configured()) return null;
  try {
    await ensureBucket();
    const response = await fetch(`${root()}/storage/v1/object/${BUCKET}/${OBJECT_PATH}`, {
      headers: headers(),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
    return payload;
  } catch (error) {
    console.warn('[monitor] Could not load registration backup:', error.message);
    return null;
  }
}

export async function saveRegistrationsBackup(registrations) {
  if (!configured()) return;
  if (!registrations || Object.keys(registrations).length === 0) return;
  try {
    await ensureBucket();
    const response = await fetch(`${root()}/storage/v1/object/${BUCKET}/${OBJECT_PATH}`, {
      method: 'POST',
      headers: headers({
        'Content-Type': 'application/json',
        'x-upsert': 'true',
      }),
      body: JSON.stringify(registrations),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.warn('[monitor] Registration backup failed:', response.status, detail.slice(0, 180));
    }
  } catch (error) {
    console.warn('[monitor] Registration backup failed:', error.message);
  }
}

const NOTIFIED_PATH = 'notified-drops.json';

export async function loadNotifiedDropIds() {
  if (!configured()) return [];
  try {
    await ensureBucket();
    const response = await fetch(`${root()}/storage/v1/object/${BUCKET}/${NOTIFIED_PATH}`, {
      headers: headers(),
    });
    if (!response.ok) return [];
    const payload = await response.json();
    return Array.isArray(payload?.ids) ? payload.ids.filter((id) => typeof id === 'string') : [];
  } catch (error) {
    console.warn('[monitor] Could not load notified drops:', error.message);
    return [];
  }
}

export async function saveNotifiedDropIds(ids) {
  if (!configured()) return;
  if (!Array.isArray(ids) || ids.length === 0) return;
  try {
    await ensureBucket();
    const response = await fetch(`${root()}/storage/v1/object/${BUCKET}/${NOTIFIED_PATH}`, {
      method: 'POST',
      headers: headers({
        'Content-Type': 'application/json',
        'x-upsert': 'true',
      }),
      body: JSON.stringify({ ids: ids.slice(-500) }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.warn('[monitor] Notified-drop backup failed:', response.status, detail.slice(0, 180));
    }
  } catch (error) {
    console.warn('[monitor] Notified-drop backup failed:', error.message);
  }
}
