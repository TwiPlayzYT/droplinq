import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';

import { AuthAdapter, AuthProfile, AuthResult } from '@/services/auth/types';
import { signInAsGuest as createGuestSession } from '@/services/auth/guest-auth';

const USERS_KEY = '@droplinq/mock-auth/users';
const SESSION_KEY = '@droplinq/mock-auth/session';
const PROFILES_KEY = '@droplinq/mock-auth/profiles';

type StoredUser = { id: string; email: string; password: string };

const listeners = new Set<(session: Session | null) => void>();

const fakeSession = (user: StoredUser): Session =>
  ({
    access_token: `mock.${user.id}`,
    refresh_token: 'mock',
    token_type: 'bearer',
    expires_in: 86400,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    user: { id: user.id, email: user.email } as User,
  }) as Session;

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const mockAuth: AuthAdapter = {
  async getSession() {
    const session = await readJson<Session | null>(SESSION_KEY, null);
    return { session, user: session?.user ?? null };
  },

  onAuthStateChange(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  async signIn(email, password) {
    const users = await readJson<StoredUser[]>(USERS_KEY, []);
    const user = users.find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || user.password !== password) {
      return { ok: false, message: 'Email or password is incorrect.' };
    }
    const session = fakeSession(user);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    listeners.forEach((listener) => listener(session));
    return { ok: true };
  },

  async signUp(email, password) {
    if (password.length < 8) {
      return { ok: false, message: 'Use at least 8 characters.' };
    }
    const users = await readJson<StoredUser[]>(USERS_KEY, []);
    if (users.some((item) => item.email.toLowerCase() === email.trim().toLowerCase())) {
      return { ok: false, message: 'An account with that email already exists.' };
    }
    const user: StoredUser = {
      id: `mock-${Date.now()}`,
      email: email.trim().toLowerCase(),
      password,
    };
    users.push(user);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    const profiles = await readJson<Record<string, AuthProfile>>(PROFILES_KEY, {});
    profiles[user.id] = {
      id: user.id,
      email: user.email,
      username: user.email.split('@')[0],
      dateOfBirth: null,
      onboardingCompleted: false,
      alertsActive: true,
      selectedRegionId: 'ca',
      subscriptionTier: 'FREE',
      legalAcceptedAt: null,
      legalVersion: null,
    };
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    const session = fakeSession(user);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    listeners.forEach((listener) => listener(session));
    return { ok: true };
  },

  async signInWithProvider(provider) {
    const email = provider === 'apple' ? 'apple.mock@droplinq.app' : 'google.mock@droplinq.app';
    const users = await readJson<StoredUser[]>(USERS_KEY, []);
    let user = users.find((item) => item.email === email);
    if (!user) {
      user = { id: `mock-${provider}-${Date.now()}`, email, password: 'oauth' };
      users.push(user);
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
      const profiles = await readJson<Record<string, AuthProfile>>(PROFILES_KEY, {});
      profiles[user.id] = {
        id: user.id,
        email,
        username: provider,
        dateOfBirth: null,
        onboardingCompleted: false,
        alertsActive: true,
        selectedRegionId: 'ca',
        subscriptionTier: 'FREE',
        legalAcceptedAt: null,
        legalVersion: null,
      };
      await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    }
    const session = fakeSession(user);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    listeners.forEach((listener) => listener(session));
    return { ok: true };
  },

  async signInAsGuest() {
    return createGuestSession();
  },

  async signOut() {
    await AsyncStorage.removeItem(SESSION_KEY);
    listeners.forEach((listener) => listener(null));
  },

  async requestPasswordReset() {
    return {
      ok: true,
    };
  },

  async loadProfile(userId) {
    const profiles = await readJson<Record<string, AuthProfile>>(PROFILES_KEY, {});
    const session = await readJson<Session | null>(SESSION_KEY, null);
    const profile = profiles[userId];
    if (!profile) return null;
    return { ...profile, email: session?.user.email ?? profile.email };
  },

  async saveProfile(userId, patch) {
    const profiles = await readJson<Record<string, AuthProfile>>(PROFILES_KEY, {});
    const existing = profiles[userId];
    if (!existing) return { ok: false, message: 'Profile not found.' };
    profiles[userId] = { ...existing, ...patch, id: userId };
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    return { ok: true };
  },
};
