import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/constants/dropdex';
import { useDropDex } from '@/store/dropdex-context';

export function DropAlertModal() {
  const { activeAlert, acknowledgeAlert, alerts, openProductBrowser } = useDropDex();

  if (!activeAlert) return null;

  const immersive = Boolean(alerts.fullScreen || alerts.dropMode);

  const body = (
    <>
      <View style={[styles.radarRing, !immersive && styles.radarRingCompact]}>
        <View style={[styles.radarCore, !immersive && styles.radarCoreCompact]}>
          <Ionicons color={palette.white} name="flash" size={immersive ? 46 : 34} />
        </View>
      </View>

      <Text style={styles.kicker}>MATCH FOUND</Text>
      <Text style={[styles.title, !immersive && styles.titleCompact]}>
        DROP{'\n'}DETECTED
      </Text>

      <View style={styles.productPlate}>
        <Text style={styles.type}>{activeAlert.product.releaseType.toUpperCase()}</Text>
        <Text style={styles.product}>{activeAlert.product.title}</Text>
        <Text style={styles.category}>{activeAlert.product.category}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          unstable_pressDelay={0}
          onPress={() => {
            const product = activeAlert.product;
            acknowledgeAlert();
            openProductBrowser(product);
          }}
          style={styles.primaryButton}>
          <Text style={styles.primaryText}>OPEN PRODUCT</Text>
          <Ionicons color={palette.black} name="open-outline" size={20} />
        </Pressable>
        <Pressable
          unstable_pressDelay={0}
          onPress={acknowledgeAlert}
          style={styles.ackButton}>
          <View style={styles.ackLight} />
          <Text style={styles.ackText}>ACKNOWLEDGE</Text>
        </Pressable>
      </View>
    </>
  );

  if (immersive) {
    return (
      <Modal animationType="slide" presentationStyle="fullScreen" visible>
        <SafeAreaView style={styles.screen}>{body}</SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal animationType="fade" transparent visible>
      <View style={styles.scrim}>
        <SafeAreaView style={styles.card}>{body}</SafeAreaView>
      </View>
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
  scrim: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    alignItems: 'center',
    backgroundColor: palette.red,
    borderRadius: 24,
    gap: 16,
    justifyContent: 'center',
    maxWidth: 440,
    padding: 22,
    width: '100%',
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
  radarRingCompact: {
    height: 96,
    marginTop: 0,
    width: 96,
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
  radarCoreCompact: {
    borderRadius: 32,
    borderWidth: 5,
    height: 64,
    width: 64,
  },
  kicker: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 10,
  },
  title: {
    color: palette.white,
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 0.5,
    lineHeight: 54,
    textAlign: 'center',
    textShadowColor: palette.redDark,
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 0,
  },
  titleCompact: {
    fontSize: 34,
    lineHeight: 38,
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
  product: { color: palette.white, fontSize: 20, fontWeight: '900', lineHeight: 26, marginTop: 10 },
  category: { color: palette.whiteShadow, fontSize: 12, fontWeight: '700', lineHeight: 17, marginTop: 10 },
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
