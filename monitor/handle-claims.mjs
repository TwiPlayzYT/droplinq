import { billingConfig } from './billing.mjs';
import { handleShapeError, normalizeHandle } from './handles.mjs';

const BUCKET = 'monitor-private';

const configured = () => Boolean(billingConfig.supabaseUrl && billingConfig.supabaseServiceKey);

const root = () => billingConfig.supabaseUrl.replace(/\/$/, '');

const headers = (extra = {}) => ({
  apikey: billingConfig.supabaseServiceKey,
  Authorization: `Bearer ${billingConfig.supabaseServiceKey}`,
  ...extra,
});

function lockPath(handle) {
  return `handles/${encodeURIComponent(handle)}.json`;
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function ownerOf(handle) {
  const pattern = handle.replace(/[%_\\]/g, (char) => `\\${char}`);
  const url = `${root()}/rest/v1/profiles?select=id,username&username=ilike.${encodeURIComponent(pattern)}`;
  const response = await fetch(url, { headers: headers() });
  if (!response.ok) return { error: true, row: null };
  const rows = await readJson(response);
  const row = Array.isArray(rows)
    ? rows.find((item) => String(item?.username ?? '').toLowerCase() === handle)
    : null;
  return { error: false, row: row ?? null };
}

async function readLock(handle) {
  const response = await fetch(`${root()}/storage/v1/object/${BUCKET}/${lockPath(handle)}`, {
    headers: headers(),
  });
  if (!response.ok) return null;
  const payload = await readJson(response);
  return payload && typeof payload.userId === 'string' ? payload : null;
}

async function writeLock(handle, userId) {
  const response = await fetch(`${root()}/storage/v1/object/${BUCKET}/${lockPath(handle)}`, {
    method: 'POST',
    headers: headers({
      'Content-Type': 'application/json',
      'x-upsert': 'false',
    }),
    body: JSON.stringify({ userId, handle }),
  });
  if (response.ok) return 'created';
  if (response.status === 400 || response.status === 409) return 'exists';
  return 'failed';
}

async function deleteLock(handle, userId) {
  const current = await readLock(handle);
  if (!current || current.userId !== userId) return;
  await fetch(`${root()}/storage/v1/object/${BUCKET}/${lockPath(handle)}`, {
    method: 'DELETE',
    headers: headers(),
  }).catch(() => undefined);
}

async function writeUsername(userId, handle) {
  const response = await fetch(
    `${root()}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
    {
      method: 'PATCH',
      headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=representation' }),
      body: JSON.stringify({
        username: handle,
        updated_at: new Date().toISOString(),
      }),
    },
  );
  if (!response.ok) return false;
  const rows = await readJson(response);
  return Array.isArray(rows) && rows.length > 0;
}

export async function checkHandleAvailable(raw, userId) {
  const handle = normalizeHandle(raw);
  const shape = handleShapeError(handle);
  if (shape) return { ok: false, message: shape, handle };
  if (!configured()) return { ok: true, handle, unchecked: true };

  const found = await ownerOf(handle);
  if (found.error) return { ok: false, message: 'Could not check that handle. Try again.', handle };
  if (found.row && found.row.id !== userId) return { ok: false, message: 'Already taken.', handle };

  const lock = await readLock(handle);
  if (lock && lock.userId !== userId) return { ok: false, message: 'Already taken.', handle };
  return { ok: true, handle };
}

export async function claimHandle(raw, userId) {
  const handle = normalizeHandle(raw);
  const shape = handleShapeError(handle);
  if (shape) return { ok: false, message: shape };
  if (!configured()) return { ok: false, message: 'Could not save that handle. Try again.' };

  const current = await ownerOf(handle);
  if (current.error) return { ok: false, message: 'Could not save that handle. Try again.' };
  if (current.row && current.row.id !== userId) return { ok: false, message: 'Already taken.' };

  const mine = await fetch(
    `${root()}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=username`,
    { headers: headers() },
  );
  const mineRows = mine.ok ? await readJson(mine) : null;
  const previous =
    Array.isArray(mineRows) && mineRows[0]?.username
      ? normalizeHandle(mineRows[0].username)
      : '';

  if (previous === handle) return { ok: true, handle };

  const lock = await writeLock(handle, userId);
  if (lock === 'failed') return { ok: false, message: 'Could not save that handle. Try again.' };
  if (lock === 'exists') {
    const existing = await readLock(handle);
    if (!existing || existing.userId !== userId) return { ok: false, message: 'Already taken.' };
  }

  const saved = await writeUsername(userId, handle);
  if (!saved) {
    if (lock === 'created') await deleteLock(handle, userId);
    return { ok: false, message: 'Could not save that handle. Try again.' };
  }

  if (previous && previous !== handle) await deleteLock(previous, userId);
  return { ok: true, handle };
}
