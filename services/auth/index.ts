import { effectiveDataMode } from '@/config/app-config';
import {
  clearGuestSession,
  getGuestSession,
  isGuestUserId,
  loadGuestProfile,
  saveGuestProfile,
  signInAsGuest,
  subscribeGuestAuth,
} from '@/services/auth/guest-auth';
import { mockAuth } from '@/services/auth/mock-auth';
import { supabaseAuth } from '@/services/auth/supabase-auth';
import { AuthAdapter, AuthResult, OAuthProvider } from '@/services/auth/types';

const base: AuthAdapter = effectiveDataMode === 'supabase' ? supabaseAuth : mockAuth;

export const authAdapter: AuthAdapter = {
  async getSession() {
    const guest = await getGuestSession();
    if (guest.session) return guest;
    return base.getSession();
  },

  onAuthStateChange(callback) {
    const unsubGuest = subscribeGuestAuth(callback);
    const unsubBase = base.onAuthStateChange(callback);
    return () => {
      unsubGuest();
      unsubBase();
    };
  },

  signIn: (email, password) => base.signIn(email, password),
  signUp: (email, password) => base.signUp(email, password),
  signInWithProvider: (provider: OAuthProvider) => base.signInWithProvider(provider),

  async signInAsGuest() {
    return signInAsGuest();
  },

  async signOut() {
    await clearGuestSession();
    await base.signOut();
  },

  requestPasswordReset: (email) => base.requestPasswordReset(email),

  async loadProfile(userId) {
    if (isGuestUserId(userId)) return loadGuestProfile();
    return base.loadProfile(userId);
  },

  async saveProfile(userId, patch) {
    if (isGuestUserId(userId)) return saveGuestProfile(patch);
    return base.saveProfile(userId, patch);
  },
};

export type { AuthResult };
