import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette } from '@/constants/dropdex';
import { useDropDex } from '@/store/dropdex-context';

/** Must match DropDexProvider showFeedback auto-dismiss duration. */
const FEEDBACK_DURATION_MS = 4500;
const brandIcon = require('../assets/images/icon.png');


export function AppBootScreen() {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
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
          toValue: 0.35,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <View
      accessibilityLabel="Loading your DropLinq preferences"
      accessibilityRole="progressbar"
      style={styles.boot}>
      <Animated.View style={[styles.bootIconWrap, { opacity: pulse }]}>
        <Image accessibilityIgnoresInvertColors contentFit="cover" source={brandIcon} style={styles.bootIcon} />
      </Animated.View>
      <Text style={styles.bootBrand}>DROPLINQ</Text>
      <Text style={styles.bootTitle}>GETTING YOUR WATCHLIST READY</Text>
      <Text style={styles.bootCaption}>Loading region, filters, and saved products…</Text>
    </View>
  );
}

function FeedbackToast({
  feedback,
  top,
  width,
  onClear,
}: {
  feedback: NonNullable<ReturnType<typeof useDropDex>['feedback']>;
  top: number;
  width: number;
  onClear: () => void;
}) {
  const progress = useRef(new Animated.Value(1)).current;
  const drop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(1);
    drop.setValue(0);
    const enter = Animated.spring(drop, {
      damping: 16,
      mass: 0.85,
      stiffness: 180,
      toValue: 1,
      useNativeDriver: true,
    });
    const bar = Animated.timing(progress, {
      duration: FEEDBACK_DURATION_MS,
      easing: Easing.linear,
      toValue: 0,
      useNativeDriver: false,
    });
    enter.start();
    bar.start();
    return () => {
      enter.stop();
      bar.stop();
    };
  }, [drop, feedback.id, progress]);

  const toastWidth = Math.min(360, Math.max(240, width - 72));
  const left = (width - toastWidth) / 2;

  return (
    <Animated.View
      accessibilityHint="Dismisses this message"
      style={[
        styles.toast,
        {
          left,
          top,
          width: toastWidth,
          opacity: drop.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
          transform: [
            {
              translateY: drop.interpolate({
                inputRange: [0, 1],
                outputRange: [-88, 0],
              }),
            },
          ],
        },
        feedback.tone === 'error' && styles.toastError,
        feedback.tone === 'success' && styles.toastSuccess,
      ]}>
      <View style={styles.toastBody}>
        <Ionicons
          color={palette.white}
          name={
            feedback.tone === 'error'
              ? 'alert-circle'
              : feedback.tone === 'success'
                ? 'checkmark-circle'
                : 'information-circle'
          }
          size={23}
        />
        <View style={styles.toastCopy}>
          <Text style={styles.toastTitle}>{feedback.title}</Text>
          <Text style={styles.toastMessage}>{feedback.message}</Text>
          <View style={styles.toastTrack}>
            <Animated.View
              style={[
                styles.toastBar,
                {
                  width: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>
        {feedback.actionLabel && feedback.onAction ? (
          <Pressable
            accessibilityRole="button"
            onPress={feedback.onAction}
            style={styles.toastAction}>
            <Text style={styles.toastActionText}>{feedback.actionLabel}</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityLabel="Dismiss message"
            accessibilityRole="button"
            hitSlop={10}
            onPress={onClear}>
            <Ionicons color={palette.whiteShadow} name="close" size={19} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

export function GlobalUXFeedback() {
  const { feedback, operation, clearFeedback } = useDropDex();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const { width } = useWindowDimensions();
  const [showOperation, setShowOperation] = useState(false);

  // Sign-up / sign-in should stay clean — no cloud-status toasts over the form.
  const onAuthScreen = segments[0] === '(auth)';

  useEffect(() => {
    setShowOperation(!!operation);
  }, [operation]);

  useEffect(() => {
    if (onAuthScreen && feedback) {
      clearFeedback();
    }
  }, [clearFeedback, feedback, onAuthScreen]);

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      {showOperation && operation ? (
        <View
          accessibilityLabel={`${operation.title}. ${operation.message}`}
          accessibilityRole="progressbar"
          style={styles.operationScrim}>
          <View style={styles.operationCard}>
            <ActivityIndicator color={palette.red} size="large" />
            <Text style={styles.operationTitle}>{operation.title}</Text>
            <Text style={styles.operationMessage}>{operation.message}</Text>
            <View style={styles.operationPulse}>
              <View style={styles.operationPulseFill} />
            </View>
          </View>
        </View>
      ) : null}

      {feedback && !onAuthScreen ? (
        <FeedbackToast
          feedback={feedback}
          onClear={clearFeedback}
          top={Math.max(insets.top, 8) + 8}
          width={width}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  boot: {
    alignItems: 'center',
    backgroundColor: palette.black,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  bootIconWrap: {
    shadowColor: palette.red,
    shadowOpacity: 0.8,
    shadowRadius: 18,
  },
  bootIcon: {
    borderRadius: 18,
    height: 80,
    width: 80,
  },
  bootBrand: {
    color: palette.white,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 24,
  },
  bootTitle: {
    color: palette.whiteDim,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
    marginTop: 16,
    textAlign: 'center',
  },
  bootCaption: {
    color: palette.whiteShadow,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 10,
    textAlign: 'center',
  },
  operationScrim: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(9,9,9,0.78)',
    justifyContent: 'center',
    paddingHorizontal: 26,
  },
  operationCard: {
    alignItems: 'center',
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 24,
    borderWidth: 2,
    maxWidth: 330,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    width: '100%',
  },
  operationTitle: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginTop: 16,
    textAlign: 'center',
  },
  operationMessage: {
    color: palette.whiteShadow,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
    textAlign: 'center',
  },
  operationPulse: {
    backgroundColor: palette.black,
    borderRadius: 4,
    height: 6,
    marginTop: 18,
    overflow: 'hidden',
    width: '100%',
  },
  operationPulseFill: {
    backgroundColor: palette.red,
    borderRadius: 4,
    height: '100%',
    width: '72%',
  },
  toast: {
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 20,
    borderWidth: 2,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.75,
    shadowRadius: 12,
    zIndex: 1001,
  },
  toastError: { borderColor: palette.red },
  toastSuccess: { borderColor: palette.redDark },
  toastBody: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  toastCopy: { flex: 1 },
  toastTitle: { color: palette.white, fontSize: 13, fontWeight: '900', lineHeight: 18 },
  toastMessage: {
    color: palette.whiteShadow,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
  },
  toastTrack: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 2,
    height: 3,
    marginTop: 12,
    overflow: 'hidden',
    width: '100%',
  },
  toastBar: {
    backgroundColor: palette.card,
    borderRadius: 2,
    height: '100%',
  },
  toastAction: {
    borderColor: palette.red,
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  toastActionText: {
    color: palette.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
});
