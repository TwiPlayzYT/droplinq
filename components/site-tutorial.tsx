import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { palette } from '@/constants/dropdex';
import {
  TUTORIAL_STEPS,
  TUTORIAL_STORAGE_KEY,
  type TutorialStep,
} from '@/constants/tutorial';
import { useWebLayout } from '@/hooks/use-web-layout';
import { hasAcceptedCurrentLegal, useAuth } from '@/store/auth-context';
import {
  DEVICE_PROMPT_DONE_KEY,
  isDevicePromptDoneMemory,
  subscribeDevicePromptDone,
} from '@/constants/preferred-device';

type TutorialStatus = 'unknown' | 'ask' | 'active' | 'done';

const restartListeners = new Set<() => void>();

export function requestTutorialRestart() {
  void AsyncStorage.removeItem(TUTORIAL_STORAGE_KEY);
  restartListeners.forEach((listener) => listener());
}

function tourSelector(anchor: string) {
  return `#tour-${anchor}, [data-tour="${anchor}"]`;
}

function measureAnchor(anchor: string) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return null;
  const node = document.querySelector(tourSelector(anchor));
  if (!node) return null;
  return node.getBoundingClientRect();
}

export function SiteTutorial() {
  const { profile, profileReady, session } = useAuth();
  const { isDesktopWeb } = useWebLayout();
  const { height, width } = useWindowDimensions();
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<TutorialStatus>('unknown');
  const [stepIndex, setStepIndex] = useState(0);
  const [deviceReady, setDeviceReady] = useState(false);
  const [anchorBox, setAnchorBox] = useState<DOMRect | null>(null);

  const legalOk = hasAcceptedCurrentLegal(profile);
  const onboarded = Boolean(profile?.onboardingCompleted);
  const mayRun =
    profileReady && Boolean(session) && legalOk && onboarded;

  useEffect(() => {
    const unsubRestart = (() => {
      const listener = () => {
        setStepIndex(0);
        setStatus('active');
      };
      restartListeners.add(listener);
      return () => restartListeners.delete(listener);
    })();

    const unsubDevice = subscribeDevicePromptDone(() => setDeviceReady(true));

    AsyncStorage.getItem(DEVICE_PROMPT_DONE_KEY)
      .then((value) => {
        setDeviceReady(value === '1' || isDevicePromptDoneMemory());
      })
      .catch(() => setDeviceReady(isDevicePromptDoneMemory()));

    return () => {
      unsubRestart();
      unsubDevice();
    };
  }, []);

  useEffect(() => {
    if (!mayRun || !deviceReady) return;
    let cancelled = false;
    AsyncStorage.getItem(TUTORIAL_STORAGE_KEY)
      .then((value) => {
        if (cancelled) return;
        if (value === 'done' || value === 'skipped') {
          setStatus('done');
          return;
        }
        if (profile?.email === 'guest@droplinq.local') {
          setStatus('done');
          return;
        }
        setStatus('ask');
      })
      .catch(() => {
        if (!cancelled) setStatus('ask');
      });
    return () => {
      cancelled = true;
    };
  }, [deviceReady, mayRun, profile?.email]);

  const step: TutorialStep | undefined = TUTORIAL_STEPS[stepIndex];

  useEffect(() => {
    if (status !== 'active' || !step) return;
    router.push(step.route);
  }, [status, step?.id]);

  useEffect(() => {
    if (status !== 'active' || !step) return;
    const timer = setTimeout(() => {
      setAnchorBox(measureAnchor(step.anchor));
    }, 280);
    return () => clearTimeout(timer);
  }, [pathname, status, step?.id, step?.anchor, width, height]);

  const persist = (value: 'done' | 'skipped') => {
    void AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, value);
    setStatus('done');
  };

  const go = (next: number) => {
    if (next < 0) {
      setStepIndex(0);
      return;
    }
    if (next >= TUTORIAL_STEPS.length) {
      persist('done');
      return;
    }
    setStepIndex(next);
  };

  const card = useMemo(() => {
    const cardWidth = Math.min(360, width - 32);
    const desktop = isDesktopWeb;
    const fallbackTop = desktop ? 88 : height * 0.42;
    const top = desktop
      ? Math.min((anchorBox?.bottom ?? 72) + 12, height - 220)
      : Math.max(24, (anchorBox?.top ?? fallbackTop) - 210);
    const left = Math.max(16, Math.min((width - cardWidth) / 2, width - cardWidth - 16));
    return { width: cardWidth, top, left, desktop };
  }, [anchorBox, height, isDesktopWeb, width]);

  if (!mayRun || status === 'unknown' || status === 'done') return null;

  if (status === 'ask') {
    return (
      <Modal animationType="fade" transparent visible>
        <View style={styles.scrim}>
          <View style={styles.askCard}>
            <Text style={styles.kicker}>FIRST RUN</Text>
            <Text style={styles.askTitle}>Want a quick tour?</Text>
            <Text style={styles.askBody}>
              Ten short steps highlight Home, Stock, Filter, Region, Settings, and Home Screen
              alerts. You can skip and replay it later from Settings.
            </Text>
            <Pressable
              onPress={() => {
                setStepIndex(0);
                setStatus('active');
              }}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
              <Text style={styles.primaryText}>Start tutorial</Text>
            </Pressable>
            <Pressable
              onPress={() => persist('skipped')}
              style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}>
              <Text style={styles.ghostText}>Not now</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  if (!step) return null;

  const pointerLeft = anchorBox
    ? Math.min(Math.max(anchorBox.left + anchorBox.width / 2 - card.left - 8, 24), card.width - 40)
    : card.width / 2 - 8;

  return (
    <Modal animationType="fade" transparent visible>
      <View pointerEvents="box-none" style={styles.overlay}>
        <Pressable onPress={() => persist('skipped')} style={styles.dim} />
        {anchorBox ? (
          <View
            pointerEvents="none"
            style={[
              styles.spotlight,
              {
                height: anchorBox.height + 10,
                left: anchorBox.left - 5,
                top: anchorBox.top - 5,
                width: anchorBox.width + 10,
              },
            ]}
          />
        ) : null}
        <View style={[styles.tip, { left: card.left, top: card.top, width: card.width }]}>
          {!card.desktop ? (
            <View style={[styles.pointerDown, { left: pointerLeft }]} />
          ) : (
            <View style={[styles.pointerUp, { left: pointerLeft }]} />
          )}
          <Text style={styles.tipTitle}>{step.title}</Text>
          <Text style={styles.tipBody}>{step.body}</Text>
          <View style={styles.tipFooter}>
            <Pressable onPress={() => setStepIndex(0)}>
              <Text style={styles.restart}>Restart</Text>
            </Pressable>
            <Text style={styles.count}>
              {stepIndex + 1} of {TUTORIAL_STEPS.length}
            </Text>
            <View style={styles.tipActions}>
              <Pressable
                disabled={stepIndex === 0}
                onPress={() => go(stepIndex - 1)}
                style={[styles.smallBtn, stepIndex === 0 && styles.smallBtnDisabled]}>
                <Text style={styles.smallBtnText}>Back</Text>
              </Pressable>
              <Pressable onPress={() => go(stepIndex + 1)} style={styles.doneBtn}>
                <Text style={styles.doneText}>
                  {stepIndex === TUTORIAL_STEPS.length - 1 ? 'Done' : 'Next'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  askCard: {
    backgroundColor: '#12141C',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 420,
    padding: 22,
    width: '100%',
  },
  kicker: {
    color: palette.red,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.8,
    marginBottom: 8,
  },
  askTitle: {
    color: '#F7F5F2',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    marginBottom: 10,
  },
  askBody: {
    color: '#C8C8CC',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 18,
  },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
    borderRadius: 14,
    minHeight: 48,
    justifyContent: 'center',
    marginBottom: 10,
  },
  primaryText: {
    color: '#0C0C0E',
    fontSize: 15,
    fontWeight: '800',
  },
  ghostBtn: {
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  ghostText: {
    color: '#C8C8CC',
    fontSize: 14,
    fontWeight: '700',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  spotlight: {
    borderColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 2,
    position: 'absolute',
  },
  tip: {
    backgroundColor: '#12141C',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    position: 'absolute',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  pointerDown: {
    borderLeftColor: 'transparent',
    borderLeftWidth: 8,
    borderRightColor: 'transparent',
    borderRightWidth: 8,
    borderTopColor: '#12141C',
    borderTopWidth: 10,
    bottom: -10,
    height: 0,
    position: 'absolute',
    width: 0,
  },
  pointerUp: {
    borderBottomColor: '#12141C',
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderLeftWidth: 8,
    borderRightColor: 'transparent',
    borderRightWidth: 8,
    height: 0,
    position: 'absolute',
    top: -10,
    width: 0,
  },
  tipTitle: {
    color: '#F7F5F2',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 8,
  },
  tipBody: {
    color: '#C8C8CC',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
    marginBottom: 16,
  },
  tipFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  restart: {
    color: '#A8A8AE',
    fontSize: 13,
    fontWeight: '700',
  },
  count: {
    color: '#F7F5F2',
    fontSize: 13,
    fontWeight: '700',
  },
  tipActions: {
    flexDirection: 'row',
    gap: 8,
  },
  smallBtn: {
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  smallBtnDisabled: { opacity: 0.4 },
  smallBtnText: {
    color: '#F7F5F2',
    fontSize: 13,
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: '#F4F4F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  doneText: {
    color: '#0C0C0E',
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: { opacity: 0.86 },
});
