import type { AppearanceId } from '@/constants/appearance';
import { defaultAlertPreferences } from '@/constants/dropdex';
import { getSupabase } from '@/services/supabase/client';
import { AlertPreferences } from '@/types/dropdex';

export type CloudAlertPrefs = {
  alerts: AlertPreferences;
  includeNewReleases: boolean;
  includeRestocks: boolean;
  includePreorders: boolean;
  appearanceId?: AppearanceId;
};

function isAppearanceId(value: unknown): value is AppearanceId {
  return value === 'dark' || value === 'light' || value === 'droplinq';
}

export async function loadCloudAlertPreferences(userId: string): Promise<CloudAlertPrefs | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('alert_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  return {
    alerts: {
      push: row.push_notifications_enabled !== false,
      sound: row.alert_sound_enabled !== false,
      vibration: row.vibration_enabled !== false,
      speech: Boolean(row.speech_enabled),
      fullScreen: row.full_screen_enabled !== false,
      dropMode: Boolean(row.drop_mode_enabled),
    },
    includeNewReleases: row.new_release_alerts !== false,
    includeRestocks: row.restock_alerts !== false,
    includePreorders: row.preorder_alerts !== false,
    appearanceId: isAppearanceId(row.appearance_id) ? row.appearance_id : undefined,
  };
}

export async function syncCloudAlertPreferences(
  userId: string,
  input: {
    alerts: AlertPreferences;
    includeNewReleases: boolean;
    includeRestocks: boolean;
    includePreorders: boolean;
    appearanceId?: AppearanceId;
  },
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const row: Record<string, unknown> = {
    user_id: userId,
    restock_alerts: input.includeRestocks,
    new_release_alerts: input.includeNewReleases,
    preorder_alerts: input.includePreorders,
    push_notifications_enabled: input.alerts.push,
    alert_sound_enabled: input.alerts.sound,
    drop_mode_enabled: input.alerts.dropMode,
    vibration_enabled: input.alerts.vibration,
    speech_enabled: input.alerts.speech,
    full_screen_enabled: input.alerts.fullScreen,
    updated_at: new Date().toISOString(),
  };
  if (input.appearanceId) row.appearance_id = input.appearanceId;

  const { error } = await supabase.from('alert_preferences').upsert(row, { onConflict: 'user_id' });
  if (error) {
    const { vibration_enabled, speech_enabled, full_screen_enabled, appearance_id, ...legacy } = row;
    await supabase.from('alert_preferences').upsert(legacy, { onConflict: 'user_id' });
  }
}

export function withDefaultAlerts(alerts?: Partial<AlertPreferences>): AlertPreferences {
  return { ...defaultAlertPreferences, ...alerts };
}
