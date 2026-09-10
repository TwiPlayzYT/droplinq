import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Session } from '@supabase/supabase-js';

import { LEGAL_VERSION } from '@/constants/legal';
import { BILLING_ENFORCEMENT_ENABLED, dropDayKey } from '@/constants/billing';
import { authAdapter } from '@/services/auth';
import { AuthProfile, AuthResult, OAuthProvider } from '@/services/auth/types';

export function hasAcceptedCurrentLegal(profile: AuthProfile | null | undefined) {
  return Boolean(
    profile?.legalAcceptedAt && profile.legalVersion === LEGAL_VERSION,
  );
}

/** Where to send the user after auth once their profile is known. */
export function postAuthPath(profile: AuthProfile | null | undefined) {
  if (!hasAcceptedCurrentLegal(profile)) return '/(legal)/accept';
  if (!profile?.onboardingCompleted) return '/(onboarding)';
  return '/(tabs)';
}

type AuthContextValue = {
  ready: boolean;
  /** False while a session exists but profile fetch has not finished. */
  profileReady: boolean;
  session: Session | null;
  profile: AuthProfile | null;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signInWithProvider: (provider: OAuthProvider) => Promise<AuthResult>;
  signInAsGuest: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  acceptLegal: () => Promise<AuthResult>;
  completeOnboarding: (input: {
    dateOfBirth?: string | null;
    regionId: string;
    username?: string;
  }) => Promise<AuthResult>;
  updateIdentity: (input: { displayName: string; handle: string }) => Promise<AuthResult>;
  /** Records first real drop-alert day (trial boundary). Safe to call repeatedly. */
  markFirstDropDay: (isoTimestamp?: string) => Promise<AuthResult>;
  /**
   * Future checkout entry. While billing enforcement is off this only explains
   * that payments are not live yet (unless you pass dryRunActivate for local testing).
   */
  startProCheckout: (
    interval: 'monthly' | 'annual',
    options?: { dryRunActivate?: boolean },
  ) => Promise<AuthResult>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const loadProfile = useCallback(async (userId: string) => {
    const next = await authAdapter.loadProfile(userId);
    setProfile(next);
    profileRef.current = next;
    return next;
  }, []);

  const applySession = useCallback(
    async (next: Session | null) => {
      setSession(next);
      if (!next?.user.id) {
        setProfile(null);
        profileRef.current = null;
        setProfileReady(true);
        return null;
      }
      // Only block the UI when we don't already have this user's profile.
      const cached = profileRef.current;
      if (!cached || cached.id !== next.user.id) {
        setProfileReady(false);
      }
      const nextProfile = await loadProfile(next.user.id);
      setProfileReady(true);
      return nextProfile;
    },
    [loadProfile],
  );

  useEffect(() => {
    let mounted = true;
    authAdapter.getSession().then(async ({ session: current }) => {
      if (!mounted) return;
      await applySession(current);
      if (mounted) setReady(true);
    });
    const unsubscribe = authAdapter.onAuthStateChange(async (next) => {
      if (!mounted) return;
      await applySession(next);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [applySession]);

  const afterAuth = useCallback(
    async (result: AuthResult): Promise<AuthResult> => {
      if (!result.ok) return result;
      const { session: next } = await authAdapter.getSession();
      await applySession(next);
      return result;
    },
    [applySession],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      profileReady,
      session,
      profile,
      signIn: async (email, password) => afterAuth(await authAdapter.signIn(email, password)),
      signUp: async (email, password) => afterAuth(await authAdapter.signUp(email, password)),
      signInWithProvider: async (provider) =>
        afterAuth(await authAdapter.signInWithProvider(provider)),
      signInAsGuest: async () => afterAuth(await authAdapter.signInAsGuest()),
      signOut: () => authAdapter.signOut(),
      requestPasswordReset: (email) => authAdapter.requestPasswordReset(email),
      acceptLegal: async () => {
        if (!session?.user.id) return { ok: false, message: 'Not signed in.' };
        const result = await authAdapter.saveProfile(session.user.id, {
          legalAcceptedAt: new Date().toISOString(),
          legalVersion: LEGAL_VERSION,
        });
        if (result.ok) await loadProfile(session.user.id);
        return result;
      },
      completeOnboarding: async (input) => {
        if (!session?.user.id) return { ok: false, message: 'Not signed in.' };
        const result = await authAdapter.saveProfile(session.user.id, {
          ...(input.dateOfBirth !== undefined ? { dateOfBirth: input.dateOfBirth } : null),
          selectedRegionId: input.regionId,
          username: input.username,
          onboardingCompleted: true,
        });
        if (result.ok) await loadProfile(session.user.id);
        return result;
      },
      updateIdentity: async (input) => {
        if (!session?.user.id) return { ok: false, message: 'Not signed in.' };
        const result = await authAdapter.saveProfile(session.user.id, {
          displayName: input.displayName,
          username: input.handle,
        });
        if (result.ok) await loadProfile(session.user.id);
        return result;
      },
      markFirstDropDay: async (isoTimestamp) => {
        if (!session?.user.id) return { ok: false, message: 'Not signed in.' };
        if (profileRef.current?.firstDropDay) return { ok: true };
        const day = dropDayKey(isoTimestamp ?? new Date().toISOString());
        const result = await authAdapter.saveProfile(session.user.id, {
          firstDropDay: day,
          subscriptionStatus: profileRef.current?.subscriptionStatus ?? 'trialing',
        });
        if (result.ok) await loadProfile(session.user.id);
        return result;
      },
      startProCheckout: async (interval, options) => {
        if (!session?.user.id) return { ok: false, message: 'Not signed in.' };
        if (!BILLING_ENFORCEMENT_ENABLED && !options?.dryRunActivate) {
          return {
            ok: false,
            message:
              'Pro checkout is built but not live yet. Pricing is ready — we will turn payments on when DropLinq is advertised.',
          };
        }
        const result = await authAdapter.saveProfile(session.user.id, {
          subscriptionTier: 'PRO',
          subscriptionStatus: 'active',
          billingInterval: interval,
        });
        if (result.ok) await loadProfile(session.user.id);
        return result;
      },
      refreshProfile: async () => {
        if (session?.user.id) await loadProfile(session.user.id);
      },
    }),
    [afterAuth, loadProfile, profile, profileReady, ready, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
