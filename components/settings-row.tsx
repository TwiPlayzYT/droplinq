import { Ionicons } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MechanicalToggle } from '@/components/dropdex-ui';
import { tourDomProps } from '@/components/tour-anchor';
import { palette } from '@/constants/dropdex';
import { emitTourAction, isTutorialSessionActive } from '@/services/tour-session';

type RowBase = {
  title: string;
  caption?: string;
  last?: boolean;
};

export function SettingsGroup({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.groupWrap}>
      {title ? <Text style={styles.groupTitle}>{title}</Text> : null}
      <View style={styles.group}>{children}</View>
    </View>
  );
}

export function SettingsNavRow({
  title,
  caption,
  last,
  onPress,
  value,
  tourId,
}: RowBase & { onPress: () => void; value?: string; tourId?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        if (tourId && isTutorialSessionActive()) {
          emitTourAction(tourId === 'settings-homescreen' ? 'tap' : tourId);
          if (tourId === 'settings-homescreen') return;
        }
        onPress();
      }}
      style={({ pressed }) => [styles.row, last && styles.rowLast, pressed && styles.pressed]}
      {...(tourId ? tourDomProps(tourId) : null)}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>
      {value ? (
        <Text numberOfLines={1} style={styles.value}>
          {value}
        </Text>
      ) : null}
      <Ionicons color={palette.cardMuted} name="chevron-forward" size={18} />
    </Pressable>
  );
}

export function SettingsToggleRow({
  title,
  caption,
  last,
  value,
  onChange,
  tourId,
}: RowBase & { value: boolean; onChange: (value: boolean) => void; tourId?: string }) {
  return (
    <View
      style={[styles.toggleWrap, last && styles.rowLast]}
      {...(tourId ? tourDomProps(tourId) : null)}>
      <MechanicalToggle caption={caption} label={title} onChange={onChange} value={value} />
    </View>
  );
}

export function SettingsLinkRow({
  title,
  last,
  onPress,
}: {
  title: string;
  last?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => [styles.row, last && styles.rowLast, pressed && styles.pressed]}>
      <Text style={styles.linkTitle}>{title}</Text>
      <Ionicons color={palette.cardMuted} name="open-outline" size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  groupWrap: {
    marginBottom: 22,
  },
  groupTitle: {
    color: palette.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  group: {
    backgroundColor: palette.card,
    borderColor: palette.cardBorder,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    alignItems: 'center',
    borderBottomColor: palette.cardBorder,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  toggleWrap: {
    borderBottomColor: palette.cardBorder,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  title: {
    color: palette.cardInk,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  caption: {
    color: palette.cardMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 4,
  },
  value: {
    color: palette.cardMuted,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 120,
  },
  linkTitle: {
    color: palette.cardInk,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  pressed: { opacity: 0.82 },
});
