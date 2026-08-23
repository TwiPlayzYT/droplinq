import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/constants/dropdex';
import { useDropDex } from '@/store/dropdex-context';

export function DropAlertModal() {
  const { activeAlert, acknowledgeAlert, openProductBrowser } = useDropDex();

  if (!activeAlert) return null;

  return (
    <Modal animationType="slide" presentationStyle="fullScreen" visible>
      <SafeAreaView style={styles.screen}>
        <View style={styles.radarRing}>
          <View style={styles.radarCore}>
            <Ionicons color={palette.white} name="flash" size={46} />
          </View>
        </View>

        <Text style={styles.kicker}>MATCH FOUND</Text>
        <Text style={styles.title}>DROP{'\n'}DETECTED</Text>

        <View style={styles.productPlate}>
          <Text style={styles.type}>{activeAlert.product.releaseType.toUpperCase()}</Text>
          <Text style={styles.product}>{activeAlert.product.title}</Text>
          <Text style={styles.category}>{activeAlert.product.category}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => {
              const product = activeAlert.product;
              acknowledgeAlert();
              openProductBrowser(product);
            }}
            style={styles.primaryButton}>
            <Text style={styles.primaryText}>OPEN PRODUCT</Text>
            <Ionicons color={palette.black} name="open-outline" size={20} />
          </Pressable>
          <Pressable onPress={acknowledgeAlert} style={styles.ackButton}>
            <View style={styles.ackLight} />
            <Text style={styles.ackText}>ACKNOWLEDGE</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: palette.red,
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  radarRing: {
    alignItems: 'center',
    backgroundColor: palette.redDark,
    borderColor: palette.redLight,
    borderRadius: 72,
    borderWidth: 2,
    height: 144,
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.65,
    shadowRadius: 12,
    width: 144,
  },
  radarCore: {
    alignItems: 'center',
    backgroundColor: palette.black,
    borderColor: palette.white,
    borderRadius: 48,
    borderWidth: 7,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
  kicker: { color: palette.white, fontSize: 13, fontWeight: '900', letterSpacing: 4 },
  title: {
    color: palette.white,
    fontSize: 55,
    fontWeight: '900',
    letterSpacing: -3,
    lineHeight: 50,
    textAlign: 'center',
    textShadowColor: palette.redDark,
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 0,
  },
  productPlate: {
    backgroundColor: palette.black,
    borderColor: palette.blackSoft,
    borderRadius: 24,
    borderWidth: 2,
    padding: 20,
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.65,
    shadowRadius: 8,
    width: '100%',
  },
  type: { color: palette.redLight, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  product: { color: palette.white, fontSize: 20, fontWeight: '900', lineHeight: 25, marginTop: 8 },
  category: { color: palette.whiteShadow, fontSize: 12, fontWeight: '700', marginTop: 8 },
  actions: { gap: 12, width: '100%' },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: palette.white,
    borderColor: palette.whiteDim,
    borderRadius: 18,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 58,
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 5,
  },
  primaryText: { color: palette.black, fontSize: 14, fontWeight: '900', letterSpacing: 1.4 },
  ackButton: {
    alignItems: 'center',
    backgroundColor: palette.black,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 9,
    justifyContent: 'center',
    minHeight: 58,
  },
  ackLight: {
    backgroundColor: palette.redLight,
    borderRadius: 5,
    height: 10,
    shadowColor: palette.redLight,
    shadowOpacity: 1,
    shadowRadius: 6,
    width: 10,
  },
  ackText: { color: palette.white, fontSize: 13, fontWeight: '900', letterSpacing: 1.4 },
});
