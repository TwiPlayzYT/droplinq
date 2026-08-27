import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';

import {
  APPEARANCE_ORDER,
  APPEARANCE_STORAGE_KEY,
  APPEARANCES,
  type AppearanceId,
  type AppearanceTokens,
  applyAppearanceCss,
  droplinqTokens,
} from '@/constants/appearance';

type AppearanceContextValue = {
  appearanceId: AppearanceId;
  ready: boolean;
  setAppearance: (id: AppearanceId) => void;
  tokens: AppearanceTokens;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function isAppearanceId(value: string | null): value is AppearanceId {
  return value === 'dark' || value === 'light' || value === 'droplinq';
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearanceId, setAppearanceId] = useState<AppearanceId>('droplinq');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(APPEARANCE_STORAGE_KEY)
      .then((saved) => {
        if (!alive) return;
        if (isAppearanceId(saved)) {
          setAppearanceId(saved);
          applyAppearanceCss(APPEARANCES[saved].tokens, saved);
        } else {
          applyAppearanceCss(droplinqTokens, 'droplinq');
        }
      })
      .catch(() => {
        applyAppearanceCss(droplinqTokens, 'droplinq');
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    applyAppearanceCss(APPEARANCES[appearanceId].tokens, appearanceId);
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', APPEARANCES[appearanceId].tokens.red);
    }
  }, [appearanceId, ready]);

  const setAppearance = useCallback((id: AppearanceId) => {
    setAppearanceId(id);
    void AsyncStorage.setItem(APPEARANCE_STORAGE_KEY, id);
  }, []);

  const value = useMemo(
    () => ({
      appearanceId,
      ready,
      setAppearance,
      tokens: APPEARANCES[appearanceId].tokens,
    }),
    [appearanceId, ready, setAppearance],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error('useAppearance must be used inside AppearanceProvider');
  return value;
}

export function useAppearanceOptions() {
  return APPEARANCE_ORDER.map((id) => APPEARANCES[id]);
}
