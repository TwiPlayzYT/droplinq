import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { brand } from '@/config/app-config';
import { palette } from '@/constants/dropdex';
import { legalHref, legalNav } from '@/constants/legal';
import { useWebLayout } from '@/hooks/use-web-layout';

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { isDesktopWeb } = useWebLayout();

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, isDesktopWeb && styles.wrapDesktop]}>
      <Text style={styles.disclaimer}>{brand.disclaimer}</Text>
      <View style={styles.links}>
        {legalNav.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="link"
            onPress={() => router.push(legalHref(item.href))}
            style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
            <Text style={styles.linkText}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.meta}>
        {brand.legalName} · {brand.jurisdiction} · {brand.contactEmail}
      </Text>
      <Text style={styles.meta}>
        Product photos belong to their retailers and are shown only to identify items. No customer
        reviews are displayed on this site.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopColor: palette.blackSoft,
    borderTopWidth: 1,
    gap: 10,
    marginTop: 28,
    paddingTop: 18,
  },
  wrapCompact: {
    marginTop: 18,
    paddingTop: 14,
  },
  wrapDesktop: {
    marginTop: 36,
  },
  disclaimer: {
    color: palette.whiteShadow,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  link: {
    borderColor: palette.blackSoft,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  linkText: {
    color: palette.whiteDim,
    fontSize: 12,
    fontWeight: '800',
  },
  meta: {
    color: palette.whiteShadow,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  pressed: { opacity: 0.82 },
});
