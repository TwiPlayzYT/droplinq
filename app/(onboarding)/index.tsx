import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { BrandHeader, ChoiceChip, MetalButton, Panel, Screen } from '@/components/dropdex-ui';
import {
  NotificationSetupGuide,
  type PreferredDevice,
} from '@/components/notification-setup-guide';
import { PREFERRED_DEVICE_KEY } from '@/constants/preferred-device';
import { palette } from '@/constants/dropdex';
import { coverageModeCopy } from '@/data/pokemon-center-filters';
import { regions } from '@/data/regions';
import { getExpoPushToken } from '@/services/notification-service';
import { syncPushToken } from '@/services/notifications/push-token';
import { useAuth } from '@/store/auth-context';
import { useDropDex } from '@/store/dropdex-context';
import { CoverageMode, RegionId } from '@/types/dropdex';

const steps = ['Birthday', 'Region', 'TCG', 'Coverage', 'Device', 'Alerts'] as const;
const coverageModes: CoverageMode[] = ['POPULAR', 'ALL_TCG', 'CUSTOM'];

function guessDevice(): PreferredDevice {
  if (Platform.OS === 'ios' || Platform.OS === 'android') return 'phone';
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    if (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) return 'phone';
  }
  return 'desktop';
}

export default function OnboardingScreen() {
  const { completeOnboarding, profile, session } = useAuth();
  const {
    updateFilters,
    setRegion,
    filters,
    enableWebPush,
    webPushState,
    refreshWebPushState,
    setMonitoring,
  } = useDropDex();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dob, setDob] = useState('');
  const [regionId, setRegionId] = useState<RegionId>('ca');
  const [coverageMode, setCoverageMode] = useState<CoverageMode>(
    filters.coverageMode ?? 'ALL_TCG',
  );
  const [device, setDevice] = useState<PreferredDevice>(guessDevice);
  const [busy, setBusy] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushNote, setPushNote] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(PREFERRED_DEVICE_KEY)
      .then((saved) => {
        if (saved === 'phone' || saved === 'desktop') setDevice(saved);
      })
      .catch(() => undefined);
  }, []);

  const persistDevice = async (next: PreferredDevice) => {
    setDevice(next);
    await AsyncStorage.setItem(PREFERRED_DEVICE_KEY, next).catch(() => undefined);
  };

  const finish = async () => {
    setBusy(true);
    setRegion(regionId);
    setMonitoring(true);
    updateFilters({
      ...filters,
      coverageMode,
      customCategoryIds: coverageMode === 'CUSTOM' ? filters.customCategoryIds : [],
    });
    await AsyncStorage.setItem(PREFERRED_DEVICE_KEY, device).catch(() => undefined);
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

  const next = async () => {
    if (step === 0 && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      setError('Use YYYY-MM-DD for date of birth.');
      return;
    }
    if (step === 4 && !device) {
      setError('Pick phone or desktop so we can show the right alert setup.');
      return;
    }
    setError(null);
    if (step < steps.length - 1) {
      setStep((value) => value + 1);
      return;
    }
    await finish();
  };

  const onEnableAlerts = async () => {
    setPushBusy(true);
    setPushNote(null);
    const ok = await enableWebPush();
    if (ok) {
      setPushNote('Alerts enabled. You can finish setup and enter DropLinq.');
    } else {
      setPushNote(
        'Couldn’t enable yet — finish the steps above, then try again. You can also do this later in Settings.',
      );
    }
    setPushBusy(false);
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
          <>
            <Text style={styles.copy}>
              Where do you want drop alerts most? We’ll show the right notification setup next.
            </Text>
            <View style={styles.deviceRow}>
              <ChoiceChip
                label="Phone"
                onPress={() => void persistDevice('phone')}
                selected={device === 'phone'}
              />
              <ChoiceChip
                label="Desktop / laptop"
                onPress={() => void persistDevice('desktop')}
                selected={device === 'desktop'}
              />
            </View>
            <Text style={styles.copy}>
              {device === 'phone'
                ? 'Best for catching restocks wherever you are. On iPhone you’ll add DropLinq to your Home Screen.'
                : 'Best if you leave your browser open during drops. You can still set up phone alerts later in Settings.'}
            </Text>
          </>
        ) : null}
        {step === 5 ? (
          <>
            {Platform.OS === 'web' ? (
              <>
                <NotificationSetupGuide
                  device={device}
                  dense
                  enableBusy={pushBusy}
                  light
                  onEnable={() => void onEnableAlerts()}
                  showEnable={webPushState === 'ready'}
                  webPushState={webPushState}
                />
                {webPushState === 'install-required' ? (
                  <MetalButton
                    icon="refresh"
                    label="I’ve added it — check again"
                    onPress={() => void refreshWebPushState()}
                  />
                ) : null}
              </>
            ) : (
              <Text style={styles.copy}>
                Next, your phone may ask for notification permission. DropLinq cannot bypass Focus,
                mute, or system notification settings.
              </Text>
            )}
            {pushNote ? <Text style={styles.note}>{pushNote}</Text> : null}
            <Text style={styles.skipHint}>
              You can skip enabling for now and turn alerts on anytime in Settings → Lock-screen
              alerts.
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  deviceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
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
  note: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 10,
  },
  skipHint: {
    color: palette.whiteShadow,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    marginBottom: 12,
  },
  error: {
    color: palette.redLight,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
});
