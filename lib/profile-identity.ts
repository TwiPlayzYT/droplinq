import type { AuthProfile } from '@/services/auth/types';

export const DISPLAY_NAME_MAX = 24;
export const HANDLE_MAX = 24;
export const HANDLE_MIN = 3;

export function displayNameFrom(profile: AuthProfile | null | undefined) {
  const named = profile?.displayName?.trim();
  if (named) return named;
  const handle = profile?.username?.trim();
  if (handle) return handle.replace(/^@/, '');
  if (profile?.email && profile.email !== 'guest@droplinq.local') {
    return profile.email.split('@')[0] || 'Account';
  }
  return 'Guest';
}

export function handleFrom(profile: AuthProfile | null | undefined) {
  const handle = profile?.username?.trim().replace(/^@/, '');
  if (handle) return handle;
  if (profile?.email === 'guest@droplinq.local') return 'guest';
  if (profile?.email) {
    return (
      profile.email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9._]/g, '')
        .replace(/^\.+|\.+$/g, '')
        .slice(0, HANDLE_MAX) || 'droplinq'
    );
  }
  return 'droplinq';
}

export function sanitizeDisplayName(value: string) {
  return value.replace(/\s+/g, ' ').trim().slice(0, DISPLAY_NAME_MAX);
}

export function sanitizeHandle(value: string) {
  return value
    .replace(/^@/, '')
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, HANDLE_MAX);
}

export function validateProfileIdentity(input: { displayName: string; handle: string }) {
  const displayName = sanitizeDisplayName(input.displayName);
  const handle = sanitizeHandle(input.handle);
  if (displayName.length < 1) return { ok: false as const, message: 'Enter a display name.' };
  if (handle.length < HANDLE_MIN) {
    return { ok: false as const, message: `Handle needs at least ${HANDLE_MIN} characters.` };
  }
  return { ok: true as const, displayName, handle };
}
