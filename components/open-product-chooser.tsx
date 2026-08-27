import { Ionicons } from '@expo/vector-icons';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/dropdex';
import { useDropDex } from '@/store/dropdex-context';

/**
 * After “Open product”, let web users pick a new tab or a sized popup.
 */
export function OpenProductChooser() {
  const { pendingOpenProduct, confirmOpenProduct, cancelOpenProduct } = useDropDex();

  if (Platform.OS !== 'web' || !pendingOpenProduct) return null;

  return (
    <Modal animationType="fade" onRequestClose={cancelOpenProduct} transparent visible>
      <Pressable onPress={cancelOpenProduct} style={styles.backdrop}>
        <Pressable style={styles.card}>
          <Text style={styles.kicker}>OPEN PRODUCT</Text>
          <Text numberOfLines={2} style={styles.title}>
            {pendingOpenProduct.title}
          </Text>
          <Text style={styles.copy}>Choose how to open Pokémon Center.</Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => confirmOpenProduct('tab')}
            style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
            <Ionicons color={palette.white} name="open-outline" size={20} />
            <View style={styles.optionCopy}>
              <Text style={styles.optionTitle}>New tab</Text>
              <Text style={styles.optionSub}>Open in a normal browser tab</Text>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => confirmOpenProduct('popup')}
            style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
            <Ionicons color={palette.white} name="browsers-outline" size={20} />
            <View style={styles.optionCopy}>
              <Text style={styles.optionTitle}>Popup</Text>
              <Text style={styles.optionSub}>Open in a smaller floating window</Text>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={cancelOpenProduct}
            style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.62)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#161616',
    borderColor: '#2C2C2C',
    borderRadius: 18,
    borderWidth: 1,
    maxWidth: 420,
    padding: 20,
    width: '100%',
  },
  kicker: {
    color: palette.red,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    color: palette.white,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
    marginBottom: 6,
  },
  copy: {
    color: palette.whiteShadow,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
  },
  option: {
    alignItems: 'center',
    backgroundColor: palette.black,
    borderColor: '#2C2C2C',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  optionCopy: { flex: 1, minWidth: 0 },
  optionTitle: { color: palette.white, fontSize: 15, fontWeight: '800' },
  optionSub: {
    color: palette.whiteShadow,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  cancel: {
    alignItems: 'center',
    marginTop: 4,
    paddingVertical: 12,
  },
  cancelText: {
    color: palette.whiteDim,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: { opacity: 0.85 },
});
