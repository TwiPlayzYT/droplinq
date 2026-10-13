import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { setProductSearchOpen } from '@/components/product-search-host';
import { mountTabBar } from '@/components/tab-bar-portal';
import { TourAnchor } from '@/components/tour-anchor';
import { mobileWebBottomInset, TAB_PILL_HEIGHT, TAB_PILL_LIFT } from '@/hooks/use-mobile-web-chrome';

const RED = '#D20D1E';
const BLOB = 50;
const INACTIVE = 40;
const SEARCH_CIRCLE = 50;

type Slot = { kind: 'tab'; name: string } | { kind: 'search' };

/** Phones: search sits in the middle. Native keeps Settings as a real tab. */
function slotsFor(routeNames: string[], web: boolean): Slot[] {
  if (!web) return routeNames.map((name) => ({ kind: 'tab', name }));
  return [
    { kind: 'tab', name: 'home' },
    { kind: 'tab', name: 'stock' },
    { kind: 'search' },
    { kind: 'tab', name: 'filter' },
    { kind: 'tab', name: 'region' },
  ];
}

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
  const web = Platform.OS === 'web';
  const slots = slotsFor(
    state.routes.map((route) => route.name),
    web,
  );
  const count = slots.length;
  const slot = trackWidth > 0 && count > 0 ? trackWidth / count : 0;
  const activeName = state.routes[state.index]?.name ?? '';
  const activeSlot = slots.findIndex((item) => item.kind === 'tab' && item.name === activeName);

  useEffect(() => {
    if (!trackWidth || activeSlot < 0) return;
    const run = (reduced: boolean) => {
      if (!placed.current || reduced) {
        shift.setValue(activeSlot);
        placed.current = true;
        return;
      }
      Animated.spring(shift, {
        toValue: activeSlot,
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
  }, [activeSlot, shift, trackWidth]);

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
        {slot > 0 && activeSlot >= 0 ? (
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
        {slots.map((item, index) => {
          if (item.kind === 'search') {
            return (
              <TourAnchor key="search" id="search" style={styles.slot}>
                <Pressable
                  accessibilityLabel="Open product search"
                  accessibilityRole="button"
                  onPress={() => {
                    if (process.env.EXPO_OS === 'ios') {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setProductSearchOpen(true);
                  }}
                  style={styles.hit}>
                  <View pointerEvents="none" style={styles.iconWrap}>
                    <View style={[styles.inactive, styles.searchCircle]} />
                    <Ionicons color="#F7F5F2" name="search" size={28} />
                  </View>
                </Pressable>
              </TourAnchor>
            );
          }
          const route = state.routes.find((entry) => entry.name === item.name);
          const meta = ICONS[item.name] ?? {
            icon: 'ellipse' as const,
            label: item.name,
            tour: item.name,
          };
          const selected = activeSlot === index;
          return (
            <TourAnchor key={item.name} id={meta.tour} style={styles.slot}>
              <Pressable
                accessibilityLabel={meta.label}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => {
                  if (!route) return;
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
  searchCircle: {
    backgroundColor: '#333333',
    borderRadius: SEARCH_CIRCLE / 2,
    height: SEARCH_CIRCLE,
    left: (BLOB - SEARCH_CIRCLE) / 2,
    top: (BLOB - SEARCH_CIRCLE) / 2,
    width: SEARCH_CIRCLE,
  },
});
