import { Session, User } from '@supabase/supabase-js';

export type AuthProfile = {
  id: string;
  email: string;
  username: string | null;
  dateOfBirth: string | null;
  onboardingCompleted: boolean;
  alertsActive: boolean;
  selectedRegionId: string;
  subscriptionTier: 'FREE' | 'PRO' | 'PRO_PLUS';
  legalAcceptedAt: string | null;
  legalVersion: string | null;
};

export type OAuthProvider = 'google' | 'apple';

export type AuthResult = { ok: true } | { ok: false; message: string };

export interface AuthAdapter {
  getSession(): Promise<{ session: Session | null; user: User | null }>;
  onAuthStateChange(callback: (session: Session | null) => void): () => void;
  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(email: string, password: string): Promise<AuthResult>;
  signInWithProvider(provider: OAuthProvider): Promise<AuthResult>;
  signInAsGuest(): Promise<AuthResult>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<AuthResult>;
  loadProfile(userId: string): Promise<AuthProfile | null>;
  saveProfile(userId: string, patch: Partial<AuthProfile>): Promise<AuthResult>;
}
