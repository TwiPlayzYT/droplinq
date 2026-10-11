import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { palette } from '@/constants/dropdex';

const SEEN_KEY = 'droplinq-launch-seen';

let nativeSeen = false;

function alreadySeen() {
  if (Platform.OS === 'web') {
    try {
      return sessionStorage.getItem(SEEN_KEY) === '1';
    } catch {
      return false;
    }
  }
  return nativeSeen;
}

function markSeen() {
  if (Platform.OS === 'web') {
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      // Private mode can block storage. The splash still plays this once.
    }
    return;
  }
  nativeSeen = true;
}

function reducedMotion() {
  return (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * One short open for each visit: a product card drops, the alert ring fires,
 * then the app is revealed. Not a spinner, and not replayed while the tab stays open.
 */
export function LaunchSplash() {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = useState(() => !alreadySeen());
  const drop = useRef(new Animated.Value(0)).current;
  const brand = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const veil = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!mounted) return;
    if (reducedMotion()) {
      drop.setValue(1);
      brand.setValue(1);
      markSeen();
      const timer = setTimeout(() => setMounted(false), 450);
      return () => clearTimeout(timer);
    }

    const animation = Animated.sequence([
      Animated.spring(drop, {
        toValue: 1,
        damping: 13,
        mass: 0.75,
        stiffness: 150,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(brand, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ring, {
          toValue: 1,
          duration: 720,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(380),
      Animated.timing(veil, {
        toValue: 0,
        duration: 360,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animation.start(({ finished }) => {
      if (!finished) return;
      markSeen();
      setMounted(false);
    });
    return () => animation.stop();
  }, [brand, drop, mounted, ring, veil]);

  if (!mounted) return null;

  const cardWidth = Math.min(300, Math.max(220, width - 72));

  return (
    <Animated.View
      accessibilityLabel="DropLinq is opening"
      accessibilityRole="progressbar"
      pointerEvents="auto"
      style={[styles.veil, { opacity: veil }]}>
      <View style={styles.stage}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              opacity: ring.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.7, 0] }),
              transform: [
                { scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.85] }) },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.card,
            { width: cardWidth },
            {
              opacity: drop,
              transform: [
                { translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-160, 0] }) },
                { rotate: drop.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '0deg'] }) },
              ],
            },
          ]}>
          <View style={styles.cardTop}>
            <View style={styles.dropPill}>
              <Text style={styles.dropPillText}>DROP</Text>
            </View>
            <Text style={styles.live}>ALERT</Text>
          </View>
          <Text style={styles.cardTitle}>Elite Trainer Box</Text>
          <Text style={styles.cardSub}>Pokémon Center</Text>
          <View style={styles.cardBar} />
        </Animated.View>
        <Animated.View
          style={{
            opacity: brand,
            transform: [
              { translateY: brand.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
            ],
          }}>
          <Text style={styles.brand}>DROPLINQ</Text>
          <Text style={styles.tag}>MONITOR · ALERT · CHECK</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.black,
    zIndex: 4000,
    ...(Platform.OS === 'web' ? ({ position: 'fixed' } as object) : null),
  },
  stage: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  ring: {
    borderColor: palette.red,
    borderRadius: 999,
    borderWidth: 2,
    height: 180,
    position: 'absolute',
    width: 180,
  },
  card: {
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 28,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  cardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dropPill: {
    backgroundColor: palette.red,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dropPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  live: {
    color: palette.redLight,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  cardTitle: {
    color: palette.white,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 14,
  },
  cardSub: {
    color: palette.whiteShadow,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  cardBar: {
    backgroundColor: palette.red,
    borderRadius: 2,
    height: 3,
    marginTop: 16,
    width: '42%',
  },
  brand: {
    color: palette.white,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1.6,
    textAlign: 'center',
  },
  tag: {
    color: palette.whiteShadow,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginTop: 6,
    textAlign: 'center',
  },
});
