import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { palette } from '@/constants/dropdex';

function reducedMotion() {
  return (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** A content-shaped block with a slow light sweep. Not a spinner. */
export function ShimmerBone({ style }: { style?: ViewStyle | ViewStyle[] }) {
  const sweep = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);
  const still = reducedMotion();

  useEffect(() => {
    if (still || width <= 0) return;
    const animation = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [still, sweep, width]);

  const travel = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-Math.max(width, 1), Math.max(width, 1)],
  });

  return (
    <View
      onLayout={(event) => {
        const next = Math.round(event.nativeEvent.layout.width);
        setWidth((current) => (current === next ? current : next));
      }}
      style={[styles.bone, style]}>
      {still || width <= 0 ? null : (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.sheen,
            { width: Math.max(28, width * 0.42), transform: [{ translateX: travel }] },
          ]}
        />
      )}
    </View>
  );
}

/** Placeholder for a product row. Use only after a wait has already passed a second. */
export function ProductSkeleton() {
  return (
    <View style={styles.card}>
      <ShimmerBone style={styles.thumb} />
      <View style={styles.lines}>
        <ShimmerBone style={styles.lineShort} />
        <ShimmerBone style={styles.lineLong} />
        <ShimmerBone style={styles.lineMid} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bone: {
    backgroundColor: palette.blackSoft,
    borderRadius: 6,
    overflow: 'hidden',
  },
  sheen: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
  },
  card: {
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    padding: 12,
  },
  thumb: {
    borderRadius: 12,
    height: 64,
    width: 64,
  },
  lines: { flex: 1, gap: 8, justifyContent: 'center' },
  lineShort: { height: 10, width: '42%' },
  lineLong: { height: 10, width: '88%' },
  lineMid: { height: 10, width: '64%' },
});
