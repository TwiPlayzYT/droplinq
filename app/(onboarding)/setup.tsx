import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BrandHeader, ChoiceChip, MetalButton, Panel, Screen } from '@/components/dropdex-ui';
import { ConsentCheckbox } from '@/components/consent-checkbox';
import {
  PRO_ANNUAL_MONTHLY_CAD,
  PRO_MONTHLY_CAD,
  formatCad,
  trialCopy,
} from '@/constants/billing';
import { palette } from '@/constants/dropdex';
import { coverageModeCopy } from '@/data/pokemon-center-filters';
import { regions } from '@/data/regions';
import { getExpoPushToken } from '@/services/notification-service';
import { syncPushToken } from '@/services/notifications/push-token';
import { tierCopy } from '@/services/subscriptions/tiers';
import { useAuth } from '@/store/auth-context';
import { useDropDex } from '@/store/dropdex-context';
import { CoverageMode, RegionId } from '@/types/dropdex';

const steps = ['Age', 'Region', 'TCG', 'Coverage', 'Pro'] as const;
const coverageModes: CoverageMode[] = ['POPULAR', 'ALL_TCG', 'CUSTOM'];

export default function OnboardingScreen() {
  const { completeOnboarding, profile, session } = useAuth();
  const { updateFilters, setRegion, filters, setMonitoring } = useDropDex();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [regionId, setRegionId] = useState<RegionId>('ca');
  const [coverageMode, setCoverageMode] = useState<CoverageMode>(
    filters.coverageMode ?? 'ALL_TCG',
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = async () => {
    setBusy(true);
    setRegion(regionId);
    setMonitoring(true);
    updateFilters({
      ...filters,
      coverageMode,
      customCategoryIds: coverageMode === 'CUSTOM' ? filters.customCategoryIds : [],
    });
    const result = await completeOnboarding({
      dateOfBirth: null,
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
    router.replace('/home' as never);
  };

  const next = async () => {
    if (step === 0 && !ageConfirmed) {
      setError('Confirm you are old enough to use DropLinq.');
      return;
    }
    setError(null);
    if (step < steps.length - 1) {
      setStep((value) => value + 1);
      return;
    }
    await finish();
  };

  return (
    <Screen>
      <BrandHeader eyebrow={`Setup ${step + 1} / ${steps.length}`} />
      <Panel tone="dark">
        <Text style={styles.kicker}>{steps[step].toUpperCase()}</Text>
        {step === 0 ? (
          <>
            <Text style={styles.copy}>
              DropLinq is not for children under 13 (or the higher digital-consent age in your
              region). We do not collect your date of birth.
            </Text>
            <ConsentCheckbox
              checked={ageConfirmed}
              label="Confirm minimum age"
              onChange={(value) => {
                setAgeConfirmed(value);
                if (value) setError(null);
              }}>
              I confirm I am at least 13, or the minimum age required in my region.
            </ConsentCheckbox>
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
          <>
            <Text style={styles.proHeadline}>{trialCopy.headline}</Text>
            <Text style={styles.copy}>{trialCopy.body}</Text>
            <Text style={styles.proPrice}>
              After that: {formatCad(PRO_MONTHLY_CAD)}/mo · or {formatCad(PRO_ANNUAL_MONTHLY_CAD)}
              /mo billed yearly
            </Text>
            <Text style={styles.proSub}>Pro keeps monitoring going:</Text>
            {tierCopy.PRO.features.map((feature) => (
              <Text key={feature} style={styles.featureLine}>
                · {feature}
              </Text>
            ))}
            <Text style={styles.copy}>
              You can upgrade anytime from Settings. Cancel whenever you want.
            </Text>
          </>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <MetalButton
          icon="arrow-forward"
          label={busy ? 'Saving…' : step === steps.length - 1 ? 'Enter DropLinq' : 'Continue'}
          onPress={() => void next()}
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
  proHeadline: {
    color: palette.white,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    marginBottom: 10,
  },
  proPrice: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  proSub: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  featureLine: {
    color: palette.whiteDim,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 4,
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
