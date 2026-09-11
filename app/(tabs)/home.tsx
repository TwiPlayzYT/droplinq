import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, {
  SwipeDirection,
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { BrandHeader, MetalButton, Panel, Screen } from '@/components/dropdex-ui';
import { TourAnchor } from '@/components/tour-anchor';
import { isTutorialSessionActive } from '@/services/tour-session';
import { palette } from '@/constants/dropdex';
import { getRegion } from '@/data/regions';
import { useWebLayout } from '@/hooks/use-web-layout';
import { useDropDex } from '@/store/dropdex-context';
import { RecentVisit, WatchedItem } from '@/types/dropdex';

const DELETE_WIDTH = 92;

const TEST_DELAY_OPTIONS: { label: string; ms: number }[] = [
  { label: 'Now', ms: 0 },
  { label: '10s', ms: 10_000 },
  { label: '30s', ms: 30_000 },
  { label: '1 min', ms: 60_000 },
  { label: '5 min', ms: 300_000 },
];

function DeleteAction({
  progress,
  translation,
}: {
  progress: SharedValue<number>;
  translation: SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const drag = Math.min(Math.abs(translation.value), DELETE_WIDTH);
    const reveal = drag / DELETE_WIDTH;
    const opacity = interpolate(reveal, [0, 0.25, 1], [0.25, 0.75, 1], Extrapolation.CLAMP);
    const scale = interpolate(reveal, [0, 1], [0.88, 1], Extrapolation.CLAMP);
    const nudge = interpolate(progress.value, [0, 1], [18, 0], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ translateX: nudge }, { scale }],
    };
  });

  return (
    <Reanimated.View style={[styles.deleteAction, animatedStyle]}>
      <Ionicons color={palette.white} name="trash-outline" size={22} />
      <Text style={styles.deleteText}>REMOVE</Text>
    </Reanimated.View>
  );
}

function renderDeleteActions(
  progress: SharedValue<number>,
  translation: SharedValue<number>,
  _methods: SwipeableMethods,
) {
  return <DeleteAction progress={progress} translation={translation} />;
}

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
    <ReanimatedSwipeable
      animationOptions={{ damping: 28, mass: 0.65, stiffness: 320 }}
      containerStyle={styles.swipeContainer}
      dragOffsetFromRightEdge={6}
      enableTrackpadTwoFingerGesture
      friction={1}
      onSwipeableOpen={(direction) => {
        if (direction === SwipeDirection.LEFT) onRemove(visit);
      }}
      overshootFriction={8}
      overshootRight={false}
      renderRightActions={renderDeleteActions}
      rightThreshold={36}>
      <Pressable
        unstable_pressDelay={0}
        accessibilityHint="Opens this product again"
        accessibilityLabel={`Open ${visit.product.title}`}
        accessibilityRole="button"
        onPress={() => onOpen(visit)}
        style={({ pressed }) => [styles.recentShadow, pressed && styles.recentPressed]}>
        <View style={styles.recentCard}>
          <View style={styles.recentThumb}>
            {visit.product.imageUrl ? (
              <Image
                accessibilityLabel={`Product photo of ${visit.product.title}. Image belongs to the retailer.`}
                alt={`Product photo of ${visit.product.title}`}
                contentFit="cover"
                source={{ uri: visit.product.imageUrl }}
                style={styles.recentImage}
                transition={0}
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
    </ReanimatedSwipeable>
  );
});

const WatchBubble = memo(function WatchBubble({
  item,
  onOpen,
  onRemove,
}: {
  item: WatchedItem;
  onOpen: (item: WatchedItem) => void;
  onRemove: (item: WatchedItem) => void;
}) {
  return (
    <ReanimatedSwipeable
      animationOptions={{ damping: 28, mass: 0.65, stiffness: 320 }}
      containerStyle={styles.swipeContainer}
      dragOffsetFromRightEdge={6}
      enableTrackpadTwoFingerGesture
      friction={1}
      onSwipeableOpen={(direction) => {
        if (direction === SwipeDirection.LEFT) onRemove(item);
      }}
      overshootFriction={8}
      overshootRight={false}
      renderRightActions={renderDeleteActions}
      rightThreshold={36}>
      <Pressable
        unstable_pressDelay={0}
        accessibilityHint="Opens this watched product"
        accessibilityLabel={`Open ${item.product.title}`}
        accessibilityRole="button"
        onPress={() => onOpen(item)}
        style={({ pressed }) => [styles.recentShadow, pressed && styles.recentPressed]}>
        <View style={styles.recentCard}>
          <View style={styles.recentThumb}>
            {item.product.imageUrl ? (
              <Image
                accessibilityLabel={`Product photo of ${item.product.title}. Image belongs to the retailer.`}
                alt={`Product photo of ${item.product.title}`}
                contentFit="cover"
                source={{ uri: item.product.imageUrl }}
                style={styles.recentImage}
                transition={0}
              />
            ) : (
              <Ionicons color={palette.whiteShadow} name="bookmark-outline" size={18} />
            )}
          </View>
          <View style={styles.recentCopy}>
            <Text numberOfLines={2} style={styles.recentTitle}>
              {item.product.title}
            </Text>
          </View>
          <Ionicons color={palette.whiteShadow} name="chevron-forward" size={16} />
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
});

export default function HomeScreen() {
  const router = useRouter();
  const { isDesktopWeb } = useWebLayout();
  const {
    hydrated,
    liveStatus,
    monitoring,
    openProductBrowser,
    recentVisits,
    region,
    removeFromWatchlist,
    removeRecentVisit,
    scheduleTestAlert,
    setMonitoring,
    stockEvents,
    webPushState,
    watchlist,
  } = useDropDex();
  const [testPickerOpen, setTestPickerOpen] = useState(false);
  const regionConfig = getRegion(region);
  const handleOpenRecent = useCallback(
    (visit: RecentVisit) => openProductBrowser(visit.product),
    [openProductBrowser],
  );
  const handleRemoveRecent = useCallback(
    (visit: RecentVisit) => removeRecentVisit(visit.id),
    [removeRecentVisit],
  );
  const handleOpenWatch = useCallback(
    (item: WatchedItem) => router.push(`/product/${item.product.id}`),
    [router],
  );
  const handleRemoveWatch = useCallback(
    (item: WatchedItem) => removeFromWatchlist(item.product.id),
    [removeFromWatchlist],
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

  const showEnableBanner =
    Platform.OS === 'web' &&
    webPushState !== 'subscribed' &&
    webPushState !== 'unsupported' &&
    webPushState !== 'checking';

  const pickTestDelay = (ms: number) => {
    setTestPickerOpen(false);
    scheduleTestAlert(ms);
  };

  const testScheduleRow = (
    <View style={styles.scheduleBlock}>
      {testPickerOpen ? (
        <>
          <Text style={styles.schedulePrompt}>When should the test fire?</Text>
          <View style={styles.scheduleChips}>
            {TEST_DELAY_OPTIONS.map((option) => (
              <Pressable
                key={option.label}
                accessibilityLabel={`Schedule test alert ${option.label}`}
                onPress={() => pickTestDelay(option.ms)}
                style={({ pressed }) => [styles.scheduleChip, pressed && styles.subNavPressed]}>
                <Text style={styles.scheduleChipText}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => setTestPickerOpen(false)} style={styles.scheduleCancel}>
            <Text style={styles.scheduleCancelText}>Cancel</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );

  return (
    <Screen wide>
      {!isDesktopWeb ? <BrandHeader eyebrow={regionConfig.label} /> : null}

      {showEnableBanner ? (
        <View style={styles.enableBanner}>
          <View style={styles.enableBannerCopy}>
            <Text style={styles.enableBannerTitle}>Enable lock-screen notifications</Text>
            <Text style={styles.enableBannerBody}>
              Get pinged when stock moves — even with DropLinq closed.
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Enable notifications"
            accessibilityRole="button"
            onPress={() => router.push('/notifications' as never)}
            style={({ pressed }) => [styles.enableBannerBtn, pressed && styles.subNavPressed]}>
            <Text style={styles.enableBannerBtnText}>Enable</Text>
          </Pressable>
        </View>
      ) : null}
      {isDesktopWeb ? (
        <View style={styles.desktopPage}>
          <View style={styles.desktopHeader}>
            <View>
              <Text style={styles.desktopEyebrow}>{regionConfig.label.toUpperCase()}</Text>
              <Text style={styles.desktopTitle}>Command Center</Text>
            </View>
            <View style={styles.subNav}>
              <View style={[styles.subNavPill, styles.subNavPillActive]}>
                <Text style={[styles.subNavText, styles.subNavTextActive]}>Overview</Text>
              </View>
              <Pressable
                unstable_pressDelay={0}
                onPress={() => router.push('/(tabs)/stock')}
                style={({ pressed }) => [styles.subNavPill, pressed && styles.subNavPressed]}>
                <Text style={styles.subNavText}>Stock</Text>
              </Pressable>
              <Pressable
                unstable_pressDelay={0}
                onPress={() => router.push('/(tabs)/filter')}
                style={({ pressed }) => [styles.subNavPill, pressed && styles.subNavPressed]}>
                <Text style={styles.subNavText}>Coverage</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.desktopGrid}>
            <View style={styles.mainCard}>
              <View style={styles.mainStatusBlock}>
                <View style={styles.statusRowDesktop}>
                  <View style={[styles.statusLampLg, monitoring && styles.statusLampOn]} />
                  <Text style={[styles.statusHeadline, monitoring && styles.statusHeadlineOn]}>
                    {!hydrated ? 'LOADING' : monitoring ? 'ALERTS ON' : 'ALERTS OFF'}
                  </Text>
                </View>
                <Text style={styles.statusRegion}>
                  {monitoring
                    ? `${regionConfig.label} · monitoring on`
                    : `${regionConfig.label} · tap power to arm`}
                </Text>
              </View>

              <View style={styles.mainCardStage}>
                <TourAnchor id="home-power">
                <Pressable
                  unstable_pressDelay={0}
                  accessibilityHint="Turns DropLinq alerts on or off"
                  accessibilityLabel={`Alerts ${monitoring ? 'on' : 'off'}`}
                  accessibilityRole="button"
                  disabled={!hydrated && !isTutorialSessionActive()}
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
                </TourAnchor>
              </View>

              {monitoring && displayPercent < 100 ? (
                <View
                  accessibilityLabel={`Loading progress ${displayPercent} percent`}
                  accessibilityRole="progressbar"
                  style={styles.desktopProgressRow}>
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
              ) : (
                <Text style={styles.powerHint}>
                  {monitoring ? 'Checking Pokémon Center stock' : 'Alerts are off'}
                </Text>
              )}
            </View>

            <View style={styles.sideCol}>
              <View style={styles.sideCard}>
                <View style={styles.sideCardHeader}>
                  <Text style={[styles.sideCardTitle, styles.sideCardTitleInline]}>Activity</Text>
                  <TourAnchor id="home-test">
                  <Pressable
                    accessibilityLabel="Schedule test alert"
                    accessibilityRole="button"
                    unstable_pressDelay={0}
                    onPress={() => {
                      if (isTutorialSessionActive()) {
                        scheduleTestAlert(0);
                        return;
                      }
                      setTestPickerOpen((open) => !open);
                    }}
                    style={({ pressed }) => [styles.testChip, pressed && styles.subNavPressed]}>
                    <Ionicons color={palette.cardInk} name="flash" size={14} />
                    <Text style={styles.testChipText}>TEST</Text>
                  </Pressable>
                  </TourAnchor>
                </View>
                {testPickerOpen ? testScheduleRow : null}
                {stockEvents.length === 0 ? (
                  <Text style={styles.emptyRecentsText}>No events yet</Text>
                ) : (
                  stockEvents.slice(0, 6).map((event) => (
                    <Text key={event.id} style={styles.eventLine}>
                      {event.kind.replace('_', ' ').toUpperCase()} · {event.productName}
                    </Text>
                  ))
                )}
              </View>

              <View style={styles.sideCard}>
                <Text style={styles.sideCardTitle}>Watchlist</Text>
                {watchlist.length === 0 ? (
                  <View style={styles.emptyRecents}>
                    <Ionicons color={palette.whiteShadow} name="bookmark-outline" size={18} />
                    <Text style={styles.emptyRecentsText}>Nothing watched yet</Text>
                  </View>
                ) : (
                  <View style={styles.recentsList}>
                    {watchlist.map((item) => (
                      <WatchBubble
                        key={item.id}
                        item={item}
                        onOpen={handleOpenWatch}
                        onRemove={handleRemoveWatch}
                      />
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.sideCard}>
                <Text style={styles.sideCardTitle}>Recents</Text>
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
              </View>
            </View>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.body}>
            <View style={styles.statusRow}>
              <View style={[styles.statusLamp, monitoring && styles.statusLampOn]} />
              <Text style={styles.statusText}>
                {!hydrated ? 'LOADING' : monitoring ? 'ALERTS ON' : 'ALERTS OFF'}
              </Text>
            </View>

            <TourAnchor id="home-power">
            <Pressable
              unstable_pressDelay={0}
              accessibilityHint="Turns DropLinq alerts on or off"
              accessibilityLabel={`Alerts ${monitoring ? 'on' : 'off'}`}
              accessibilityRole="button"
              disabled={!hydrated && !isTutorialSessionActive()}
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
            </TourAnchor>

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
            <TourAnchor id="home-test">
              <MetalButton
                icon="flash"
                label={testPickerOpen ? 'Pick a time below' : 'Schedule test alert'}
                onPress={() => {
                  if (isTutorialSessionActive()) {
                    scheduleTestAlert(0);
                    return;
                  }
                  setTestPickerOpen((open) => !open);
                }}
              />
            </TourAnchor>
            {testPickerOpen ? testScheduleRow : null}
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
            <Text style={styles.recentsLabel}>WATCHLIST</Text>
            {watchlist.length === 0 ? (
              <View style={styles.emptyRecents}>
                <Ionicons color={palette.whiteShadow} name="bookmark-outline" size={18} />
                <Text style={styles.emptyRecentsText}>Nothing watched yet</Text>
              </View>
            ) : (
              <View style={styles.recentsList}>
                {watchlist.map((item) => (
                  <WatchBubble
                    key={item.id}
                    item={item}
                    onOpen={handleOpenWatch}
                    onRemove={handleRemoveWatch}
                  />
                ))}
              </View>
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
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  desktopPage: {
    gap: 18,
    width: '100%',
  },
  desktopHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  desktopEyebrow: {
    color: palette.whiteShadow,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 4,
  },
  desktopTitle: {
    color: palette.white,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  subNav: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subNavPill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  subNavPillActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  subNavPressed: { opacity: 0.75 },
  subNavText: {
    color: palette.whiteShadow,
    fontSize: 13,
    fontWeight: '700',
  },
  subNavTextActive: {
    color: palette.red,
  },
  desktopGrid: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  mainCard: {
    alignItems: 'center',
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: '68%',
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'center',
    minHeight: 560,
    minWidth: 0,
    paddingHorizontal: 28,
    paddingVertical: 36,
  },
  mainStatusBlock: {
    alignItems: 'center',
    marginBottom: 8,
  },
  statusRowDesktop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  statusLampLg: {
    backgroundColor: palette.blackSoft,
    borderRadius: 7,
    height: 14,
    width: 14,
  },
  statusHeadline: {
    color: palette.whiteShadow,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2.4,
  },
  statusHeadlineOn: {
    color: palette.white,
  },
  statusRegion: {
    color: palette.whiteShadow,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  mainCardStage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  desktopProgressRow: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  powerHint: {
    color: palette.whiteShadow,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  sideCol: {
    flexBasis: '32%',
    flexGrow: 0,
    flexShrink: 0,
    gap: 16,
    maxWidth: 420,
    minWidth: 300,
  },
  sideCard: {
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  sideCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sideCardTitle: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  sideCardTitleInline: {
    marginBottom: 0,
  },
  testChip: {
    alignItems: 'center',
    backgroundColor: palette.card,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  testChipText: {
    color: palette.cardInk,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  enableBanner: {
    alignItems: 'center',
    backgroundColor: palette.blackRaised,
    borderColor: palette.redDark,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  enableBannerCopy: { flex: 1, gap: 4, minWidth: 0 },
  enableBannerTitle: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '800',
  },
  enableBannerBody: {
    color: palette.whiteShadow,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  enableBannerBtn: {
    backgroundColor: palette.red,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  enableBannerBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  scheduleBlock: {
    gap: 10,
    marginBottom: 12,
    marginTop: 4,
  },
  schedulePrompt: {
    color: palette.whiteDim,
    fontSize: 12,
    fontWeight: '700',
  },
  scheduleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scheduleChip: {
    backgroundColor: palette.card,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scheduleChipText: {
    color: palette.cardInk,
    fontSize: 12,
    fontWeight: '800',
  },
  scheduleCancel: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  scheduleCancelText: {
    color: palette.whiteShadow,
    fontSize: 12,
    fontWeight: '700',
  },
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
    borderColor: palette.cardBorder,
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
    backgroundColor: palette.card,
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
  eventLine: {
    color: palette.whiteDim,
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 8,
    marginTop: 2,
  },
  bottomPanel: { marginBottom: 4 },
  testLabel: { color: palette.white, fontSize: 13, fontWeight: '900', letterSpacing: 1.2 },
  divider: { backgroundColor: palette.blackSoft, height: 1, marginVertical: 14 },
  recentsLabel: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  emptyRecents: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 10,
  },
  emptyRecentsText: { color: palette.whiteShadow, fontSize: 12, fontWeight: '700', lineHeight: 17 },
  recentsList: { gap: 12 },
  swipeContainer: {
    overflow: 'hidden',
  },
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
  recentTitle: { color: palette.white, fontSize: 13, fontWeight: '800', lineHeight: 18 },
  deleteAction: {
    alignItems: 'center',
    backgroundColor: palette.red,
    borderRadius: 15,
    height: '100%',
    justifyContent: 'center',
    marginBottom: 3,
    marginLeft: 8,
    width: DELETE_WIDTH,
  },
  deleteText: { color: palette.white, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 4 },
});
