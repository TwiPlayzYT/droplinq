import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { AuthShell, authStyles } from '@/components/auth-shell';
import { ChoiceChip, MetalButton } from '@/components/dropdex-ui';
import {
  NotificationSetupGuide,
  type PreferredDevice,
} from '@/components/notification-setup-guide';
import { palette } from '@/constants/dropdex';
import {
  DEVICE_PROMPT_DONE_KEY,
  PREFERRED_DEVICE_KEY,
  markDevicePromptDone,
} from '@/constants/preferred-device';
import { postAuthPath, useAuth } from '@/store/auth-context';
import { useDropDex } from '@/store/dropdex-context';

type Phase = 'device' | 'offer' | 'guide';

export default function DevicePromptScreen() {
  const { profile } = useAuth();
  const { enableWebPush, webPushState, refreshWebPushState } = useDropDex();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('device');
  const [device, setDevice] = useState<PreferredDevice | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushNote, setPushNote] = useState<string | null>(null);

  const finish = async () => {
    if (device) {
      await AsyncStorage.setItem(PREFERRED_DEVICE_KEY, device).catch(() => undefined);
    }
    await markDevicePromptDone();
    router.replace(postAuthPath(profile) as never);
  };

  const pickDevice = async (next: PreferredDevice) => {
    setDevice(next);
    await AsyncStorage.setItem(PREFERRED_DEVICE_KEY, next).catch(() => undefined);
    if (next === 'phone') {
      setPhase('offer');
      return;
    }
    await finish();
  };

  const onEnableAlerts = async () => {
    setPushBusy(true);
    setPushNote(null);
    const ok = await enableWebPush();
    setPushNote(
      ok
        ? 'Alerts enabled for this device.'
        : 'Couldn’t enable yet — finish the steps above, then try again from Settings anytime.',
    );
    setPushBusy(false);
  };

  return (
    <AuthShell tagline="Monitor · Alert · Secure">
      {phase === 'device' ? (
        <>
          <Text style={authStyles.sectionLabel}>Where are you?</Text>
          <Text style={styles.lead}>
            Are you on a desktop/laptop or a phone? This helps us set up drop alerts the right way.
          </Text>
          <View style={styles.choices}>
            <ChoiceChip label="Phone" onPress={() => void pickDevice('phone')} selected={false} />
            <ChoiceChip
              label="Desktop / laptop"
              onPress={() => void pickDevice('desktop')}
              selected={false}
            />
          </View>
        </>
      ) : null}

      {phase === 'offer' ? (
        <>
          <Text style={authStyles.sectionLabel}>Phone alerts</Text>
          <Text style={styles.lead}>
            Would you like a quick guide on how to get notified on your phone — even when DropLinq
            is closed?
          </Text>
          <MetalButton
            icon="notifications"
            label="Yes, show me the guide"
            onPress={() => setPhase('guide')}
          />
          <View style={styles.spacer} />
          <MetalButton icon="arrow-forward" label="Not now" onPress={() => void finish()} />
          <Text style={styles.footer}>
            You can check how to set this up anytime in Settings → Lock-screen alerts.
          </Text>
        </>
      ) : null}

      {phase === 'guide' ? (
        <>
          <Text style={authStyles.sectionLabel}>Phone setup</Text>
          {Platform.OS === 'web' ? (
            <>
              <NotificationSetupGuide
                device="phone"
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
            <Text style={styles.lead}>
              When you continue, your phone may ask for notification permission. Allow it so drops
              can reach you.
            </Text>
          )}
          {pushNote ? <Text style={styles.note}>{pushNote}</Text> : null}
          <Text style={styles.footer}>
            You can check how to set this up anytime in Settings → Lock-screen alerts.
          </Text>
          <View style={styles.spacer} />
          <MetalButton icon="arrow-forward" label="Continue" onPress={() => void finish()} />
        </>
      ) : null}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  lead: {
    color: palette.whiteShadow,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 18,
  },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  spacer: { height: 10 },
  note: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 10,
    marginTop: 8,
  },
  footer: {
    color: palette.whiteShadow,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    marginBottom: 14,
    marginTop: 14,
  },
});
