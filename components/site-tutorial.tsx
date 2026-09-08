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

import { nativeTourViews } from '@/components/tour-anchor';
import { palette } from '@/constants/dropdex';
import {
  TUTORIAL_STEPS,
  TUTORIAL_STORAGE_KEY,
  type TutorialStep,
} from '@/constants/tutorial';
import { useWebLayout } from '@/hooks/use-web-layout';
import { hasAcceptedCurrentLegal, useAuth } from '@/store/auth-context';
import { useDropDex } from '@/store/dropdex-context';
import {
  DEVICE_PROMPT_DONE_KEY,
  isDevicePromptDoneMemory,
  subscribeDevicePromptDone,
} from '@/constants/preferred-device';

type TutorialStatus = 'unknown' | 'ask' | 'active' | 'done';

type Hole = {
  x: number;
  y: number;
  w: number;
  h: number;
  radius: number;
  circle: boolean;
};

const restartListeners = new Set<() => void>();

export function requestTutorialRestart() {
  void AsyncStorage.removeItem(TUTORIAL_STORAGE_KEY);
  restartListeners.forEach((listener) => listener());
}

function holeFromRect(
  rect: { left: number; top: number; width: number; height: number },
  step: TutorialStep,
): Hole {
  const pad = step.pad;
  if (step.shape === 'circle') {
    const size = Math.max(rect.width, rect.height) + pad * 2;
    return {
      x: rect.left + rect.width / 2 - size / 2,
      y: rect.top + rect.height / 2 - size / 2,
      w: size,
      h: size,
      radius: size / 2,
      circle: true,
    };
  }
  const w = rect.width + pad * 2;
  const h = rect.height + pad * 2;
  return {
    x: rect.left - pad,
    y: rect.top - pad,
    w,
    h,
    radius: step.shape === 'pill' ? Math.min(w, h) / 2 : 16,
    circle: false,
  };
}

function findTourElement(ids: string[]) {
  if (typeof document === 'undefined') return null;
  for (const id of ids) {
    const matches = Array.from(document.querySelectorAll(`[data-tour="${id}"], #tour-${id}`));
    for (const node of matches) {
      if (!(node instanceof HTMLElement)) continue;
      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        continue;
      }
      const rect = node.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) continue;
      return node;
    }
  }
  return null;
}

function measureWeb(step: TutorialStep, allowFallback: boolean): Hole | null {
  const ids = allowFallback ? step.anchors : step.anchors.slice(0, 1);
  const node = findTourElement(ids);
  if (!node) return null;
  if (step.scroll) {
    const rect = node.getBoundingClientRect();
    const margin = 96;
    const off =
      rect.top < margin ||
      rect.bottom > window.innerHeight - margin ||
      rect.left < 0 ||
      rect.right > window.innerWidth;
    if (off) {
      node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
    }
  }
  return holeFromRect(node.getBoundingClientRect(), step);
}

function measureNative(step: TutorialStep, onHole: (hole: Hole | null) => void) {
  for (const id of step.anchors) {
    const views = nativeTourViews(id);
    if (!views) continue;
    for (const view of views) {
      view.measureInWindow((x, y, width, height) => {
        if (width < 4 || height < 4) {
          onHole(null);
          return;
        }
        onHole(holeFromRect({ left: x, top: y, width, height }, step));
      });
      return;
    }
  }
  onHole(null);
}

function WebHoleDim({ hole }: { hole: Hole }) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.webHole,
        {
          borderRadius: hole.radius,
          height: hole.h,
          left: hole.x,
          top: hole.y,
          width: hole.w,
        },
      ]}
    />
  );
}

export function SiteTutorial() {
  const { profile, profileReady, session } = useAuth();
  const { setMonitoring } = useDropDex();
  const { isDesktopWeb } = useWebLayout();
  const { height, width } = useWindowDimensions();
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<TutorialStatus>('unknown');
  const [stepIndex, setStepIndex] = useState(0);
  const [deviceReady, setDeviceReady] = useState(false);
  const [hole, setHole] = useState<Hole | null>(null);

  const legalOk = hasAcceptedCurrentLegal(profile);
  const onboarded = Boolean(profile?.onboardingCompleted);
  const mayRun = profileReady && Boolean(session) && legalOk && onboarded;

  useEffect(() => {
    const unsubRestart = (() => {
      const listener = () => {
        setMonitoring(false);
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
    if (status !== 'active') return;
    setMonitoring(false);
  }, [setMonitoring, status]);

  useEffect(() => {
    if (status !== 'active' || !step) return;
    router.push(step.route);
  }, [router, status, step]);

  useEffect(() => {
    if (status !== 'active' || !step) return;
    setHole(null);
    let cancelled = false;
    let frames = 0;

    const tick = () => {
      if (cancelled) return;
      if (Platform.OS === 'web') {
        const next = measureWeb(step, frames > 18);
        if (next) {
          setHole(next);
          frames += 1;
          if (frames < 16) requestAnimationFrame(tick);
          return;
        }
      } else {
        measureNative(step, (next) => {
          if (!cancelled && next) setHole(next);
        });
      }
      frames += 1;
      if (frames < 45) {
        requestAnimationFrame(tick);
      }
    };

    const start = setTimeout(tick, 40);
    return () => {
      cancelled = true;
      clearTimeout(start);
    };
  }, [height, pathname, status, step, width]);

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
    const estimatedHeight = 188;
    if (!hole) {
      return {
        width: cardWidth,
        top: isDesktopWeb ? 96 : Math.max(24, height * 0.36),
        left: Math.max(16, (width - cardWidth) / 2),
        placement: 'bottom' as const,
      };
    }
    const gap = 16;
    const left = Math.max(16, Math.min(hole.x + hole.w / 2 - cardWidth / 2, width - cardWidth - 16));
    const below = hole.y + hole.h + gap;
    const above = hole.y - estimatedHeight - gap;
    const canBelow = below + estimatedHeight <= height - 12;
    const canAbove = above >= 12;
    const placement: 'top' | 'bottom' =
      canBelow || hole.y < height * 0.45 ? 'bottom' : canAbove ? 'top' : 'bottom';
    const top =
      placement === 'bottom'
        ? Math.min(below, height - estimatedHeight - 12)
        : Math.max(12, above);
    return { width: cardWidth, top, left, placement };
  }, [height, hole, isDesktopWeb, width]);

  if (!mayRun || status === 'unknown' || status === 'done') return null;

  if (status === 'ask') {
    return (
      <Modal animationType="fade" transparent visible>
        <View style={styles.scrim}>
          <View style={styles.askCard}>
            <Text style={styles.kicker}>FIRST RUN</Text>
            <Text style={styles.askTitle}>Want a quick tour?</Text>
            <Text style={styles.askBody}>
              A short tour of the start button, catalog, filters, region, Settings, profile, and
              appearance. You can skip and replay it later from Settings.
            </Text>
            <Pressable
              onPress={() => {
                setMonitoring(false);
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

  const pointerLeft = hole
    ? Math.min(Math.max(hole.x + hole.w / 2 - card.left - 8, 18), card.width - 34)
    : card.width / 2 - 8;

  return (
    <Modal animationType="fade" transparent visible>
      <View pointerEvents="box-none" style={styles.overlay}>
        <View pointerEvents="auto" style={StyleSheet.absoluteFill} />
        {Platform.OS === 'web' && hole ? (
          <WebHoleDim hole={hole} />
        ) : Platform.OS === 'web' ? (
          <View pointerEvents="none" style={styles.dim} />
        ) : (
          <>
            <View pointerEvents="none" style={[styles.dim, hole ? styles.dimClear : null]} />
            {hole ? (
              <>
                <View
                  pointerEvents="none"
                  style={[styles.shade, { height: Math.max(0, hole.y), left: 0, top: 0, width }]}
                />
                <View
                  pointerEvents="none"
                  style={[
                    styles.shade,
                    {
                      height: hole.h,
                      left: 0,
                      top: hole.y,
                      width: Math.max(0, hole.x),
                    },
                  ]}
                />
                <View
                  pointerEvents="none"
                  style={[
                    styles.shade,
                    {
                      height: hole.h,
                      left: hole.x + hole.w,
                      top: hole.y,
                      width: Math.max(0, width - hole.x - hole.w),
                    },
                  ]}
                />
                <View
                  pointerEvents="none"
                  style={[
                    styles.shade,
                    {
                      height: Math.max(0, height - hole.y - hole.h),
                      left: 0,
                      top: hole.y + hole.h,
                      width,
                    },
                  ]}
                />
              </>
            ) : null}
          </>
        )}

        {hole ? (
          <View
            pointerEvents="none"
            style={[
              styles.ring,
              {
                borderRadius: hole.radius,
                height: hole.h,
                left: hole.x,
                top: hole.y,
                width: hole.w,
              },
            ]}
          />
        ) : null}

        <View style={[styles.tip, { left: card.left, top: card.top, width: card.width }]}>
          {card.placement === 'bottom' ? (
            <View style={[styles.pointerUp, { left: pointerLeft }]} />
          ) : (
            <View style={[styles.pointerDown, { left: pointerLeft }]} />
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
    overflow: 'visible',
  },
  webHole: {
    position: 'absolute',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 0 0 400vmax rgba(0,0,0,0.66)' } as object)
      : null),
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.66)',
  },
  dimClear: {
    backgroundColor: 'transparent',
  },
  shade: {
    backgroundColor: 'rgba(0,0,0,0.66)',
    position: 'absolute',
  },
  ring: {
    borderColor: '#FFFFFF',
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
    zIndex: 20,
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
