import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  BrandHeader,
  ChoiceChip,
  MechanicalToggle,
  Panel,
  Screen,
  SectionTitle,
} from '@/components/dropdex-ui';
import { palette, previewSamples } from '@/constants/dropdex';
import {
  coverageModeCopy,
  pokemonCenterFilterGroups,
} from '@/data/pokemon-center-filters';
import { matchesFilters } from '@/lib/filter-matcher';
import { useDropDex } from '@/store/dropdex-context';
import { CoverageMode } from '@/types/filters';

const modes: CoverageMode[] = ['POPULAR', 'ALL_TCG', 'CUSTOM'];

export default function FilterScreen() {
  const { filters, updateFilters } = useDropDex();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    POPULAR: true,
  });

  const previewCount = useMemo(
    () => previewSamples.filter((product) => matchesFilters(product, filters)).length,
    [filters],
  );

  const setMode = (coverageMode: CoverageMode) => {
    updateFilters({ ...filters, coverageMode });
  };

  const toggleCategory = (categoryId: string) => {
    const selected = filters.customCategoryIds.includes(categoryId);
    updateFilters({
      ...filters,
      coverageMode: 'CUSTOM',
      customCategoryIds: selected
        ? filters.customCategoryIds.filter((id) => id !== categoryId)
        : [...filters.customCategoryIds, categoryId],
    });
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <Screen>
      <BrandHeader eyebrow="Product coverage" />

      <Panel tone="dark">
        <Text style={styles.retailer}>POKÉMON CENTER · POKÉMON TCG</Text>
        <Text style={styles.lead}>
          Choose what DropLinq should alert you about. Casual users can stay on All TCG.
        </Text>
      </Panel>

      <Panel>
        <SectionTitle title="Coverage" />
        <View style={styles.modeList}>
          {modes.map((mode) => {
            const copy = coverageModeCopy[mode];
            const selected = filters.coverageMode === mode;
            return (
              <Pressable
      unstable_pressDelay={0}
                key={mode}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setMode(mode)}
                style={({ pressed }) => [
                  styles.modeCard,
                  selected && styles.modeCardSelected,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.modeEmoji}>{copy.emoji}</Text>
                <View style={styles.modeCopy}>
                  <Text style={[styles.modeTitle, selected && styles.modeTitleSelected]}>
                    {copy.title}
                  </Text>
                  <Text style={styles.modeDescription}>{copy.description}</Text>
                </View>
                <View style={[styles.radio, selected && styles.radioOn]} />
              </Pressable>
            );
          })}
        </View>
      </Panel>

      {filters.coverageMode === 'CUSTOM' ? (
        <Panel>
          <SectionTitle title="Custom categories" />
          <Text style={styles.hint}>Expand a group, then pick product types.</Text>
          {pokemonCenterFilterGroups.map((group) => {
            const open = !!expandedGroups[group.key];
            const selectedCount = group.categories.filter((category) =>
              filters.customCategoryIds.includes(category.id),
            ).length;
            return (
              <View key={group.id} style={styles.groupBlock}>
                <Pressable
      unstable_pressDelay={0}
                  onPress={() => toggleGroup(group.key)}
                  style={styles.groupHeader}>
                  <View>
                    <Text style={styles.groupTitle}>{group.title}</Text>
                    <Text style={styles.groupMeta}>
                      {selectedCount}/{group.categories.length} selected
                    </Text>
                  </View>
                  <Ionicons
                    color={palette.black}
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={18}
                  />
                </Pressable>
                {open ? (
                  <View style={styles.chips}>
                    {group.categories.map((category) => (
                      <ChoiceChip
                        key={category.id}
                        label={category.name}
                        onPress={() => toggleCategory(category.id)}
                        selected={filters.customCategoryIds.includes(category.id)}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
          <View style={styles.rule} />
          <MechanicalToggle
            label="Include other Pokémon Center TCG products"
            onChange={(includeOtherTcgProducts) =>
              updateFilters({ ...filters, includeOtherTcgProducts })
            }
            value={filters.includeOtherTcgProducts}
          />
        </Panel>
      ) : null}

      <Panel>
        <SectionTitle title="Stock events" />
        <MechanicalToggle
          label="New releases"
          onChange={(includeNewReleases) => updateFilters({ ...filters, includeNewReleases })}
          value={filters.includeNewReleases}
        />
        <View style={styles.rule} />
        <MechanicalToggle
          label="Restocks"
          onChange={(includeRestocks) => updateFilters({ ...filters, includeRestocks })}
          value={filters.includeRestocks}
        />
        <View style={styles.rule} />
        <MechanicalToggle
          label="Preorders"
          onChange={(includePreorders) => updateFilters({ ...filters, includePreorders })}
          value={filters.includePreorders}
        />
      </Panel>

      <Panel tone="dark">
        <Text style={styles.previewLabel}>PREVIEW</Text>
        <Text style={styles.previewValue}>
          {previewCount} of {previewSamples.length} sample TCG products match this coverage
        </Text>
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  retailer: {
    color: palette.red,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  lead: {
    color: palette.whiteDim,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  modeList: { gap: 10 },
  modeCard: {
    alignItems: 'center',
    backgroundColor: palette.white,
    borderColor: palette.whiteDim,
    borderRadius: 14,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  modeCardSelected: {
    borderColor: palette.red,
    backgroundColor: '#FFF5F5',
  },
  modeEmoji: { fontSize: 22 },
  modeCopy: { flex: 1 },
  modeTitle: {
    color: palette.black,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  modeTitleSelected: { color: palette.redDark },
  modeDescription: {
    color: palette.blackSoft,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 6,
  },
  radio: {
    borderColor: palette.whiteShadow,
    borderRadius: 999,
    borderWidth: 2,
    height: 18,
    width: 18,
  },
  radioOn: {
    backgroundColor: palette.red,
    borderColor: palette.redDark,
  },
  pressed: { opacity: 0.88 },
  hint: {
    color: palette.blackSoft,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  groupBlock: { marginBottom: 14 },
  groupHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  groupTitle: {
    color: palette.black,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  groupMeta: {
    color: palette.whiteShadow,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: 4,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rule: { backgroundColor: palette.whiteDim, height: 1, marginVertical: 12 },
  previewLabel: {
    color: palette.red,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  previewValue: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
