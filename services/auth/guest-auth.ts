import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';

import { AuthProfile, AuthResult } from '@/services/auth/types';

const SESSION_KEY = '@droplinq/guest-auth/session';
const PROFILE_KEY = '@droplinq/guest-auth/profile';

const listeners = new Set<(session: Session | null) => void>();

const GUEST_ID = 'guest-local';

function guestSession(): Session {
  return {
    access_token: 'guest.local',
    refresh_token: 'guest',
    token_type: 'bearer',
    expires_in: 60 * 60 * 24 * 365,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
    user: {
      id: GUEST_ID,
      email: 'guest@droplinq.local',
      app_metadata: { provider: 'guest' },
      user_metadata: { guest: true },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as User,
  } as Session;
}

function defaultGuestProfile(): AuthProfile {
  return {
    id: GUEST_ID,
    email: 'guest@droplinq.local',
    username: 'Guest',
    dateOfBirth: null,
    onboardingCompleted: true,
    alertsActive: true,
    selectedRegionId: 'ca',
    subscriptionTier: 'FREE',
    legalAcceptedAt: null,
    legalVersion: null,
  };
}

export function isGuestUserId(userId: string | undefined | null) {
  return userId === GUEST_ID;
}

export function subscribeGuestAuth(callback: (session: Session | null) => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export async function getGuestSession(): Promise<{
  session: Session | null;
  user: User | null;
}> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return { session: null, user: null };
  try {
    const session = JSON.parse(raw) as Session;
    return { session, user: session.user };
  } catch {
    return { session: null, user: null };
  }
}

export async function loadGuestProfile(): Promise<AuthProfile | null> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AuthProfile>;
    return {
      ...defaultGuestProfile(),
      ...parsed,
      id: GUEST_ID,
      legalAcceptedAt: parsed.legalAcceptedAt ?? null,
      legalVersion: parsed.legalVersion ?? null,
    };
  } catch {
    return null;
  }
}

export async function saveGuestProfile(patch: Partial<AuthProfile>): Promise<AuthResult> {
  const existing = (await loadGuestProfile()) ?? defaultGuestProfile();
  const next = { ...existing, ...patch, id: GUEST_ID };
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  return { ok: true };
}

export async function signInAsGuest(): Promise<AuthResult> {
  const session = guestSession();
  const profile = (await loadGuestProfile()) ?? defaultGuestProfile();
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  listeners.forEach((listener) => listener(session));
  return { ok: true };
}

export async function clearGuestSession() {
  await AsyncStorage.multiRemove([SESSION_KEY, PROFILE_KEY]);
  listeners.forEach((listener) => listener(null));
}
