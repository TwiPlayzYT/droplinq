import { AuthAdapter, AuthProfile, AuthResult } from '@/services/auth/types';
import { signInAsGuest as createGuestSession } from '@/services/auth/guest-auth';
import { signInWithProvider as oauthSignIn } from '@/services/auth/oauth';
import { getSupabase } from '@/services/supabase/client';

export const supabaseAuth: AuthAdapter = {
  async getSession() {
    const supabase = getSupabase();
    if (!supabase) return { session: null, user: null };
    const { data } = await supabase.auth.getSession();
    return { session: data.session, user: data.session?.user ?? null };
  },

  onAuthStateChange(callback) {
    const supabase = getSupabase();
    if (!supabase) return () => undefined;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
    return () => data.subscription.unsubscribe();
  },

  async signIn(email, password) {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, message: 'Supabase is not configured.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  },

  async signUp(email, password) {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, message: 'Supabase is not configured.' };
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  },

  async signInWithProvider(provider) {
    return oauthSignIn(provider);
  },

  async signInAsGuest() {
    return createGuestSession();
  },

  async signOut() {
    await getSupabase()?.auth.signOut();
  },

  async requestPasswordReset(email) {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, message: 'Supabase is not configured.' };
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  },

  async loadProfile(userId) {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error || !data) return null;
    const row = data as {
      id: string;
      username: string | null;
      date_of_birth: string | null;
      onboarding_completed: boolean;
      alerts_active: boolean;
      selected_region_id: string;
      subscription_tier: AuthProfile['subscriptionTier'];
      legal_accepted_at: string | null;
      legal_version: string | null;
    };
    return {
      id: row.id,
      email: userData.user?.email ?? '',
      username: row.username,
      dateOfBirth: row.date_of_birth,
      onboardingCompleted: row.onboarding_completed,
      alertsActive: row.alerts_active,
      selectedRegionId: row.selected_region_id,
      subscriptionTier: row.subscription_tier,
      legalAcceptedAt: row.legal_accepted_at ?? null,
      legalVersion: row.legal_version ?? null,
    };
  },

  async saveProfile(userId, patch): Promise<AuthResult> {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, message: 'Supabase is not configured.' };
    const { error } = await supabase
      .from('profiles')
      .update({
        username: patch.username,
        date_of_birth: patch.dateOfBirth,
        onboarding_completed: patch.onboardingCompleted,
        alerts_active: patch.alertsActive,
        selected_region_id: patch.selectedRegionId,
        subscription_tier: patch.subscriptionTier,
        legal_accepted_at: patch.legalAcceptedAt,
        legal_version: patch.legalVersion,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  },
};
