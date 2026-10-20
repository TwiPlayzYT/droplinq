import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { MetalButton } from '@/components/dropdex-ui';
import { palette } from '@/constants/dropdex';
import {
  NEWS_ITEMS,
  NEWS_SEEN_KEY,
  type NewsItem,
  sortNewsNewestFirst,
  unreadNews,
} from '@/constants/news';
import { DEVICE_PROMPT_DONE_KEY, isDevicePromptDoneMemory } from '@/constants/preferred-device';
import { TUTORIAL_STORAGE_KEY, subscribeTutorialSettled } from '@/constants/tutorial';
import { hasAcceptedCurrentLegal, useAuth } from '@/store/auth-context';

type NewsContextValue = {
  openNews: (itemId?: string) => void;
  unreadCount: number;
};

const NewsContext = createContext<NewsContextValue | null>(null);

export function useNews() {
  const value = useContext(NewsContext);
  if (!value) throw new Error('useNews must be used inside NewsHost');
  return value;
}

/** Safe for chrome that may render outside NewsHost during boot. */
export function useNewsOptional() {
  return useContext(NewsContext);
}

function isAppPath(pathname: string) {
  const path = (pathname || '/').split('?')[0].replace(/\/+$/, '') || '/';
  if (path === '/' || path === '/pro' || path === '/help') return false;
  if (path === '/start' || path === '/sign-in' || path === '/sign-up') return false;
  if (path.startsWith('/legal') || path.includes('accept')) return false;
  if (path === '/setup' || path.startsWith('/setup/')) return false;
  if (path === '/app') return false;
  return (
    path === '/home' ||
    path === '/stock' ||
    path === '/filter' ||
    path === '/region' ||
    path === '/settings' ||
    path.startsWith('/product/') ||
    path.startsWith('/alerts/') ||
    path.startsWith('/notifications')
  );
}

function formatNewsDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

let sessionAutoShown = false;

/**
 * In-app News (changelog-style). Badge + icon in the top nav; auto-opens once
 * after login when there is unread news the user has not seen yet.
 */
export function NewsHost({ children }: { children: ReactNode }) {
  const { profile, profileReady, session } = useAuth();
  const pathname = usePathname();
  const { height, width } = useWindowDimensions();
  const stacked = width < 640;
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const [tutorialSettled, setTutorialSettled] = useState(false);
  const [devicePromptDone, setDevicePromptDone] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const items = useMemo(() => sortNewsNewestFirst(NEWS_ITEMS), []);
  const unread = useMemo(() => unreadNews(seenIds, items), [items, seenIds]);
  const active = items.find((item) => item.id === activeId) ?? unread[0] ?? items[0] ?? null;

  const legalOk = hasAcceptedCurrentLegal(profile);
  const mayAutoShow =
    profileReady &&
    Boolean(session) &&
    legalOk &&
    Boolean(profile?.onboardingCompleted) &&
    tutorialSettled &&
    devicePromptDone &&
    isAppPath(pathname);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(NEWS_SEEN_KEY)
      .then((raw) => {
        if (cancelled) return;
        try {
          const parsed = raw ? (JSON.parse(raw) as string[]) : [];
          setSeenIds(new Set(Array.isArray(parsed) ? parsed : []));
        } catch {
          setSeenIds(new Set());
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setSeenIds(new Set());
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(TUTORIAL_STORAGE_KEY)
      .then((value) => {
        if (!cancelled) setTutorialSettled(value === 'done' || value === 'skipped');
      })
      .catch(() => {
        if (!cancelled) setTutorialSettled(false);
      });
    const unsub = subscribeTutorialSettled(() => setTutorialSettled(true));
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setDevicePromptDone(true);
      return;
    }
    let cancelled = false;
    AsyncStorage.getItem(DEVICE_PROMPT_DONE_KEY)
      .then((value) => {
        if (!cancelled) setDevicePromptDone(value === '1' || isDevicePromptDoneMemory());
      })
      .catch(() => {
        if (!cancelled) setDevicePromptDone(isDevicePromptDoneMemory());
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const persistSeen = useCallback(async (ids: Set<string>) => {
    setSeenIds(ids);
    await AsyncStorage.setItem(NEWS_SEEN_KEY, JSON.stringify([...ids])).catch(() => undefined);
  }, []);

  const markRead = useCallback(
    async (item: NewsItem | null) => {
      if (!item) return;
      if (seenIds.has(item.id)) return;
      const next = new Set(seenIds);
      next.add(item.id);
      await persistSeen(next);
    },
    [persistSeen, seenIds],
  );

  const markAllRead = useCallback(async () => {
    const next = new Set(seenIds);
    items.forEach((item) => next.add(item.id));
    await persistSeen(next);
  }, [items, persistSeen, seenIds]);

  const openNews = useCallback(
    (itemId?: string) => {
      const target = itemId
        ? items.find((item) => item.id === itemId)
        : unread[0] ?? items[0];
      setActiveId(target?.id ?? null);
      setVisible(true);
      if (target) void markRead(target);
    },
    [items, markRead, unread],
  );

  const closeNews = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!ready || !mayAutoShow || sessionAutoShown) return;
    if (unread.length === 0) return;
    sessionAutoShown = true;
    setActiveId(unread[0].id);
    setVisible(true);
    void markRead(unread[0]);
  }, [markRead, mayAutoShow, ready, unread]);

  const value = useMemo(
    () => ({
      openNews,
      unreadCount: unread.length,
    }),
    [openNews, unread.length],
  );

  return (
    <NewsContext.Provider value={value}>
      {children}
      <Modal animationType="fade" transparent visible={visible} onRequestClose={closeNews}>
        <View style={styles.backdrop}>
          <Pressable accessibilityLabel="Dismiss news" onPress={closeNews} style={styles.scrim} />
          <View style={[styles.card, { maxHeight: Math.min(height * 0.86, 640) }]}>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.kicker}>NEWS</Text>
                <Text style={styles.headerTitle}>DropLinq updates</Text>
              </View>
              <Pressable accessibilityLabel="Close" onPress={closeNews} style={styles.closeBtn}>
                <Ionicons color={palette.whiteDim} name="close" size={20} />
              </Pressable>
            </View>

            <View style={[styles.bodyRow, stacked && styles.bodyStacked]}>
              <ScrollView
                style={[styles.list, stacked && styles.listStacked]}
                showsVerticalScrollIndicator={false}>
                {items.map((item) => {
                  const selected = item.id === active?.id;
                  const isUnread = !seenIds.has(item.id);
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        setActiveId(item.id);
                        void markRead(item);
                      }}
                      style={[styles.listItem, selected && styles.listItemOn]}>
                      <View style={styles.listItemTop}>
                        {isUnread ? <View style={styles.dot} /> : <View style={styles.dotSpacer} />}
                        <Text numberOfLines={2} style={[styles.listTitle, selected && styles.listTitleOn]}>
                          {item.title}
                        </Text>
                      </View>
                      <Text style={styles.listMeta}>{formatNewsDate(item.publishedAt)}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <ScrollView style={styles.detail} showsVerticalScrollIndicator={false}>
                {active ? (
                  <>
                    <Text style={styles.detailTitle}>{active.title}</Text>
                    <Text style={styles.detailMeta}>
                      {formatNewsDate(active.publishedAt)}
                      {active.sourceLabel ? ` · ${active.sourceLabel}` : ''}
                    </Text>
                    <Text style={styles.detailSummary}>{active.summary}</Text>
                    <View style={styles.rule} />
                    {active.body.split(/\n\n+/).map((paragraph) => (
                      <Text key={paragraph.slice(0, 24)} style={styles.detailBody}>
                        {paragraph}
                      </Text>
                    ))}
                  </>
                ) : (
                  <Text style={styles.empty}>No news yet.</Text>
                )}
              </ScrollView>
            </View>

            <View style={styles.footer}>
              {unread.length > 0 ? (
                <MetalButton icon="checkmark-done-outline" label="Mark all read" onPress={() => void markAllRead()} />
              ) : null}
              <MetalButton icon="close-outline" label="Close" onPress={closeNews} />
            </View>
          </View>
        </View>
      </Modal>
    </NewsContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.62)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 720,
    zIndex: 2,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: palette.blackSoft,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  headerText: { flex: 1, minWidth: 0 },
  kicker: {
    color: palette.red,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
    marginBottom: 2,
  },
  headerTitle: {
    color: palette.white,
    fontSize: 18,
    fontWeight: '900',
  },
  closeBtn: {
    alignItems: 'center',
    backgroundColor: palette.black,
    borderColor: palette.blackSoft,
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  bodyRow: {
    flexDirection: 'row',
    flexGrow: 1,
    minHeight: 280,
  },
  bodyStacked: {
    flexDirection: 'column',
  },
  list: {
    borderRightColor: palette.blackSoft,
    borderRightWidth: 1,
    maxWidth: 240,
    width: '38%',
  },
  listStacked: {
    borderBottomColor: palette.blackSoft,
    borderBottomWidth: 1,
    borderRightWidth: 0,
    maxHeight: 140,
    maxWidth: '100%',
    width: '100%',
  },
  listItem: {
    borderBottomColor: palette.blackSoft,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  listItemOn: {
    backgroundColor: 'rgba(210,13,30,0.12)',
  },
  listItemTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    backgroundColor: palette.red,
    borderRadius: 3,
    height: 6,
    marginTop: 6,
    width: 6,
  },
  dotSpacer: {
    height: 6,
    marginTop: 6,
    width: 6,
  },
  listTitle: {
    color: palette.whiteDim,
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  listTitleOn: {
    color: palette.white,
  },
  listMeta: {
    color: palette.whiteShadow,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 14,
    marginTop: 4,
  },
  detail: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  detailTitle: {
    color: palette.white,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 23,
    marginBottom: 6,
  },
  detailMeta: {
    color: palette.whiteShadow,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  detailSummary: {
    color: palette.whiteDim,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  rule: {
    backgroundColor: palette.blackSoft,
    height: 1,
    marginVertical: 14,
  },
  detailBody: {
    color: palette.whiteDim,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 12,
  },
  empty: {
    color: palette.whiteShadow,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    borderTopColor: palette.blackSoft,
    borderTopWidth: 1,
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
