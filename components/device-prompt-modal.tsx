import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MetalButton } from '@/components/dropdex-ui';
import { NotificationSetupGuide, type PreferredDevice } from '@/components/notification-setup-guide';
import { palette } from '@/constants/dropdex';
import {
  DEVICE_PROMPT_DONE_KEY,
  PREFERRED_DEVICE_KEY,
  isDevicePromptDoneMemory,
  markDevicePromptDone,
  subscribeDevicePromptDone,
} from '@/constants/preferred-device';
import { hasAcceptedCurrentLegal, useAuth } from '@/store/auth-context';
import { useDropDex } from '@/store/dropdex-context';

type Phase = 'device' | 'offer' | 'guide';

const choiceWebFocus = Platform.OS === 'web' ? ({ outlineStyle: 'none', tabIndex: -1 } as object) : null;

/**
 * Web-only: after sign-up and Terms acceptance, ask desktop vs mobile
 * (optional mobile notification guide).
 */
export function DevicePromptModal() {
  const { profile, profileReady, session } = useAuth();
  const segments = useSegments();
  const { enableWebPush, webPushState, refreshWebPushState } = useDropDex();
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<Phase>('device');
  const [device, setDevice] = useState<PreferredDevice | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushNote, setPushNote] = useState<string | null>(null);

  const legalOk = hasAcceptedCurrentLegal(profile);
  const onAuth = segments[0] === '(auth)';
  const mayShow = Platform.OS === 'web' && profileReady && Boolean(session) && legalOk && !onAuth;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setReady(true);
      setVisible(false);
      return;
    }

    const unsub = subscribeDevicePromptDone(() => {
      setVisible(false);
    });

    if (!mayShow) {
      setVisible(false);
      setReady(true);
      return unsub;
    }

    let cancelled = false;
    AsyncStorage.getItem(DEVICE_PROMPT_DONE_KEY)
      .then((value) => {
        if (cancelled) return;
        const done = value === '1' || isDevicePromptDoneMemory();
        setVisible(!done);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setVisible(!isDevicePromptDoneMemory());
        setReady(true);
      });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [mayShow, legalOk, session?.user.id]);

  if (Platform.OS !== 'web' || !ready || !visible) return null;

  const finish = async () => {
    if (device) {
      await AsyncStorage.setItem(PREFERRED_DEVICE_KEY, device).catch(() => undefined);
    }
    await markDevicePromptDone();
    setVisible(false);
  };

  const confirmDevice = async () => {
    if (!device) return;
    await AsyncStorage.setItem(PREFERRED_DEVICE_KEY, device).catch(() => undefined);
    if (device === 'phone') {
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
    <Modal animationType="fade" transparent visible>
      <View style={styles.scrim}>
        <ScrollView
          contentContainerStyle={styles.cardScroll}
          keyboardShouldPersistTaps="handled"
          style={styles.card}>
          {phase === 'device' ? (
            <>
              <Text style={styles.kicker}>QUICK SETUP</Text>
              <Text style={styles.title}>Are you on desktop or mobile?</Text>
              <Text style={styles.lead}>
                Select one, then confirm so DropLinq can set up drop alerts the right way.
              </Text>
              <View style={styles.choices}>
                <Pressable
                  focusable={false}
                  onPress={() => setDevice('phone')}
                  style={[styles.choiceBtn, device === 'phone' && styles.choiceSelected, choiceWebFocus]}>
                  <Text style={styles.choiceTitle}>Mobile</Text>
                  <Text style={styles.choiceSub}>iPhone or Android</Text>
                </Pressable>
                <Pressable
                  focusable={false}
                  onPress={() => setDevice('desktop')}
                  style={[styles.choiceBtn, device === 'desktop' && styles.choiceSelected, choiceWebFocus]}>
                  <Text style={styles.choiceTitle}>Desktop</Text>
                  <Text style={styles.choiceSub}>Laptop or computer</Text>
                </Pressable>
              </View>
              {device ? (
                <View style={styles.confirmWrap}>
                  <MetalButton
                    icon="checkmark"
                    label="Confirm"
                    onPress={() => void confirmDevice()}
                  />
                </View>
              ) : null}
            </>
          ) : null}

          {phase === 'offer' ? (
            <>
              <Text style={styles.kicker}>MOBILE ALERTS</Text>
              <Text style={styles.title}>Want the notification guide?</Text>
              <Text style={styles.lead}>
                Would you like to see how to get notified on your mobile — even when DropLinq is
                closed?
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
              <Text style={styles.kicker}>MOBILE SETUP</Text>
              <Text style={styles.title}>Get notified on your mobile</Text>
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
              {pushNote ? <Text style={styles.note}>{pushNote}</Text> : null}
              <Text style={styles.footer}>
                You can check how to set this up anytime in Settings → Lock-screen alerts.
              </Text>
              <MetalButton icon="arrow-forward" label="Done" onPress={() => void finish()} />
            </>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.78)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  card: {
    backgroundColor: '#141414',
    borderColor: '#2C2C2C',
    borderRadius: 20,
    borderWidth: 1,
    maxHeight: '92%' as unknown as number,
    maxWidth: 440,
    width: '100%',
  },
  cardScroll: {
    padding: 22,
  },
  kicker: {
    color: palette.red,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    color: palette.white,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    marginBottom: 10,
  },
  lead: {
    color: palette.whiteShadow,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 18,
  },
  choices: { gap: 10 },
  choiceBtn: {
    backgroundColor: palette.black,
    borderColor: '#2C2C2C',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  choiceSelected: {
    borderColor: palette.red,
    backgroundColor: '#1c1010',
  },
  choiceTitle: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  choiceSub: {
    color: palette.whiteShadow,
    fontSize: 13,
    fontWeight: '600',
  },
  confirmWrap: {
    marginTop: 16,
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
