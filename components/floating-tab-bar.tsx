import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { mountTabBar } from '@/components/tab-bar-portal';
import { TourAnchor } from '@/components/tour-anchor';
import { mobileWebBottomInset, TAB_PILL_HEIGHT, TAB_PILL_LIFT } from '@/hooks/use-mobile-web-chrome';

const RED = '#D20D1E';
const BLOB = 50;
const INACTIVE = 40;

const ICONS: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; label: string; tour: string }
> = {
  home: { icon: 'home', label: 'Home', tour: 'home' },
  stock: { icon: 'cube', label: 'Stock', tour: 'stock' },
  filter: { icon: 'options', label: 'Filter', tour: 'filter' },
  region: { icon: 'globe', label: 'Region', tour: 'region' },
  settings: { icon: 'settings', label: 'Settings', tour: 'settings-tab' },
};

/**
 * Floating tab pill. A red circle rests on the open tab and slides when you switch.
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
      const motion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
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

  const bar = (
    <View
      pointerEvents="box-none"
      style={[styles.dock, { paddingBottom: bottomGap }]}
      {...(Platform.OS === 'web' ? { dataSet: { dlTabdock: '1' } } : null)}>
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
            icon: 'ellipse' as const,
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
                <View pointerEvents="none" style={styles.iconWrap}>
                  {selected ? null : <View style={styles.inactive} />}
                  <Ionicons color={selected ? '#FFFFFF' : '#C8C4BF'} name={meta.icon} size={22} />
                </View>
              </Pressable>
            </TourAnchor>
          );
        })}
      </View>
    </View>
  );

  return mountTabBar(bar);
}

const styles = StyleSheet.create({
  dock: {
    paddingHorizontal: 18,
    paddingTop: TAB_PILL_LIFT,
    ...(Platform.OS === 'web'
      ? ({
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 80,
        } as object)
      : null),
  },
  pill: {
    backgroundColor: '#161616',
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    height: TAB_PILL_HEIGHT,
    position: 'relative',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 12px 32px rgba(0,0,0,0.55)' } as object)
      : {
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.45,
          shadowRadius: 16,
        }),
  },
  blob: {
    backgroundColor: RED,
    borderRadius: BLOB / 2,
    height: BLOB,
    left: 0,
    position: 'absolute',
    top: (TAB_PILL_HEIGHT - BLOB) / 2,
  },
  slot: {
    flex: 1,
  },
  hit: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    height: BLOB,
    justifyContent: 'center',
    width: BLOB,
  },
  inactive: {
    backgroundColor: '#2A2A2A',
    borderRadius: INACTIVE / 2,
    height: INACTIVE,
    left: (BLOB - INACTIVE) / 2,
    position: 'absolute',
    top: (BLOB - INACTIVE) / 2,
    width: INACTIVE,
  },
});
