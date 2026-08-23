import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { BrandHeader, ChoiceChip, MetalButton, Panel, Screen } from '@/components/dropdex-ui';
import { palette } from '@/constants/dropdex';
import { coverageModeCopy } from '@/data/pokemon-center-filters';
import { regions } from '@/data/regions';
import { useAuth } from '@/store/auth-context';
import { useDropDex } from '@/store/dropdex-context';
import { CoverageMode, RegionId } from '@/types/dropdex';
import { getExpoPushToken } from '@/services/notification-service';
import { syncPushToken } from '@/services/notifications/push-token';

const steps = ['Birthday', 'Region', 'TCG', 'Coverage', 'Alerts'] as const;
const coverageModes: CoverageMode[] = ['POPULAR', 'ALL_TCG', 'CUSTOM'];

export default function OnboardingScreen() {
  const { completeOnboarding, profile, session } = useAuth();
  const { updateFilters, setRegion, filters } = useDropDex();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dob, setDob] = useState('');
  const [regionId, setRegionId] = useState<RegionId>('ca');
  const [coverageMode, setCoverageMode] = useState<CoverageMode>(
    filters.coverageMode ?? 'ALL_TCG',
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = async () => {
    if (step === 0 && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      setError('Use YYYY-MM-DD for date of birth.');
      return;
    }
    setError(null);
    if (step < steps.length - 1) {
      setStep((value) => value + 1);
      return;
    }

    setBusy(true);
    setRegion(regionId);
    updateFilters({
      ...filters,
      coverageMode,
      customCategoryIds: coverageMode === 'CUSTOM' ? filters.customCategoryIds : [],
    });
    const result = await completeOnboarding({
      dateOfBirth: dob,
      regionId,
      username: profile?.username ?? undefined,
    });
    await getExpoPushToken();
    if (session?.user.id) await syncPushToken(session.user.id);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <Screen>
      <BrandHeader eyebrow={`Setup ${step + 1} / ${steps.length}`} />
      <Panel tone="dark">
        <Text style={styles.kicker}>{steps[step].toUpperCase()}</Text>
        {step === 0 ? (
          <>
            <Text style={styles.copy}>Date of birth (YYYY-MM-DD)</Text>
            <TextInput
              onChangeText={setDob}
              placeholder="2000-01-15"
              placeholderTextColor={palette.whiteShadow}
              style={styles.input}
              value={dob}
            />
          </>
        ) : null}
        {step === 1 ? (
          <View style={styles.chips}>
            {regions.map((region) => (
              <ChoiceChip
                key={region.id}
                label={region.label}
                onPress={() => setRegionId(region.id)}
                selected={regionId === region.id}
              />
            ))}
          </View>
        ) : null}
        {step === 2 ? (
          <Text style={styles.copy}>
            Pokémon is the first live TCG. One Piece, Yu-Gi-Oh!, and Magic are listed for later
            expansion and stay inactive.
          </Text>
        ) : null}
        {step === 3 ? (
          <>
            <Text style={styles.copy}>
              Pokémon Center first. Most people should pick All Pokémon Center TCG.
            </Text>
            <View style={styles.chips}>
              {coverageModes.map((mode) => (
                <ChoiceChip
                  key={mode}
                  label={coverageModeCopy[mode].title}
                  onPress={() => setCoverageMode(mode)}
                  selected={coverageMode === mode}
                />
              ))}
            </View>
            <Text style={styles.copy}>{coverageModeCopy[coverageMode].description}</Text>
          </>
        ) : null}
        {step === 4 ? (
          <Text style={styles.copy}>
            Next, iOS may ask for notification permission. DropLinq cannot bypass Focus, mute, or
            system notification settings.
          </Text>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <MetalButton
          icon="arrow-forward"
          label={busy ? 'Saving…' : step === steps.length - 1 ? 'Enter DropLinq' : 'Continue'}
          onPress={next}
        />
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: {
    color: palette.red,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.6,
    marginBottom: 12,
  },
  copy: {
    color: palette.whiteDim,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 14,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  input: {
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 12,
    borderWidth: 1,
    color: palette.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  error: {
    color: palette.redLight,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
});
