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
      displayName: (data.display_name as string | null) ?? null,
      dateOfBirth: (data.date_of_birth as string | null) ?? null,
      onboardingCompleted: Boolean(data.onboarding_completed),
      alertsActive: data.alerts_active !== false,
      selectedRegionId: (data.selected_region_id as string) ?? 'ca',
      subscriptionTier: (data.subscription_tier as AuthProfile['subscriptionTier']) ?? 'FREE',
      firstDropDay: (data.first_drop_day as string | null) ?? null,
      subscriptionStatus: (data.subscription_status as AuthProfile['subscriptionStatus']) ?? null,
      billingInterval: (data.billing_interval as AuthProfile['billingInterval']) ?? null,
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
    if (patch.displayName !== undefined) row.display_name = patch.displayName;
    if (patch.dateOfBirth !== undefined) row.date_of_birth = patch.dateOfBirth;
    if (patch.onboardingCompleted !== undefined) row.onboarding_completed = patch.onboardingCompleted;
    if (patch.alertsActive !== undefined) row.alerts_active = patch.alertsActive;
    if (patch.selectedRegionId !== undefined) row.selected_region_id = patch.selectedRegionId;
    if (patch.subscriptionTier !== undefined) row.subscription_tier = patch.subscriptionTier;
    if (patch.firstDropDay !== undefined) row.first_drop_day = patch.firstDropDay;
    if (patch.subscriptionStatus !== undefined) row.subscription_status = patch.subscriptionStatus;
    if (patch.billingInterval !== undefined) row.billing_interval = patch.billingInterval;
    if (patch.legalAcceptedAt !== undefined) row.legal_accepted_at = patch.legalAcceptedAt;
    if (patch.legalVersion !== undefined) row.legal_version = patch.legalVersion;
    if (patch.appearanceId !== undefined) row.appearance_id = patch.appearanceId;

    await supabase.rpc('ensure_own_profile');

    const stripOptional = (payload: Record<string, unknown>, keys: string[]) => {
      const next = { ...payload };
      for (const key of keys) delete next[key];
      return next;
    };
    const variants = [
      row,
      stripOptional(row, ['display_name']),
      stripOptional(row, ['appearance_id']),
      stripOptional(row, ['first_drop_day', 'subscription_status', 'billing_interval']),
      stripOptional(row, ['display_name', 'appearance_id']),
      stripOptional(row, [
        'display_name',
        'appearance_id',
        'first_drop_day',
        'subscription_status',
        'billing_interval',
      ]),
    ];

    let lastError = 'Could not save your profile. Try Accept and continue again.';
    for (const payload of variants) {
      const updated = await supabase.from('profiles').update(payload).eq('id', userId).select('id').maybeSingle();
      if (!updated.error && updated.data) return { ok: true };
      if (updated.error) lastError = updated.error.message;
      else break;
    }

    for (const payload of variants) {
      const inserted = await supabase.from('profiles').insert({ id: userId, ...payload }).select('id').maybeSingle();
      if (!inserted.error && inserted.data) return { ok: true };
      if (inserted.error) lastError = inserted.error.message;
    }
    return { ok: false, message: lastError };
  },
};
