import {
  BrandHeader,
  MechanicalToggle,
  MetalButton,
  Panel,
  Screen,
  SectionTitle,
} from '@/components/dropdex-ui';
import { palette } from '@/constants/dropdex';
import { coverageModeCopy } from '@/data/pokemon-center-filters';
import { useAuth } from '@/store/auth-context';
import { useDropDex } from '@/store/dropdex-context';
import { useRouter } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';

export default function SettingsScreen() {
  const {
    alerts,
    enableWebPush,
    filters,
    triggerTestAlert,
    updateAlertPreferences,
    webPushState,
  } = useDropDex();
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const plan = profile?.subscriptionTier ?? 'FREE';
  const coverage = coverageModeCopy[filters.coverageMode];

  const updateAlert = (key: keyof typeof alerts, value: boolean) => {
    updateAlertPreferences({ ...alerts, [key]: value });
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

      {Platform.OS === 'web' && webPushState === 'ready' ? (
        <Panel tone="dark">
          <SectionTitle light title="Lock-screen alerts" />
          <MetalButton
            icon="notifications"
            label="Enable lock-screen alerts"
            onPress={enableWebPush}
          />
        </Panel>
      ) : null}

      <Panel>
        <SectionTitle title="Alerts" />
        <MechanicalToggle
          label="Push"
          onChange={(value) => updateAlert('push', value)}
          value={alerts.push}
        />
        <View style={styles.rule} />
        <MechanicalToggle
          label="Sound"
          onChange={(value) => updateAlert('sound', value)}
          value={alerts.sound}
        />
        <View style={styles.rule} />
        <MechanicalToggle
          label="Vibration"
          onChange={(value) => updateAlert('vibration', value)}
          value={alerts.vibration}
        />
        <View style={styles.rule} />
        <MechanicalToggle
          label="Speech"
          onChange={(value) => updateAlert('speech', value)}
          value={alerts.speech}
        />
        <View style={styles.rule} />
        <MechanicalToggle
          label="Full-screen"
          onChange={(value) => updateAlert('fullScreen', value)}
          value={alerts.fullScreen}
        />
        <View style={styles.rule} />
        <MechanicalToggle
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
  rule: { backgroundColor: palette.whiteDim, height: 1, marginVertical: 5 },
  plan: {
    color: palette.redDark,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  coverageTitle: {
    color: palette.black,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 6,
  },
  coverageCopy: {
    color: palette.blackSoft,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 12,
  },
});
