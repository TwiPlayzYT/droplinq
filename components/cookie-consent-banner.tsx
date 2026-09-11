import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/dropdex';
import { legalHref } from '@/constants/legal';
import { useCookieConsent } from '@/hooks/use-cookie-consent';
import { useMobileWebChrome } from '@/hooks/use-mobile-web-chrome';
import { useWebLayout } from '@/hooks/use-web-layout';
import { useAuth } from '@/store/auth-context';

export function CookieConsentBanner() {
  const { needsBanner, acceptEssential } = useCookieConsent();
  const { session } = useAuth();
  const { isDesktopWeb, isMobileWeb } = useWebLayout();
  const { tabBarHeight } = useMobileWebChrome();
  const router = useRouter();

  // Returning signed-in users already have a session — accept essential silently.
  useEffect(() => {
    if (session && needsBanner) {
      void acceptEssential();
    }
  }, [acceptEssential, needsBanner, session]);

  if (!needsBanner || session) return null;

  return (
    <View
      accessibilityRole="alert"
      pointerEvents="box-none"
      style={[
        styles.layer,
        isMobileWeb && { paddingBottom: Math.max(12, tabBarHeight + 8) },
      ]}>
      <View style={[styles.card, isDesktopWeb && styles.cardDesktop]}>
        <Text style={styles.title}>Cookies on DropLinq</Text>
        <Text style={styles.copy}>
          We only use essential cookies and on-device storage to keep you signed in and remember
          settings. No advertising trackers.
        </Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityLabel="Read cookie policy"
            accessibilityRole="link"
            onPress={() => router.push(legalHref('/legal/cookies'))}
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>Cookie policy</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Accept essential cookies"
            accessibilityRole="button"
            onPress={() => void acceptEssential()}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <Ionicons color={palette.controlInk} name="checkmark" size={16} />
            <Text style={styles.primaryText}>Accept essential cookies</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    bottom: 0,
    left: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'absolute',
    right: 0,
    zIndex: 80,
  },
  card: {
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardDesktop: {
    alignSelf: 'center',
    maxWidth: 720,
    width: '100%',
  },
  title: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '900',
  },
  copy: {
    color: palette.whiteDim,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  secondary: {
    borderColor: palette.blackSoft,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryText: {
    color: palette.whiteDim,
    fontSize: 13,
    fontWeight: '800',
  },
  primary: {
    alignItems: 'center',
    backgroundColor: palette.control,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryText: {
    color: palette.controlInk,
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: { opacity: 0.88 },
});
