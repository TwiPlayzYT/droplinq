import { useRouter, usePathname } from 'expo-router';
import { PropsWithChildren } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { brand } from '@/config/app-config';
import { palette } from '@/constants/dropdex';
import { legalHref } from '@/constants/legal';
import { openAppPath } from '@/lib/open-app';
import { useAuth } from '@/store/auth-context';

const navItems = [
  { label: 'Home', href: '/' as const },
  { label: 'PRO', href: '/pro' as const },
  { label: 'Help', href: '/help' as const },
];

export function MarketingChrome({
  children,
  ctaLabel = 'Open App',
}: PropsWithChildren<{ ctaLabel?: string }>) {
  const router = useRouter();
  const pathname = usePathname();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const desktop = width >= 900;

  const goApp = () => router.push(openAppPath(session) as never);

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={[styles.nav, desktop && styles.navDesktop]}>
        <Pressable onPress={() => router.push('/' as never)} style={styles.brandBlock}>
          <Text style={styles.brand}>{brand.displayName}</Text>
          <Text style={styles.brandTag}>{brand.tagline}</Text>
        </Pressable>

        {desktop ? (
          <View style={styles.navLinks}>
            {navItems.map((item) => {
              const isHome = item.href === '/';
              const on = isHome
                ? pathname === '/' || pathname === ''
                : pathname.includes(item.href.replace('/', ''));
              return (
                <Pressable key={item.label} onPress={() => router.push(item.href as never)}>
                  <Text style={[styles.navLink, on && styles.navLinkOn]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <Pressable onPress={goApp} style={styles.navCta}>
          <Text style={styles.navCtaText}>{session ? 'Open App' : ctaLabel}</Text>
        </Pressable>
      </View>

      {!desktop ? (
        <View style={styles.mobileNav}>
          {navItems.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => router.push(item.href as never)}
              style={styles.mobileNavItem}>
              <Text style={styles.mobileNavText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          desktop && styles.scrollDesktop,
          { paddingBottom: Math.max(insets.bottom, 28) + 40 },
        ]}
        showsVerticalScrollIndicator={Platform.OS !== 'web'}>
        {children}

        <View style={styles.footer}>
          <Text style={styles.footerTag}>
            {brand.tagline}. Independent alerts for Pokémon Center — not affiliated with Nintendo or
            The Pokémon Company.
          </Text>
          <View style={styles.footerCols}>
            <View style={styles.footerCol}>
              <Text style={styles.footerHead}>Product</Text>
              <Pressable onPress={() => router.push('/' as never)}>
                <Text style={styles.footerLink}>Home</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/pro' as never)}>
                <Text style={styles.footerLink}>PRO</Text>
              </Pressable>
              <Pressable onPress={goApp}>
                <Text style={styles.footerLink}>Open App</Text>
              </Pressable>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerHead}>Company</Text>
              <Pressable onPress={() => router.push('/help' as never)}>
                <Text style={styles.footerLink}>Help</Text>
              </Pressable>
              <Pressable onPress={() => router.push(legalHref('/legal/privacy') as never)}>
                <Text style={styles.footerLink}>Privacy</Text>
              </Pressable>
              <Pressable onPress={() => router.push(legalHref('/legal/terms') as never)}>
                <Text style={styles.footerLink}>Terms</Text>
              </Pressable>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerHead}>Get the app</Text>
              <Text style={styles.footerMuted}>Web app live now</Text>
              <Text style={styles.footerMuted}>iOS · To be decided</Text>
              <Text style={styles.footerMuted}>Android · To be decided</Text>
            </View>
          </View>
          <Text style={styles.footerMeta}>
            {brand.legalName} · {brand.jurisdiction} · Support: To be decided
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: palette.black,
    flex: 1,
  },
  nav: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  navDesktop: {
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  brandBlock: {
    flexShrink: 1,
  },
  brand: {
    color: palette.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  brandTag: {
    color: palette.whiteShadow,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginTop: 2,
  },
  navLinks: {
    flexDirection: 'row',
    gap: 28,
  },
  navLink: {
    color: palette.whiteDim,
    fontSize: 14,
    fontWeight: '700',
  },
  navLinkOn: {
    color: palette.white,
  },
  navCta: {
    backgroundColor: palette.red,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  navCtaText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  mobileNav: {
    borderBottomColor: palette.blackSoft,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 10,
    paddingHorizontal: 14,
  },
  mobileNavItem: {
    backgroundColor: palette.blackRaised,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  mobileNavText: {
    color: palette.whiteDim,
    fontSize: 12,
    fontWeight: '800',
  },
  scroll: {
    paddingHorizontal: 18,
  },
  scrollDesktop: {
    paddingHorizontal: 40,
  },
  footer: {
    borderTopColor: palette.blackSoft,
    borderTopWidth: 1,
    gap: 18,
    marginTop: 56,
    paddingTop: 28,
  },
  footerTag: {
    color: palette.whiteShadow,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
    maxWidth: 520,
  },
  footerCols: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 28,
  },
  footerCol: {
    gap: 8,
    minWidth: 120,
  },
  footerHead: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  footerLink: {
    color: palette.whiteDim,
    fontSize: 13,
    fontWeight: '600',
  },
  footerMuted: {
    color: palette.whiteShadow,
    fontSize: 13,
    fontWeight: '600',
  },
  footerMeta: {
    color: palette.whiteShadow,
    fontSize: 11,
    fontWeight: '600',
  },
});
