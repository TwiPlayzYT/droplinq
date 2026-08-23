import { Ionicons } from '@expo/vector-icons';
import { useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette } from '@/constants/dropdex';
import { useDropDex } from '@/store/dropdex-context';

/** Must match DropDexProvider showFeedback auto-dismiss duration. */
const FEEDBACK_DURATION_MS = 4500;

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
      <Animated.View style={[styles.bootBall, { opacity: pulse }]}>
        <View style={styles.bootBallTop} />
        <View style={styles.bootBallLine} />
        <View style={styles.bootBallButton} />
      </Animated.View>
      <Text style={styles.bootBrand}>DROPLINQ</Text>
      <Text style={styles.bootTitle}>GETTING YOUR WATCHLIST READY</Text>
      <Text style={styles.bootCaption}>Loading region, filters, and saved products…</Text>
    </View>
  );
}

function FeedbackToast({
  feedback,
  bottom,
  onClear,
}: {
  feedback: NonNullable<ReturnType<typeof useDropDex>['feedback']>;
  bottom: number;
  onClear: () => void;
}) {
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    progress.setValue(1);
    const animation = Animated.timing(progress, {
      duration: FEEDBACK_DURATION_MS,
      easing: Easing.linear,
      toValue: 0,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [feedback.id, progress]);

  return (
    <View
      accessibilityHint="Dismisses this message"
      style={[
        styles.toast,
        { bottom },
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
    </View>
  );
}

export function GlobalUXFeedback() {
  const { feedback, operation, clearFeedback } = useDropDex();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const [showOperation, setShowOperation] = useState(false);

  // Sign-up / sign-in should stay clean — no cloud-status toasts over the form.
  const onAuthScreen = segments[0] === '(auth)';

  useEffect(() => {
    if (!operation) {
      setShowOperation(false);
      return;
    }
    const timer = setTimeout(() => setShowOperation(true), 250);
    return () => clearTimeout(timer);
  }, [operation]);

  useEffect(() => {
    if (onAuthScreen && feedback) {
      clearFeedback();
    }
  }, [clearFeedback, feedback, onAuthScreen]);

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
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
          bottom={Math.max(insets.bottom, 12) + 76}
          feedback={feedback}
          onClear={clearFeedback}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  boot: {
    alignItems: 'center',
    backgroundColor: palette.black,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  bootBall: {
    backgroundColor: palette.white,
    borderColor: palette.whiteDim,
    borderRadius: 40,
    borderWidth: 4,
    height: 80,
    overflow: 'hidden',
    shadowColor: palette.red,
    shadowOpacity: 0.8,
    shadowRadius: 18,
    width: 80,
  },
  bootBallTop: { backgroundColor: palette.red, height: 36 },
  bootBallLine: { backgroundColor: palette.black, height: 8 },
  bootBallButton: {
    backgroundColor: palette.white,
    borderColor: palette.black,
    borderRadius: 12,
    borderWidth: 5,
    height: 24,
    left: 23,
    position: 'absolute',
    top: 28,
    width: 24,
  },
  bootBrand: {
    color: palette.white,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1.5,
    marginTop: 24,
  },
  bootTitle: {
    color: palette.whiteDim,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
    marginTop: 14,
    textAlign: 'center',
  },
  bootCaption: {
    color: palette.whiteShadow,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 7,
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
    marginTop: 15,
    textAlign: 'center',
  },
  operationMessage: {
    color: palette.whiteShadow,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
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
    left: 14,
    position: 'absolute',
    right: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.75,
    shadowRadius: 10,
  },
  toastError: { borderColor: palette.red },
  toastSuccess: { borderColor: palette.redDark },
  toastBody: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 11,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  toastCopy: { flex: 1 },
  toastTitle: { color: palette.white, fontSize: 13, fontWeight: '900' },
  toastMessage: {
    color: palette.whiteShadow,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
  },
  toastTrack: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 2,
    height: 3,
    marginTop: 10,
    overflow: 'hidden',
    width: '100%',
  },
  toastBar: {
    backgroundColor: palette.white,
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
