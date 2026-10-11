import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { palette } from '@/constants/dropdex';

const SIZE = 46;

type Props = {
  open: boolean;
  query: string;
  onChangeQuery: (value: string) => void;
  onOpen: () => void;
  onClose: () => void;
  inputRef: React.RefObject<TextInput | null>;
  placeholder?: string;
};

/**
 * Round search control. The field slides in from the right underneath it,
 * and the button rides to the far end and turns into close.
 * Transform and opacity only, so it stays smooth on phone and desktop.
 */
export function FlippingSearch({
  open,
  query,
  onChangeQuery,
  onOpen,
  onClose,
  inputRef,
  placeholder = 'Search products',
}: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);
  const reduceMotion = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    reduceMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: reduceMotion.current ? 0 : 460,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished && open) inputRef.current?.focus();
    });
    return () => animation.stop();
  }, [inputRef, open, progress]);

  const travel = Math.max(trackWidth - SIZE, 0);
  const fieldShift = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [travel, 0],
  });
  const buttonShift = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, travel],
  });
  const searchOpacity = progress.interpolate({
    inputRange: [0, 0.42, 1],
    outputRange: [1, 0, 0],
  });
  const closeOpacity = progress.interpolate({
    inputRange: [0, 0.58, 1],
    outputRange: [0, 0, 1],
  });
  const searchTurn = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '80deg'],
  });
  const closeTurn = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['-80deg', '0deg'],
  });

  return (
    <View
      accessibilityRole="search"
      onLayout={(event) => {
        const next = Math.round(event.nativeEvent.layout.width);
        setTrackWidth((current) => (current === next ? current : next));
      }}
      style={styles.track}>
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[
          styles.field,
          trackWidth <= SIZE ? styles.fieldHidden : null,
          { transform: [{ translateX: fieldShift }] },
        ]}>
        <TextInput
          ref={inputRef}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="never"
          editable={open}
          onChangeText={onChangeQuery}
          placeholder={placeholder}
          placeholderTextColor={palette.cardMuted}
          returnKeyType="search"
          style={styles.input}
          value={query}
        />
      </Animated.View>
      <Animated.View
        pointerEvents="box-none"
        style={[styles.orbSlot, { transform: [{ translateX: buttonShift }] }]}>
        <Pressable
          accessibilityHint={open ? 'Closes product search' : 'Opens product search'}
          accessibilityLabel={open ? 'Close search' : 'Search products'}
          accessibilityRole="button"
          unstable_pressDelay={0}
          onPress={open ? onClose : onOpen}
          style={({ pressed }) => [styles.orb, pressed && styles.orbPressed]}>
          <Animated.View
            style={[styles.icon, { opacity: searchOpacity, transform: [{ rotate: searchTurn }] }]}>
            <Ionicons color={palette.white} name="search" size={18} />
          </Animated.View>
          <Animated.View
            style={[
              styles.icon,
              styles.iconFront,
              { opacity: closeOpacity, transform: [{ rotate: closeTurn }] },
            ]}>
            <Ionicons color={palette.white} name="close" size={20} />
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: SIZE,
    marginBottom: 10,
    overflow: 'hidden',
    width: '100%',
  },
  fieldHidden: {
    opacity: 0,
  },
  field: {
    backgroundColor: palette.card,
    borderColor: palette.cardBorder,
    borderRadius: SIZE / 2,
    borderWidth: 1,
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  input: {
    color: palette.cardInk,
    fontSize: 15,
    fontWeight: '700',
    height: SIZE - 2,
    paddingLeft: 18,
    paddingRight: SIZE + 8,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  orbSlot: {
    height: SIZE,
    left: 0,
    position: 'absolute',
    top: 0,
    width: SIZE,
    zIndex: 2,
  },
  orb: {
    alignItems: 'center',
    backgroundColor: palette.red,
    borderRadius: SIZE / 2,
    height: SIZE,
    justifyContent: 'center',
    width: SIZE,
  },
  orbPressed: {
    transform: [{ scale: 0.96 }],
  },
  icon: {
    alignItems: 'center',
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  iconFront: {
    position: 'absolute',
  },
});
