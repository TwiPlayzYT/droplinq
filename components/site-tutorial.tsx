import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
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
import {
  DEVICE_PROMPT_DONE_KEY,
  isDevicePromptDoneMemory,
  subscribeDevicePromptDone,
} from '@/constants/preferred-device';
import { useWebLayout } from '@/hooks/use-web-layout';
import {
  notifyTutorialStep,
  setTutorialSessionActive,
  subscribeTourAction,
} from '@/services/tour-session';
import { hasAcceptedCurrentLegal, useAuth } from '@/store/auth-context';
import { useDropDex } from '@/store/dropdex-context';

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

function pathMatches(pathname: string, route: TutorialStep['route']) {
  const path = pathname.replace(/\/$/, '') || '/';
  if (route === '/(tabs)/home') {
    return path === '/home' || path === '/(tabs)/home';
  }
  const leaf = route.replace('/(tabs)', '') || '/';
  return path === leaf || path.endsWith(leaf);
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

function holesEqual(a: Hole | null, b: Hole | null) {
  if (!a || !b) return a === b;
  return (
    Math.abs(a.x - b.x) < 0.8 &&
    Math.abs(a.y - b.y) < 0.8 &&
    Math.abs(a.w - b.w) < 0.8 &&
    Math.abs(a.h - b.h) < 0.8
  );
}

function isUsableRect(rect: DOMRect, step: TutorialStep) {
  if (rect.width < 8 || rect.height < 8) return false;
  if (rect.bottom < 8 || rect.right < 8) return false;
  if (typeof window === 'undefined') return true;
  if (rect.top > window.innerHeight - 8 || rect.left > window.innerWidth - 8) return false;
  const huge = rect.width > window.innerWidth * 0.92 && rect.height > window.innerHeight * 0.72;
  if (huge && step.action !== 'coverage' && step.action !== 'events' && step.action !== 'region') {
    return false;
  }
  return true;
}

function findTourElement(ids: string[], step: TutorialStep) {
  if (typeof document === 'undefined') return null;
  for (const id of ids) {
    const matches = Array.from(document.querySelectorAll(`[data-tour="${id}"], #tour-${id}`));
    let best: HTMLElement | null = null;
    let bestArea = 0;
    for (const node of matches) {
      if (!(node instanceof HTMLElement)) continue;
      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        continue;
      }
      const rect = node.getBoundingClientRect();
      if (!isUsableRect(rect, step)) continue;
      const area = rect.width * rect.height;
      if (area > bestArea) {
        best = node;
        bestArea = area;
      }
    }
    if (best) return best;
  }
  return null;
}

function measureWeb(step: TutorialStep): Hole | null {
  const node = findTourElement(step.anchors, step);
  if (!node) return null;
  if (step.scroll) {
    const rect = node.getBoundingClientRect();
    const margin = 88;
    const off =
      rect.top < margin ||
      rect.bottom > window.innerHeight - margin ||
      rect.left < 0 ||
      rect.right > window.innerWidth;
    if (off) node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
  }
  const next = node.getBoundingClientRect();
  if (!isUsableRect(next, step)) return null;
  return holeFromRect(next, step);
}

function measureNative(step: TutorialStep, onHole: (hole: Hole | null) => void) {
  for (const id of step.anchors) {
    const views = nativeTourViews(id);
    if (!views) continue;
    for (const view of views) {
      view.measureInWindow((x, y, width, height) => {
        if (width < 8 || height < 8) {
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

export function SiteTutorial() {
  const { profile, profileReady, session } = useAuth();
  const { hydrated, monitoring } = useDropDex();
  const { isDesktopWeb } = useWebLayout();
  const { height, width } = useWindowDimensions();
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<TutorialStatus>('unknown');
  const [stepIndex, setStepIndex] = useState(0);
  const [deviceReady, setDeviceReady] = useState(false);
  const [hole, setHole] = useState<Hole | null>(null);
  const pulse = useRef(new Animated.Value(0.55)).current;
  const completingRef = useRef(false);

  const legalOk = hasAcceptedCurrentLegal(profile);
  const onboarded = Boolean(profile?.onboardingCompleted);
  const mayRun = profileReady && hydrated && Boolean(session) && legalOk && onboarded;
  const step: TutorialStep | undefined = TUTORIAL_STEPS[stepIndex];

  const beginTour = () => {
    setTutorialSessionActive(true);
    completingRef.current = false;
    setStepIndex(0);
    setHole(null);
    setStatus('active');
  };

  const persist = (value: 'done' | 'skipped') => {
    setTutorialSessionActive(false);
    notifyTutorialStep(null);
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
    completingRef.current = false;
    setStepIndex(next);
  };

  useEffect(() => {
    const unsubRestart = (() => {
      const listener = () => beginTour();
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

  useEffect(() => {
    if (status !== 'active' || !step) {
      notifyTutorialStep(null);
      return;
    }
    setTutorialSessionActive(true);
    notifyTutorialStep(step.id);
  }, [status, step]);

  useEffect(() => {
    if (status !== 'active' || !step) return;
    if (pathMatches(pathname, step.route)) return;
    router.push(step.route as never);
  }, [pathname, router, status, step]);

  useEffect(() => {
    if (status !== 'active' || !step) return;
    let cancelled = false;
    let frames = 0;

    const sample = () => {
      if (cancelled) return;
      if (!pathMatches(pathname, step.route) && frames < 20) return;
      if (Platform.OS === 'web') {
        const next = measureWeb(step);
        if (next) {
          setHole((current) => (holesEqual(current, next) ? current : next));
        }
      } else {
        measureNative(step, (next) => {
          if (cancelled || !next) return;
          setHole((current) => (holesEqual(current, next) ? current : next));
        });
      }
    };

    const tick = () => {
      if (cancelled) return;
      sample();
      frames += 1;
      if (frames < 90) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
    const interval = setInterval(sample, 180);
    if (Platform.OS === 'web') {
      window.addEventListener('resize', sample);
      window.addEventListener('scroll', sample, true);
    }
    return () => {
      cancelled = true;
      clearInterval(interval);
      if (Platform.OS === 'web') {
        window.removeEventListener('resize', sample);
        window.removeEventListener('scroll', sample, true);
      }
    };
  }, [height, pathname, status, step, width]);

  useEffect(() => {
    if (status !== 'active' || !step) return undefined;
    return subscribeTourAction((id) => {
      if (completingRef.current) return;
      if (id !== step.action && !(step.action === 'tap' && id === 'tap')) return;
      completingRef.current = true;
      setTimeout(() => go(stepIndex + 1), 280);
    });
  }, [status, step, stepIndex]);

  useEffect(() => {
    if (status !== 'active') return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          toValue: 0.45,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse, status]);

  const card = useMemo(() => {
    const cardWidth = Math.min(340, width - 32);
    const estimatedHeight = 210;
    if (!hole) {
      return {
        width: cardWidth,
        top: isDesktopWeb ? 96 : Math.max(24, height * 0.38),
        left: Math.max(16, (width - cardWidth) / 2),
        placement: 'bottom' as const,
      };
    }
    const gap = 18;
    const left = Math.max(16, Math.min(hole.x + hole.w / 2 - cardWidth / 2, width - cardWidth - 16));
    const below = hole.y + hole.h + gap;
    const above = hole.y - estimatedHeight - gap;
    const canBelow = below + estimatedHeight <= height - 12;
    const canAbove = above >= 12;
    const placement: 'top' | 'bottom' =
      hole.y + hole.h / 2 < height * 0.42
        ? canBelow
          ? 'bottom'
          : 'top'
        : canAbove
          ? 'top'
          : 'bottom';
    const top =
      placement === 'bottom'
        ? Math.min(Math.max(below, 12), height - estimatedHeight - 12)
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
              Tap the highlighted controls as you go — starting with the big Home button. You can
              skip and replay it later from Settings.
            </Text>
            <Pressable
              onPress={beginTour}
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

  const shades = hole
    ? [
        { height: Math.max(0, hole.y), left: 0, top: 0, width },
        { height: hole.h, left: 0, top: hole.y, width: Math.max(0, hole.x) },
        {
          height: hole.h,
          left: hole.x + hole.w,
          top: hole.y,
          width: Math.max(0, width - hole.x - hole.w),
        },
        {
          height: Math.max(0, height - hole.y - hole.h),
          left: 0,
          top: hole.y + hole.h,
          width,
        },
      ]
    : null;

  const overlay = (
    <View pointerEvents="box-none" style={Platform.OS === 'web' ? styles.webOverlay : styles.overlay}>
      {shades ? (
        shades.map((shade, index) => (
          <View key={index} pointerEvents="auto" style={[styles.shade, shade]} />
        ))
      ) : (
        <View pointerEvents="auto" style={styles.dim} />
      )}

      {hole ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              borderRadius: hole.radius,
              height: hole.h,
              left: hole.x,
              opacity: pulse,
              top: hole.y,
              width: hole.w,
            },
          ]}
        />
      ) : null}

      <View pointerEvents="auto" style={[styles.tip, { left: card.left, top: card.top, width: card.width }]}>
        {card.placement === 'bottom' ? (
          <View style={[styles.pointerUp, { left: pointerLeft }]} />
        ) : (
          <View style={[styles.pointerDown, { left: pointerLeft }]} />
        )}
        <Text style={styles.tipTitle}>{step.title}</Text>
        <Text style={styles.tipBody}>{step.body}</Text>
        <Text style={styles.hint}>
          {step.id === 'home-power' && monitoring
            ? 'Alerts are already ON — tap Next to continue'
            : step.hint}
        </Text>
        <View style={styles.tipFooter}>
          <Pressable onPress={beginTour}>
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
            <Pressable onPress={() => go(stepIndex + 1)} style={styles.smallBtn}>
              <Text style={styles.smallBtnText}>
                {stepIndex === TUTORIAL_STEPS.length - 1 ? 'Done' : 'Next'}
              </Text>
            </Pressable>
            <Pressable onPress={() => persist('done')} style={styles.doneBtn}>
              <Text style={styles.doneText}>Finish</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );

  if (Platform.OS === 'web') return overlay;

  return (
    <Modal animationType="none" transparent visible>
      {overlay}
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
  webOverlay: {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'web'
      ? ({ position: 'fixed', inset: 0, zIndex: 80 } as object)
      : null),
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  shade: {
    backgroundColor: 'rgba(0,0,0,0.62)',
    position: 'absolute',
  },
  ring: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
    position: 'absolute',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.9,
    shadowRadius: 10,
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
    marginBottom: 10,
  },
  hint: {
    color: palette.red,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
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
