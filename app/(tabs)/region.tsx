import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandHeader, Panel, Screen } from '@/components/dropdex-ui';
import { palette } from '@/constants/dropdex';
import { getRegion, RegionConfig, regions } from '@/data/regions';
import { useWebLayout } from '@/hooks/use-web-layout';
import { useDropDex } from '@/store/dropdex-context';

function RegionRow({
  config,
  onSelect,
  selected,
}: {
  config: RegionConfig;
  onSelect: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      unstable_pressDelay={0}
      accessibilityHint={`Switches all listings to ${config.storefront}`}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onSelect}
      style={({ pressed }) => [styles.rowShadow, pressed && styles.rowPressed]}>
      <View style={[styles.row, selected && styles.rowSelected]}>
        <View style={[styles.codeBadge, selected && styles.codeBadgeSelected]}>
          <Text style={[styles.codeText, selected && styles.codeTextSelected]}>
            {config.code}
          </Text>
        </View>
        <View style={styles.rowCopy}>
          <Text style={[styles.rowLabel, selected && styles.rowLabelSelected]}>
            {config.label}
          </Text>
          <Text style={styles.rowDomain}>{config.domain}</Text>
          <Text style={styles.rowWindow}>{config.dropWindow.toUpperCase()}</Text>
        </View>
        <View style={[styles.lampWell, selected && styles.lampWellOn]}>
          <View style={[styles.lamp, selected && styles.lampOn]} />
        </View>
      </View>
    </Pressable>
  );
}

export default function RegionScreen() {
  const { region, setRegion } = useDropDex();
  const { isDesktopWeb, contentColumns } = useWebLayout();
  const active = getRegion(region);

  return (
    <Screen>
      <BrandHeader eyebrow="Regional storefront" />

      <View style={styles.statusRow}>
        <View style={styles.statusLamp} />
        <Text style={styles.statusText}>
          TRACKING {active.storefront.toUpperCase()}
        </Text>
      </View>

      <Panel tone="dark">
        <View style={styles.headingRow}>
          <Ionicons color={palette.red} name="globe-outline" size={20} />
          <Text style={styles.headingText}>SELECT REGION</Text>
        </View>

        <View style={[styles.rows, isDesktopWeb && styles.regionGrid]}>
          {regions.map((config) => (
            <View
              key={config.id}
              style={
                isDesktopWeb
                  ? [styles.regionGridItem, contentColumns >= 3 ? styles.regionCol3 : styles.regionCol2]
                  : undefined
              }>
              <RegionRow
                config={config}
                onSelect={() => setRegion(config.id)}
                selected={config.id === region}
              />
            </View>
          ))}
        </View>
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusLamp: {
    backgroundColor: palette.red,
    borderRadius: 5,
    height: 10,
    shadowColor: palette.red,
    shadowOpacity: 1,
    shadowRadius: 6,
    width: 10,
  },
  statusText: {
    color: palette.whiteShadow,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  headingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  headingText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  headingCaption: {
    color: palette.whiteShadow,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 14,
    marginTop: 6,
  },
  rows: { gap: 12 },
  regionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  regionGridItem: {},
  regionCol2: {
    maxWidth: '48%',
    width: '48%',
  },
  regionCol3: {
    maxWidth: '32%',
    width: '31.5%',
  },
  rowShadow: {
    backgroundColor: palette.black,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  rowPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  row: {
    alignItems: 'center',
    backgroundColor: palette.black,
    borderColor: palette.blackSoft,
    borderRadius: 18,
    borderTopColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  rowSelected: {
    borderColor: palette.redDark,
    shadowColor: palette.red,
    shadowOpacity: 0.7,
    shadowRadius: 12,
  },
  codeBadge: {
    alignItems: 'center',
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 12,
    borderWidth: 2,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  codeBadgeSelected: { backgroundColor: palette.red, borderColor: palette.redLight },
  codeText: {
    color: palette.whiteShadow,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  codeTextSelected: { color: palette.white },
  rowCopy: { flex: 1 },
  rowLabel: { color: palette.whiteDim, fontSize: 15, fontWeight: '900', lineHeight: 20 },
  rowLabelSelected: { color: palette.white },
  rowDomain: { color: palette.whiteShadow, fontSize: 11, lineHeight: 16, marginTop: 5 },
  rowWindow: {
    color: palette.whiteShadow,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 6,
  },
  lampWell: {
    alignItems: 'center',
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  lampWellOn: { borderColor: palette.redDark },
  lamp: {
    backgroundColor: palette.blackSoft,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  lampOn: {
    backgroundColor: palette.red,
    shadowColor: palette.red,
    shadowOpacity: 1,
    shadowRadius: 6,
  },
});
