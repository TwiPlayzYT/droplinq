/** Public handles. Stored lowercase. Never repeated. */

export const HANDLE_MIN = 4;
export const HANDLE_MAX = 24;

const RESERVED = new Set([
  'admin',
  'administrator',
  'droplinq',
  'guest',
  'help',
  'mod',
  'moderator',
  'official',
  'owner',
  'root',
  'staff',
  'support',
  'system',
]);

export function normalizeHandle(raw) {
  return String(raw ?? '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, HANDLE_MAX);
}

/** @returns {string | null} A message the app can show, or null when the shape is fine. */
export function handleShapeError(handle) {
  if (handle.length < HANDLE_MIN) return `Handle needs at least ${HANDLE_MIN} characters.`;
  if (RESERVED.has(handle)) return 'Already taken.';
  return null;
}
