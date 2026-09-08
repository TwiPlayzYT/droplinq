import { useEffect, useRef } from 'react';

import type { AppearanceId } from '@/constants/appearance';
import { authAdapter } from '@/services/auth';
import { isGuestUserId } from '@/services/auth/guest-auth';
import { useAppearance } from '@/store/appearance-context';
import { useAuth } from '@/store/auth-context';
import { syncCloudAlertPreferences } from '@/services/user-prefs';
import { useDropDex } from '@/store/dropdex-context';

function asAppearanceId(value: unknown): AppearanceId | null {
  return value === 'dark' || value === 'light' || value === 'droplinq' ? value : null;
}

/** Restore appearance from the signed-in profile and persist later changes. */
export function UserAppearanceSync() {
  const { profile, session } = useAuth();
  const { appearanceId, setAppearance, ready } = useAppearance();
  const { alerts, filters, hydrated } = useDropDex();
  const skipSave = useRef(true);
  const appliedUser = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    const userId = session?.user.id;
    if (!userId || isGuestUserId(userId)) {
      appliedUser.current = userId ?? 'guest';
      return;
    }
    if (appliedUser.current === userId) return;
    const fromProfile = asAppearanceId(profile?.appearanceId);
    appliedUser.current = userId;
    skipSave.current = true;
    if (fromProfile && fromProfile !== appearanceId) {
      setAppearance(fromProfile);
    }
  }, [appearanceId, profile?.appearanceId, ready, session?.user.id, setAppearance]);

  useEffect(() => {
    if (!ready || !hydrated) return;
    const userId = session?.user.id;
    if (!userId || isGuestUserId(userId)) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    void authAdapter.saveProfile(userId, { appearanceId }).catch(() => undefined);
    void syncCloudAlertPreferences(userId, {
      alerts,
      includeNewReleases: filters.includeNewReleases,
      includeRestocks: filters.includeRestocks,
      includePreorders: filters.includePreorders,
      appearanceId,
    }).catch(() => undefined);
  }, [
    alerts,
    appearanceId,
    filters.includeNewReleases,
    filters.includePreorders,
    filters.includeRestocks,
    hydrated,
    ready,
    session?.user.id,
  ]);

  return null;
}
