import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { WebSearchPalette } from '@/components/web-search-palette';
import { palette } from '@/constants/dropdex';
import { useWebLayout } from '@/hooks/use-web-layout';

const LINKS = [
  { href: '/(tabs)', match: ['/', '/(tabs)', '/(tabs)/'], label: 'Home', key: 'home' },
  { href: '/(tabs)/stock', match: ['/stock', '/(tabs)/stock'], label: 'Stock', key: 'stock' },
  { href: '/(tabs)/filter', match: ['/filter', '/(tabs)/filter'], label: 'Filter', key: 'filter' },
  { href: '/(tabs)/region', match: ['/region', '/(tabs)/region'], label: 'Region', key: 'region' },
  {
    href: '/(tabs)/settings',
    match: ['/settings', '/(tabs)/settings'],
    label: 'Settings',
    key: 'settings',
  },
] as const;

function pathActive(pathname: string, match: readonly string[]) {
  const normalized = pathname.replace(/\/$/, '') || '/';
  return match.some((item) => {
    const m = item.replace(/\/$/, '') || '/';
    return normalized === m || normalized.endsWith(m);
  });
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

/**
 * Web top navigation — full bar on desktop; on mobile web only brand + search
 * (tab switching uses the bottom bar).
 */
export function WebTopNav() {
  const { isDesktopWeb, isMobileWeb, isWeb } = useWebLayout();
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!isWeb || Platform.OS !== 'web') return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (searchOpen) return;
      if (isTypingTarget(event.target)) return;

      const metaK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      const slash = event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey;
      if (!metaK && !slash) return;

      event.preventDefault();
      setSearchOpen(true);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isWeb, searchOpen]);

  if (!isWeb) return null;

  if (isMobileWeb) {
    return (
      <>
        <View style={styles.mobileBar}>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/(tabs)')}
            style={styles.mobileBrand}>
            <Text style={styles.mobileBrandText}>DROPLINQ</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Search"
            onPress={() => setSearchOpen(true)}
            style={styles.mobileSearch}>
            <Ionicons color={palette.white} name="search" size={18} />
          </Pressable>
        </View>
        <WebSearchPalette visible={searchOpen} onClose={() => setSearchOpen(false)} />
      </>
    );
  }

  if (!isDesktopWeb) return null;

  return (
    <>
      <View style={styles.bar}>
        <View style={styles.inner}>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/(tabs)')}
            style={styles.brandBlock}>
            <Text style={styles.brand}>DROPLINQ</Text>
            <Text style={styles.tagline}>MONITOR · ALERT · CHECKOUT</Text>
          </Pressable>

          <View style={styles.links}>
            {LINKS.map((link) => {
              const active = pathActive(pathname, link.match);
              return (
                <Pressable
                  key={link.key}
                  accessibilityRole="link"
                  onPress={() => router.push(link.href)}
                  style={[styles.link, active && styles.linkActive]}>
                  <Text style={[styles.linkText, active && styles.linkTextActive]}>{link.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityLabel="Search"
              onPress={() => setSearchOpen(true)}
              style={styles.searchChip}>
              <Ionicons color={palette.whiteShadow} name="search" size={16} />
              <Text style={styles.searchChipText}>Search</Text>
              <View style={styles.kbd}>
                <Text style={styles.kbdText}>/</Text>
              </View>
            </Pressable>
            <Pressable
              accessibilityLabel="Settings"
              onPress={() => router.push('/(tabs)/settings')}
              style={styles.iconBtn}>
              <Ionicons color={palette.white} name="person-circle-outline" size={26} />
            </Pressable>
          </View>
        </View>
      </View>

      <WebSearchPalette visible={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: palette.black,
    borderBottomColor: palette.blackSoft,
    borderBottomWidth: 1,
    width: '100%',
    zIndex: 20,
  },
  inner: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 28,
    maxWidth: 1440,
    paddingHorizontal: 32,
    paddingVertical: 14,
    width: '100%',
  },
  brandBlock: { marginRight: 8 },
  brand: {
    color: palette.white,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  tagline: {
    color: palette.whiteShadow,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 3,
  },
  links: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  link: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  linkActive: {
    backgroundColor: 'rgba(210,13,30,0.16)',
  },
  linkText: {
    color: palette.whiteDim,
    fontSize: 14,
    fontWeight: '800',
  },
  linkTextActive: {
    color: palette.red,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  searchChip: {
    alignItems: 'center',
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchChipText: {
    color: palette.whiteShadow,
    fontSize: 13,
    fontWeight: '700',
  },
  kbd: {
    backgroundColor: palette.black,
    borderColor: palette.blackSoft,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  kbdText: {
    color: palette.whiteShadow,
    fontSize: 11,
    fontWeight: '800',
  },
  iconBtn: {
    padding: 4,
  },
  mobileBar: {
    alignItems: 'center',
    backgroundColor: palette.black,
    borderBottomColor: palette.blackSoft,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    zIndex: 30,
    ...(Platform.OS === 'web'
      ? ({
          paddingTop: 'max(10px, env(safe-area-inset-top))' as unknown as number,
        } as object)
      : null),
  },
  mobileBrand: {
    paddingRight: 4,
  },
  mobileBrandText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  mobileSearch: {
    alignItems: 'center',
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
});
