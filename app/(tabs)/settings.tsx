import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  BrandHeader,
  ChoiceChip,
  MechanicalToggle,
  MetalButton,
  Panel,
  Screen,
  SectionTitle,
} from '@/components/dropdex-ui';
import {
  NotificationSetupGuide,
  type PreferredDevice,
} from '@/components/notification-setup-guide';
import { PREFERRED_DEVICE_KEY } from '@/constants/preferred-device';
import { palette } from '@/constants/dropdex';
import { coverageModeCopy } from '@/data/pokemon-center-filters';
import { useAuth } from '@/store/auth-context';
import { useDropDex } from '@/store/dropdex-context';

function AlertToggle({
  hint,
  label,
  onChange,
  value,
}: {
  hint: string;
  label: string;
  onChange: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <View>
      <MechanicalToggle label={label} onChange={onChange} value={value} />
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const {
    alerts,
    enableWebPush,
    filters,
    refreshWebPushState,
    triggerTestAlert,
    updateAlertPreferences,
    webPushState,
  } = useDropDex();
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const plan = profile?.subscriptionTier ?? 'FREE';
  const coverage = coverageModeCopy[filters.coverageMode];
  const [device, setDevice] = useState<PreferredDevice>('desktop');
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PREFERRED_DEVICE_KEY)
      .then((saved) => {
        if (saved === 'phone' || saved === 'desktop') {
          setDevice(saved);
          return;
        }
        if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
          setDevice(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'phone' : 'desktop');
        }
      })
      .catch(() => undefined);
  }, []);

  const updateAlert = (key: keyof typeof alerts, value: boolean) => {
    updateAlertPreferences({ ...alerts, [key]: value });
  };

  const persistDevice = (next: PreferredDevice) => {
    setDevice(next);
    void AsyncStorage.setItem(PREFERRED_DEVICE_KEY, next);
  };

  const onEnable = async () => {
    setPushBusy(true);
    await enableWebPush();
    setPushBusy(false);
  };

  return (
    <Screen>
      <BrandHeader eyebrow="Settings" />

      <Panel>
        <SectionTitle title="Account" />
        <Text style={styles.plan}>{plan}</Text>
        <MetalButton
          icon="log-out"
          label={profile?.email === 'guest@droplinq.local' ? 'Exit guest' : 'Sign out'}
          onPress={() => void signOut()}
        />
      </Panel>

      <Panel>
        <SectionTitle title="Product coverage" />
        <Text style={styles.coverageTitle}>
          {coverage.emoji} {coverage.title}
        </Text>
        <Text style={styles.coverageCopy}>{coverage.description}</Text>
        <MetalButton
          icon="options-outline"
          label="Edit in Filter"
          onPress={() => router.push('/(tabs)/filter')}
        />
      </Panel>

      {Platform.OS === 'web' ? (
        <Panel tone="dark">
          <SectionTitle light title="Lock-screen alerts" />
          <Text style={styles.devicePrompt}>I’m mainly using DropLinq on</Text>
          <View style={styles.deviceRow}>
            <ChoiceChip
              label="Mobile"
              onPress={() => persistDevice('phone')}
              selected={device === 'phone'}
            />
            <ChoiceChip
              label="Desktop"
              onPress={() => persistDevice('desktop')}
              selected={device === 'desktop'}
            />
          </View>
          <NotificationSetupGuide
            device={device}
            dense
            enableBusy={pushBusy}
            light
            onEnable={() => void onEnable()}
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
        </Panel>
      ) : null}

      <Panel>
        <SectionTitle title="Alerts" />
        <AlertToggle
          hint="System notifications when a drop hits (needs Lock-screen alerts enabled above on web)."
          label="Push"
          onChange={(value) => updateAlert('push', value)}
          value={alerts.push}
        />
        <View style={styles.rule} />
        <AlertToggle
          hint="Play an alert tone when a drop is detected."
          label="Sound"
          onChange={(value) => updateAlert('sound', value)}
          value={alerts.sound}
        />
        <View style={styles.rule} />
        <AlertToggle
          hint="Vibrate on phones that support it (no effect on most desktops)."
          label="Vibration"
          onChange={(value) => updateAlert('vibration', value)}
          value={alerts.vibration}
        />
        <View style={styles.rule} />
        <AlertToggle
          hint="Speak the product name aloud when a drop hits."
          label="Speech"
          onChange={(value) => updateAlert('speech', value)}
          value={alerts.speech}
        />
        <View style={styles.rule} />
        <AlertToggle
          hint="Show the full-screen red drop overlay. Off still plays sound/speech; Test uses a smaller centered popup."
          label="Full-screen"
          onChange={(value) => updateAlert('fullScreen', value)}
          value={alerts.fullScreen}
        />
        <View style={styles.rule} />
        <AlertToggle
          hint="Max alerts: always show overlay and force sound, speech, and vibration together."
          label="Drop Mode"
          onChange={(value) => updateAlert('dropMode', value)}
          value={alerts.dropMode ?? false}
        />
        <MetalButton icon="flash" label="Test alert" onPress={triggerTestAlert} />
      </Panel>

      <Panel>
        <SectionTitle title="Legal" />
        <MetalButton
          icon="document-text-outline"
          label="Terms of Service"
          onPress={() => router.push('/legal/terms')}
        />
        <View style={{ height: 10 }} />
        <MetalButton
          icon="shield-checkmark-outline"
          label="Privacy Policy"
          onPress={() => router.push('/legal/privacy')}
        />
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  rule: { backgroundColor: palette.whiteDim, height: 1, marginVertical: 12 },
  hint: {
    color: palette.blackSoft,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    marginTop: 6,
  },
  plan: {
    color: palette.redDark,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  coverageTitle: {
    color: palette.black,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 21,
    marginBottom: 8,
  },
  coverageCopy: {
    color: palette.blackSoft,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginBottom: 14,
  },
  devicePrompt: {
    color: palette.whiteDim,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  deviceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
});
