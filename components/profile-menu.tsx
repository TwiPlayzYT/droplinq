import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutRectangle,
} from 'react-native';

import { palette } from '@/constants/dropdex';
import { useAppearance, useAppearanceOptions } from '@/store/appearance-context';
import { useAuth } from '@/store/auth-context';

type Props = {
  /** Compact avatar-only trigger (mobile top bar). */
  compact?: boolean;
};

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || 'DL';
}

function ProfileAvatar({ label, size = 34 }: { label: string; size?: number }) {
  return (
    <View
      style={[
        styles.avatar,
        {
          backgroundColor: palette.red,
          borderRadius: size / 2,
          height: size,
          width: size,
        },
      ]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.34 }]}>{initialsFrom(label)}</Text>
    </View>
  );
}

function AppearanceList({ onPicked }: { onPicked?: () => void }) {
  const { appearanceId, setAppearance } = useAppearance();
  const appearances = useAppearanceOptions();

  return (
    <>
      {appearances.map((item) => {
        const selected = item.id === appearanceId;
        return (
          <Pressable
            key={item.id}
            onPress={() => {
              setAppearance(item.id);
              onPicked?.();
            }}
            style={styles.appearanceRow}>
            <View style={[styles.radio, selected && styles.radioOn]}>
              {selected ? <View style={styles.radioDot} /> : null}
            </View>
            <View style={styles.preview}>
              {item.preview.map((color) => (
                <View
                  key={`${item.id}-${color}`}
                  style={[styles.previewSwatch, { backgroundColor: color }]}
                />
              ))}
            </View>
            <Text style={[styles.appearanceLabel, selected && styles.appearanceLabelOn]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </>
  );
}

/**
 * Collectr-style profile menu: avatar trigger → Appearance submenu + Settings.
 */
export function ProfileMenu({ compact = false }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [anchor, setAnchor] = useState<LayoutRectangle | null>(null);
  const triggerRef = useRef<View>(null);
  const sideBySide = width >= 720;

  const displayName = useMemo(() => {
    if (profile?.username?.trim()) return profile.username.trim();
    if (profile?.email && profile.email !== 'guest@droplinq.local') {
      return profile.email.split('@')[0] || 'Account';
    }
    return 'Guest';
  }, [profile?.email, profile?.username]);

  const handle = useMemo(() => {
    if (profile?.username?.trim()) return `@${profile.username.trim()}`;
    if (profile?.email === 'guest@droplinq.local') return '@guest';
    if (profile?.email) return profile.email;
    return '@droplinq';
  }, [profile?.email, profile?.username]);

  const openMenu = () => {
    triggerRef.current?.measureInWindow((x, y, w, h) => {
      setAnchor({ x, y, width: w, height: h });
      setAppearanceOpen(false);
      setOpen(true);
    });
  };

  const closeMenu = () => {
    setOpen(false);
    setAppearanceOpen(false);
  };

  const goSettings = () => {
    closeMenu();
    router.push('/(tabs)/settings');
  };

  const onSignOut = () => {
    closeMenu();
    void signOut();
  };

  const menuTop = (anchor?.y ?? 0) + (anchor?.height ?? 0) + 8;
  const menuRight = Math.max(12, width - ((anchor?.x ?? width) + (anchor?.width ?? 0)));

  return (
    <>
      <View ref={triggerRef} collapsable={false}>
        <Pressable
          accessibilityLabel="Account menu"
          onPress={openMenu}
          style={[styles.trigger, compact && styles.triggerCompact]}>
          <ProfileAvatar label={displayName} size={compact ? 30 : 34} />
          {!compact ? (
            <Text numberOfLines={1} style={styles.triggerName}>
              {displayName}
            </Text>
          ) : null}
        </Pressable>
      </View>

      <Modal animationType="fade" transparent visible={open} onRequestClose={closeMenu}>
        <View style={styles.modalRoot}>
          <Pressable accessibilityLabel="Close menu" onPress={closeMenu} style={styles.backdrop} />

          <View style={[styles.menu, { right: menuRight, top: menuTop }]}>
            <View style={styles.menuHeader}>
              <ProfileAvatar label={displayName} size={40} />
              <View style={styles.menuHeaderText}>
                <Text numberOfLines={1} style={styles.menuName}>
                  {displayName}
                </Text>
                <Text numberOfLines={1} style={styles.menuHandle}>
                  {handle}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Pressable
              onPress={() => setAppearanceOpen((v) => !v)}
              style={[styles.row, appearanceOpen && styles.rowActive]}>
              <Ionicons color="#D8D5D0" name="color-palette-outline" size={18} />
              <Text style={styles.rowLabel}>Appearance</Text>
              <Ionicons
                color="#A9A6A2"
                name={appearanceOpen && !sideBySide ? 'chevron-down' : 'chevron-forward'}
                size={16}
              />
            </Pressable>

            {appearanceOpen && !sideBySide ? (
              <View style={styles.inlineAppearance}>
                <AppearanceList />
              </View>
            ) : null}

            <Pressable onPress={goSettings} style={styles.row}>
              <Ionicons color="#D8D5D0" name="settings-outline" size={18} />
              <Text style={styles.rowLabel}>Settings</Text>
            </Pressable>

            <Pressable onPress={onSignOut} style={styles.row}>
              <Ionicons color={palette.red} name="log-out-outline" size={18} />
              <Text style={[styles.rowLabel, styles.signOut]}>Sign out</Text>
            </Pressable>
          </View>

          {appearanceOpen && sideBySide ? (
            <View style={[styles.subMenu, { right: menuRight + 256, top: menuTop + 70 }]}>
              <AppearanceList />
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

const glass =
  Platform.OS === 'web'
    ? ({
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
      } as object)
    : null;

const styles = StyleSheet.create({
  trigger: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    maxWidth: 160,
    paddingVertical: 2,
  },
  triggerCompact: {
    maxWidth: 40,
  },
  triggerName: {
    color: palette.white,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '800',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  menu: {
    backgroundColor: 'rgba(22,22,24,0.96)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 248,
    paddingBottom: 6,
    paddingTop: 10,
    position: 'absolute',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    zIndex: 60,
    ...glass,
  },
  menuHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 10,
    paddingHorizontal: 12,
  },
  menuHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  menuName: {
    color: '#F7F5F2',
    fontSize: 14,
    fontWeight: '800',
  },
  menuHandle: {
    color: '#A9A6A2',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  divider: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    height: StyleSheet.hairlineWidth,
    marginBottom: 4,
    marginHorizontal: 10,
  },
  row: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 6,
    paddingHorizontal: 10,
    paddingVertical: 11,
  },
  rowActive: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  rowLabel: {
    color: '#F7F5F2',
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  signOut: {
    color: '#FF4D5A',
  },
  inlineAppearance: {
    marginBottom: 4,
    marginHorizontal: 4,
    paddingLeft: 8,
  },
  subMenu: {
    backgroundColor: 'rgba(22,22,24,0.96)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 230,
    paddingVertical: 6,
    position: 'absolute',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    zIndex: 61,
    ...glass,
  },
  appearanceRow: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  radio: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 999,
    borderWidth: 1.5,
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  radioOn: {
    borderColor: '#3B82F6',
  },
  radioDot: {
    backgroundColor: '#3B82F6',
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  preview: {
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    height: 22,
    overflow: 'hidden',
    width: 36,
  },
  previewSwatch: {
    flex: 1,
    height: '100%',
  },
  appearanceLabel: {
    color: '#F7F5F2',
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  appearanceLabelOn: {
    color: '#FFFFFF',
  },
});
