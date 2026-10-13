import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TourAnchor } from '@/components/tour-anchor';
import { mobileWebBottomInset } from '@/hooks/use-mobile-web-chrome';

const RED = '#D20D1E';
const PILL_HEIGHT = 64;
const BLOB = 46;

const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap; label: string; tour: string }> = {
  home: { on: 'power', off: 'power-outline', label: 'Home', tour: 'home' },
  stock: { on: 'cube', off: 'cube-outline', label: 'Stock', tour: 'stock' },
  filter: { on: 'options', off: 'options-outline', label: 'Filter', tour: 'filter' },
  region: { on: 'globe', off: 'globe-outline', label: 'Region', tour: 'region' },
  settings: { on: 'settings', off: 'settings-outline', label: 'Settings', tour: 'settings-tab' },
};

/**
 * Floating tab pill. The red circle rests on the open tab and slides when you switch.
 */
export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [trackWidth, setTrackWidth] = useState(0);
  const shift = useRef(new Animated.Value(state.index)).current;
  const placed = useRef(false);
  const count = state.routes.length;
  const slot = trackWidth > 0 && count > 0 ? trackWidth / count : 0;

  useEffect(() => {
    if (!trackWidth) return;
    let reduce = false;
    const run = (reduced: boolean) => {
      if (!placed.current || reduced) {
        shift.setValue(state.index);
        placed.current = true;
        return;
      }
      Animated.spring(shift, {
        toValue: state.index,
        useNativeDriver: true,
        friction: 8,
        tension: 120,
      }).start();
    };
    if (Platform.OS === 'web') {
      const motion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      run(Boolean(motion));
      return;
    }
    void AccessibilityInfo.isReduceMotionEnabled().then(run);
  }, [shift, state.index, trackWidth]);

  const translateX = shift.interpolate({
    inputRange: [0, Math.max(count - 1, 1)],
    outputRange: [0, Math.max(slot * (count - 1), 0)],
  });

  const bottomGap = mobileWebBottomInset(insets.bottom);

  return (
    <View pointerEvents="box-none" style={[styles.dock, { paddingBottom: bottomGap }]}>
      <View
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        style={styles.pill}>
        {slot > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.blob,
              {
                width: BLOB,
                marginLeft: (slot - BLOB) / 2,
                transform: [{ translateX }],
              },
            ]}
          />
        ) : null}
        {state.routes.map((route, index) => {
          const meta = ICONS[route.name] ?? {
            on: 'ellipse' as const,
            off: 'ellipse-outline' as const,
            label: route.name,
            tour: route.name,
          };
          const selected = state.index === index;
          return (
            <TourAnchor key={route.key} id={meta.tour} style={styles.slot}>
              <Pressable
                accessibilityLabel={meta.label}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => {
                  if (process.env.EXPO_OS === 'ios') {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!selected && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                }}
                style={styles.hit}>
                <Ionicons
                  color={selected ? '#FFFFFF' : '#A9A6A2'}
                  name={selected ? meta.on : meta.off}
                  size={22}
                />
              </Pressable>
            </TourAnchor>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  pill: {
    backgroundColor: '#141414',
    borderColor: '#2C2C2C',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    height: PILL_HEIGHT,
    position: 'relative',
  },
  blob: {
    backgroundColor: RED,
    borderRadius: BLOB / 2,
    height: BLOB,
    left: 0,
    position: 'absolute',
    top: (PILL_HEIGHT - BLOB) / 2,
  },
  slot: {
    flex: 1,
  },
  hit: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
