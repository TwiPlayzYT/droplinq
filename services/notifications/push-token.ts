import { getExpoPushToken } from '@/services/notification-service';
import { getSupabase } from '@/services/supabase/client';
import { effectiveDataMode } from '@/config/app-config';
import { Platform } from 'react-native';

export async function syncPushToken(userId: string) {
  const token = await getExpoPushToken();
  if (!token) return;

  if (effectiveDataMode !== 'supabase') return;

  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      expo_push_token: token,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,expo_push_token' },
  );
}
