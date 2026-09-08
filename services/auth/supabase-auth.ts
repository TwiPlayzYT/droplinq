import { Platform } from 'react-native';

import { AuthAdapter, AuthProfile, AuthResult } from '@/services/auth/types';
import { signInAsGuest as createGuestSession } from '@/services/auth/guest-auth';
import { signInWithProvider as oauthSignIn, webRedirectUri } from '@/services/auth/oauth';
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
    if (!email.trim() || !password) {
      return { ok: false, message: 'Enter your email and password.' };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  },

  async signUp(email, password) {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, message: 'Supabase is not configured.' };
    if (!email.trim()) return { ok: false, message: 'Enter your email.' };
    if (password.length < 8) return { ok: false, message: 'Use at least 8 characters.' };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: Platform.OS === 'web' ? webRedirectUri() : undefined,
      },
    });
    if (error) return { ok: false, message: error.message };
    if (!data.session) return { ok: true, pendingEmailConfirm: true };
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Platform.OS === 'web' ? webRedirectUri() : undefined,
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  },

  async loadProfile(userId) {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data: userData } = await supabase.auth.getUser();
    const mapRow = (data: Record<string, unknown>): AuthProfile => ({
      id: String(data.id),
      email: userData.user?.email ?? '',
      username: (data.username as string | null) ?? null,
      dateOfBirth: (data.date_of_birth as string | null) ?? null,
      onboardingCompleted: Boolean(data.onboarding_completed),
      alertsActive: data.alerts_active !== false,
      selectedRegionId: (data.selected_region_id as string) ?? 'ca',
      subscriptionTier: (data.subscription_tier as AuthProfile['subscriptionTier']) ?? 'FREE',
      legalAcceptedAt: (data.legal_accepted_at as string | null) ?? null,
      legalVersion: (data.legal_version as string | null) ?? null,
      appearanceId: (data.appearance_id as string | null) ?? null,
    });

    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (!error && data) return mapRow(data as Record<string, unknown>);

    const { data: ensured } = await supabase.rpc('ensure_own_profile');
    if (ensured) return mapRow(ensured as Record<string, unknown>);

    const { data: created } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    return created ? mapRow(created as Record<string, unknown>) : null;
  },

  async saveProfile(userId, patch): Promise<AuthResult> {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, message: 'Supabase is not configured.' };
    const row: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (patch.username !== undefined) row.username = patch.username;
    if (patch.dateOfBirth !== undefined) row.date_of_birth = patch.dateOfBirth;
    if (patch.onboardingCompleted !== undefined) row.onboarding_completed = patch.onboardingCompleted;
    if (patch.alertsActive !== undefined) row.alerts_active = patch.alertsActive;
    if (patch.selectedRegionId !== undefined) row.selected_region_id = patch.selectedRegionId;
    if (patch.subscriptionTier !== undefined) row.subscription_tier = patch.subscriptionTier;
    if (patch.legalAcceptedAt !== undefined) row.legal_accepted_at = patch.legalAcceptedAt;
    if (patch.legalVersion !== undefined) row.legal_version = patch.legalVersion;
    if (patch.appearanceId !== undefined) row.appearance_id = patch.appearanceId;

    await supabase.rpc('ensure_own_profile');

    const { data, error } = await supabase
      .from('profiles')
      .update(row)
      .eq('id', userId)
      .select('id')
      .maybeSingle();

    if (error) {
      const { appearance_id: _appearance, ...withoutAppearance } = row;
      const retry = await supabase.from('profiles').update(withoutAppearance).eq('id', userId).select('id').maybeSingle();
      if (retry.error) return { ok: false, message: retry.error.message };
      if (retry.data) return { ok: true };
    } else if (data) {
      return { ok: true };
    }

    const insertRow: Record<string, unknown> = { id: userId, ...row };
    const inserted = await supabase.from('profiles').insert(insertRow).select('id').maybeSingle();
    if (inserted.error) {
      const { appearance_id: _appearance, ...withoutAppearance } = insertRow;
      const retryInsert = await supabase.from('profiles').insert(withoutAppearance).select('id').maybeSingle();
      if (retryInsert.error) return { ok: false, message: retryInsert.error.message };
      if (!retryInsert.data) {
        return { ok: false, message: 'Could not save your profile. Try Accept and continue again.' };
      }
      return { ok: true };
    }
    if (!inserted.data) {
      return { ok: false, message: 'Could not save your profile. Try Accept and continue again.' };
    }
    return { ok: true };
  },
};
