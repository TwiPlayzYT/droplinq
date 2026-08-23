import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { BrandHeader, MetalButton, Panel, Screen } from '@/components/dropdex-ui';
import { palette } from '@/constants/dropdex';
import { getRegion } from '@/data/regions';
import { useDropDex } from '@/store/dropdex-context';
import { RecentVisit } from '@/types/dropdex';

// Memoized: Home re-renders on every progress tick while monitoring, and
// rebuilding every Swipeable bubble each tick makes taps feel laggy.
const RecentBubble = memo(function RecentBubble({
  onOpen,
  onRemove,
  visit,
}: {
  onOpen: (visit: RecentVisit) => void;
  onRemove: (visit: RecentVisit) => void;
  visit: RecentVisit;
}) {
  return (
    <Swipeable
      friction={2}
      overshootRight={false}
      onSwipeableOpen={(direction) => {
        if (direction === 'right') onRemove(visit);
      }}
      renderRightActions={() => (
        <View style={styles.deleteAction}>
          <Ionicons color={palette.white} name="trash-outline" size={22} />
          <Text style={styles.deleteText}>REMOVE</Text>
        </View>
      )}
      rightThreshold={64}>
      <Pressable
        accessibilityHint="Opens this product again"
        onPress={() => onOpen(visit)}
        style={({ pressed }) => [styles.recentShadow, pressed && styles.recentPressed]}>
        <View style={styles.recentCard}>
          <View style={styles.recentThumb}>
            {visit.product.imageUrl ? (
              <Image
                contentFit="cover"
                source={{ uri: visit.product.imageUrl }}
                style={styles.recentImage}
                transition={160}
              />
            ) : (
              <Ionicons color={palette.whiteShadow} name="image-outline" size={18} />
            )}
          </View>
          <View style={styles.recentCopy}>
            <Text numberOfLines={2} style={styles.recentTitle}>
              {visit.product.title}
            </Text>
          </View>
          <Ionicons color={palette.whiteShadow} name="open-outline" size={16} />
        </View>
      </Pressable>
    </Swipeable>
  );
});

export default function HomeScreen() {
  const {
    hydrated,
    liveStatus,
    monitoring,
    openProductBrowser,
    recentVisits,
    region,
    removeRecentVisit,
    setMonitoring,
    stockEvents,
    triggerTestAlert,
  } = useDropDex();
  const regionConfig = getRegion(region);
  const handleOpenRecent = useCallback(
    (visit: RecentVisit) => openProductBrowser(visit.product),
    [openProductBrowser],
  );
  const handleRemoveRecent = useCallback(
    (visit: RecentVisit) => removeRecentVisit(visit.id),
    [removeRecentVisit],
  );
  const progress = !hydrated ? 5 : monitoring ? (liveStatus.progress ?? 10) : 0;
  const animatedProgress = useRef(new Animated.Value(progress)).current;
  const [displayPercent, setDisplayPercent] = useState(Math.round(progress));

  useEffect(() => {
    const listener = animatedProgress.addListener(({ value }) => {
      setDisplayPercent(Math.min(100, Math.round(value)));
    });
    return () => animatedProgress.removeListener(listener);
  }, [animatedProgress]);

  useEffect(() => {
    animatedProgress.stopAnimation((current) => {
      if (progress <= 0) {
        Animated.timing(animatedProgress, {
          duration: 300,
          easing: Easing.out(Easing.quad),
          toValue: 0,
          useNativeDriver: true,
        }).start();
        return;
      }

      if (progress >= 100) {
        Animated.timing(animatedProgress, {
          duration: 700,
          easing: Easing.out(Easing.cubic),
          toValue: 100,
          useNativeDriver: true,
        }).start();
        return;
      }

      // Never move backwards mid-scan; ease up to the reported checkpoint,
      // then keep creeping toward (but not past) the next one so the bar
      // rises steadily instead of jumping between checkpoints.
      const checkpoint = Math.max(progress, current);
      const creepCeiling = Math.min(progress + 30, 96);
      Animated.sequence([
        Animated.timing(animatedProgress, {
          duration: 500,
          easing: Easing.out(Easing.quad),
          toValue: checkpoint,
          useNativeDriver: true,
        }),
        Animated.timing(animatedProgress, {
          duration: 9000,
          easing: Easing.out(Easing.quad),
          toValue: Math.max(checkpoint, creepCeiling),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [animatedProgress, progress]);

  return (
    <Screen>
      <BrandHeader eyebrow={regionConfig.label} />

      <View style={styles.body}>
        <View style={styles.statusRow}>
          <View style={[styles.statusLamp, monitoring && styles.statusLampOn]} />
          <Text style={styles.statusText}>
            {!hydrated ? 'LOADING' : monitoring ? 'ALERTS ON' : 'ALERTS OFF'}
          </Text>
        </View>

        <Pressable
          accessibilityHint="Turns DropLinq alerts on or off"
          accessibilityLabel={`Alerts ${monitoring ? 'on' : 'off'}`}
          accessibilityRole="button"
          disabled={!hydrated}
          onPress={() => setMonitoring(!monitoring)}
          style={({ pressed }) => [styles.powerBase, pressed && styles.powerPressed]}>
          <View style={[styles.powerRim, monitoring && styles.powerRimOn]}>
            <View style={styles.powerFace}>
              <View style={[styles.powerGlow, monitoring && styles.powerGlowOn]}>
                <Ionicons
                  color={monitoring ? palette.red : palette.whiteShadow}
                  name="power"
                  size={76}
                />
              </View>
              <Text style={[styles.powerLabel, monitoring && styles.powerLabelOn]}>
                {monitoring ? 'ON' : 'OFF'}
              </Text>
            </View>
          </View>
        </Pressable>

        <View
          accessibilityLabel={`Loading progress ${displayPercent} percent`}
          accessibilityRole="progressbar"
          style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressLiquid,
                {
                  transform: [
                    {
                      scaleX: animatedProgress.interpolate({
                        inputRange: [0, 100],
                        outputRange: [0, 1],
                      }),
                    },
                  ],
                },
              ]}
            />
            <View style={styles.progressShine} />
          </View>
          <Text style={styles.progressPercent}>{displayPercent}%</Text>
        </View>
      </View>

      <Panel tone="dark" style={styles.bottomPanel}>
        <Text style={styles.testLabel}>ALARM CHECK</Text>
        <MetalButton icon="flash" label="Test" onPress={triggerTestAlert} />
        <View style={styles.divider} />
        <Text style={styles.recentsLabel}>ACTIVITY</Text>
        {stockEvents.length === 0 ? (
          <Text style={styles.emptyRecentsText}>No events yet</Text>
        ) : (
          stockEvents.slice(0, 5).map((event) => (
            <Text key={event.id} style={styles.eventLine}>
              {event.kind.replace('_', ' ').toUpperCase()} · {event.productName}
            </Text>
          ))
        )}
        <View style={styles.divider} />
        <Text style={styles.recentsLabel}>RECENTS</Text>

        {recentVisits.length === 0 ? (
          <View style={styles.emptyRecents}>
            <Ionicons color={palette.whiteShadow} name="time-outline" size={18} />
            <Text style={styles.emptyRecentsText}>Nothing opened yet</Text>
          </View>
        ) : (
          <View style={styles.recentsList}>
            {recentVisits.map((visit) => (
              <RecentBubble
                key={visit.id}
                onOpen={handleOpenRecent}
                onRemove={handleRemoveRecent}
                visit={visit}
              />
            ))}
          </View>
        )}
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', paddingBottom: 8, paddingTop: 4 },
  statusRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: 22 },
  statusLamp: {
    backgroundColor: palette.blackSoft,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  statusLampOn: {
    backgroundColor: palette.red,
    shadowColor: palette.red,
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  statusText: { color: palette.whiteDim, fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  powerBase: {
    backgroundColor: '#000',
    borderRadius: 126,
    height: 252,
    paddingBottom: 8,
    shadowColor: palette.red,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    width: 252,
  },
  powerPressed: { opacity: 0.88, paddingTop: 5 },
  powerRim: {
    backgroundColor: palette.blackSoft,
    borderColor: palette.whiteShadow,
    borderRadius: 126,
    borderWidth: 2,
    height: 244,
    padding: 12,
    width: 252,
  },
  powerRimOn: { borderColor: palette.red, shadowColor: palette.red, shadowOpacity: 0.7, shadowRadius: 9 },
  powerFace: {
    alignItems: 'center',
    backgroundColor: palette.blackRaised,
    borderColor: palette.black,
    borderRadius: 110,
    borderWidth: 5,
    flex: 1,
    justifyContent: 'center',
  },
  powerGlow: {
    alignItems: 'center',
    backgroundColor: palette.black,
    borderColor: palette.blackSoft,
    borderRadius: 57,
    borderWidth: 3,
    height: 114,
    justifyContent: 'center',
    width: 114,
  },
  powerGlowOn: { borderColor: palette.redDark, shadowColor: palette.red, shadowOpacity: 0.8, shadowRadius: 18 },
  powerLabel: { color: palette.whiteShadow, fontSize: 32, fontWeight: '900', letterSpacing: 1, marginTop: 12 },
  powerLabelOn: { color: palette.white },
  powerCaption: { color: palette.whiteShadow, fontSize: 9, fontWeight: '800', letterSpacing: 1.7, marginTop: 2 },
  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
    width: 252,
  },
  progressTrack: {
    backgroundColor: palette.black,
    borderColor: palette.blackSoft,
    borderRadius: 8,
    borderWidth: 2,
    flex: 1,
    height: 14,
    overflow: 'hidden',
  },
  progressLiquid: {
    backgroundColor: palette.red,
    borderRadius: 5,
    height: '100%',
    shadowColor: palette.red,
    shadowOpacity: 0.9,
    shadowRadius: 5,
    transformOrigin: 'left',
    width: '100%',
  },
  progressShine: {
    backgroundColor: palette.white,
    height: 2,
    left: 3,
    opacity: 0.28,
    position: 'absolute',
    right: 3,
    top: 2,
  },
  progressPercent: {
    color: palette.white,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    minWidth: 36,
    textAlign: 'right',
  },
  backendNote: {
    color: palette.whiteShadow,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 14,
    textAlign: 'center',
    width: 280,
  },
  backendMeta: {
    color: palette.whiteShadow,
    fontSize: 10,
    marginTop: 8,
    textAlign: 'center',
    width: 280,
  },
  eventLine: {
    color: palette.whiteDim,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 6,
  },
  bottomPanel: { marginBottom: 4 },
  testLabel: { color: palette.white, fontSize: 13, fontWeight: '900', letterSpacing: 1.2 },
  testCaption: { color: palette.whiteShadow, fontSize: 11, lineHeight: 16, marginTop: 3 },
  divider: { backgroundColor: palette.blackSoft, height: 1, marginVertical: 10 },
  recentsLabel: { color: palette.white, fontSize: 13, fontWeight: '900', letterSpacing: 1.2 },
  recentsCaption: { color: palette.whiteShadow, fontSize: 11, lineHeight: 16, marginBottom: 10, marginTop: 3 },
  emptyRecents: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  emptyRecentsText: { color: palette.whiteShadow, fontSize: 12, fontWeight: '700' },
  recentsList: { gap: 10 },
  recentShadow: {
    backgroundColor: palette.blackSoft,
    borderRadius: 16,
    paddingBottom: 3,
  },
  recentPressed: { opacity: 0.88, paddingTop: 2 },
  recentCard: {
    alignItems: 'center',
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  recentThumb: {
    alignItems: 'center',
    backgroundColor: palette.black,
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 44,
  },
  recentImage: { height: '100%', width: '100%' },
  recentCopy: { flex: 1 },
  recentTitle: { color: palette.white, fontSize: 13, fontWeight: '800', lineHeight: 17 },
  recentMeta: {
    color: palette.whiteShadow,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  deleteAction: {
    alignItems: 'center',
    backgroundColor: palette.red,
    borderRadius: 15,
    justifyContent: 'center',
    marginBottom: 3,
    marginLeft: 8,
    minWidth: 84,
    paddingHorizontal: 12,
  },
  deleteText: { color: palette.white, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 4 },
});
