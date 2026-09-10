import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/dropdex';

/** Decorative phone frames for the marketing hero — not live screenshots. */
export function MarketingPhoneStack() {
  return (
    <View style={styles.stage}>
      <View style={[styles.phone, styles.phoneBack]}>
        <Text style={styles.phoneEyebrow}>STOCK</Text>
        <View style={styles.chipRow}>
          {['All', 'In stock', 'New'].map((label) => (
            <View key={label} style={styles.chip}>
              <Text style={styles.chipText}>{label}</Text>
            </View>
          ))}
        </View>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.card}>
            <View style={styles.thumb} />
            <View style={{ flex: 1, gap: 6 }}>
              <View style={[styles.line, { width: i === 1 ? '70%' : '88%' }]} />
              <View style={[styles.line, styles.lineMuted, { width: '42%' }]} />
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.phone, styles.phoneFront]}>
        <Text style={styles.phoneEyebrow}>HOME</Text>
        <Text style={styles.powerLabel}>ALERTS</Text>
        <View style={styles.power}>
          <Text style={styles.powerText}>ON</Text>
        </View>
        <Text style={styles.live}>Live · Pokémon Center CA</Text>
        <View style={styles.watchCard}>
          <Text style={styles.watchTitle}>Watchlist</Text>
          <Text style={styles.watchItem}>Elite Trainer Box</Text>
          <Text style={styles.watchItem}>Booster Bundle</Text>
        </View>
      </View>

      <View style={styles.float}>
        <Text style={styles.floatTitle}>Drop detected</Text>
        <Text style={styles.floatBody}>ETB · Restock · 12s ago</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    height: 420,
    position: 'relative',
    width: '100%',
    maxWidth: 420,
  },
  phone: {
    backgroundColor: '#121212',
    borderColor: '#2A2A2A',
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
    position: 'absolute',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 24,
  },
  phoneBack: {
    height: 360,
    left: 0,
    top: 36,
    transform: [{ rotate: '-6deg' }],
    width: 210,
  },
  phoneFront: {
    height: 380,
    right: 8,
    top: 0,
    transform: [{ rotate: '4deg' }],
    width: 230,
  },
  phoneEyebrow: {
    color: palette.red,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: '#1E1E1E',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    color: palette.whiteDim,
    fontSize: 10,
    fontWeight: '700',
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
    padding: 8,
  },
  thumb: {
    backgroundColor: palette.redDark,
    borderRadius: 8,
    height: 36,
    width: 36,
  },
  line: {
    backgroundColor: '#3A3A3A',
    borderRadius: 4,
    height: 8,
  },
  lineMuted: {
    backgroundColor: '#2A2A2A',
  },
  powerLabel: {
    color: palette.whiteShadow,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  power: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: palette.red,
    borderRadius: 999,
    height: 96,
    justifyContent: 'center',
    marginVertical: 14,
    width: 96,
  },
  powerText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  live: {
    color: palette.whiteDim,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 14,
    textAlign: 'center',
  },
  watchCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    gap: 6,
    padding: 12,
  },
  watchTitle: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  watchItem: {
    color: palette.whiteShadow,
    fontSize: 12,
    fontWeight: '600',
  },
  float: {
    backgroundColor: '#161616',
    borderColor: palette.red,
    borderRadius: 14,
    borderWidth: 1,
    bottom: 18,
    left: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: 'absolute',
    zIndex: 3,
  },
  floatTitle: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '800',
  },
  floatBody: {
    color: palette.redLight,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});
