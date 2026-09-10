import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandHeader, Screen } from '@/components/dropdex-ui';
import { palette } from '@/constants/dropdex';
import { useDropDex } from '@/store/dropdex-context';

export default function AlertHistoryScreen() {
  const router = useRouter();
  const { alertHistory, openProductBrowser, toggleProductMute, isProductMuted } = useDropDex();

  return (
    <Screen>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Ionicons color={palette.white} name="chevron-back" size={22} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>
      <BrandHeader eyebrow="Alert history" />
      <Text style={styles.lead}>Recent drop pings on this device. Mute a SKU to stop future noise.</Text>

      {alertHistory.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No alerts yet</Text>
          <Text style={styles.emptyBody}>
            When monitoring catches a matching product, it shows up here.
          </Text>
        </View>
      ) : (
        alertHistory.map((item) => {
          const muted = isProductMuted(item.product.id);
          return (
            <View key={item.id} style={styles.row}>
              <Pressable onPress={() => openProductBrowser(item.product)} style={styles.rowMain}>
                <Text numberOfLines={2} style={styles.title}>
                  {item.product.title}
                </Text>
                <Text style={styles.meta}>
                  {item.product.releaseType.toUpperCase()} ·{' '}
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
              </Pressable>
              <Pressable
                accessibilityLabel={muted ? 'Unmute product' : 'Mute product'}
                onPress={() => toggleProductMute(item.product.id)}
                style={[styles.muteBtn, muted && styles.muteBtnOn]}>
                <Ionicons
                  color={muted ? '#fff' : palette.cardMuted}
                  name={muted ? 'notifications-off' : 'notifications-off-outline'}
                  size={18}
                />
              </Pressable>
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { marginBottom: 4 },
  back: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 2,
  },
  backText: {
    color: palette.whiteDim,
    fontSize: 14,
    fontWeight: '700',
  },
  lead: {
    color: palette.cardMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 18,
  },
  empty: {
    backgroundColor: palette.card,
    borderColor: palette.cardBorder,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    padding: 18,
  },
  emptyTitle: {
    color: palette.cardInk,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyBody: {
    color: palette.cardMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  row: {
    alignItems: 'center',
    backgroundColor: palette.card,
    borderColor: palette.cardBorder,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    padding: 12,
  },
  rowMain: { flex: 1, gap: 4, minWidth: 0 },
  title: {
    color: palette.cardInk,
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    color: palette.cardMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  muteBtn: {
    alignItems: 'center',
    backgroundColor: palette.control,
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  muteBtnOn: { backgroundColor: palette.red },
});
