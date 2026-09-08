import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { createElement, useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { BrandHeader, ChoiceChip, MetalButton, Panel, Screen, SectionTitle } from '@/components/dropdex-ui';
import { NotificationSetupGuide, type PreferredDevice } from '@/components/notification-setup-guide';
import { palette } from '@/constants/dropdex';
import { installGuideEmbedUrl } from '@/constants/install-guide';
import { PREFERRED_DEVICE_KEY } from '@/constants/preferred-device';
import { useDropDex } from '@/store/dropdex-context';

function YoutubeSlot() {
  const embed = installGuideEmbedUrl();
  if (Platform.OS === 'web' && embed) {
    return (
      <View style={styles.videoFrame}>
        {createElement('iframe', {
          allow:
            'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowFullScreen: true,
          src: embed,
          style: { border: 0, height: '100%', minHeight: 180, width: '100%' },
          title: 'Add DropLinq to Home Screen',
        })}
      </View>
    );
  }

  return (
    <View style={styles.videoFrame}>
      <Text style={styles.videoKicker}>VIDEO TEMPLATE</Text>
      <Text style={styles.videoTitle}>iPhone + Android Home Screen walkthrough</Text>
      <Text style={styles.videoBody}>
        Paste your YouTube video id in constants/install-guide.ts when the recording is ready. This
        card will play it here.
      </Text>
    </View>
  );
}

export default function NotificationSetupScreen() {
  const router = useRouter();
  const {
    enableWebPush,
    refreshWebPushState,
    sendTestLockScreenPush,
    webPushState,
  } = useDropDex();
  const [device, setDevice] = useState<PreferredDevice>('phone');
  const [pushBusy, setPushBusy] = useState(false);
  const [testBusy, setTestBusy] = useState(false);

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

  const persistDevice = (next: PreferredDevice) => {
    setDevice(next);
    void AsyncStorage.setItem(PREFERRED_DEVICE_KEY, next);
  };

  return (
    <Screen>
      <BrandHeader eyebrow="Home Screen alerts" />

      <Panel>
        <SectionTitle
          caption="iPhone only delivers closed-app Web Push from a Home Screen app, not a Safari tab. Android Chrome should be installed. Desktop needs Chrome, Edge, or Firefox with notifications allowed."
          title="Add DropLinq, then enable alerts"
        />
        <YoutubeSlot />
        <Text style={styles.devicePrompt}>I’m setting this up on</Text>
        <View style={styles.deviceRow}>
          <ChoiceChip label="Mobile" onPress={() => persistDevice('phone')} selected={device === 'phone'} />
          <ChoiceChip
            label="Desktop"
            onPress={() => persistDevice('desktop')}
            selected={device === 'desktop'}
          />
        </View>
        <NotificationSetupGuide
          device={device}
          enableBusy={pushBusy}
          onEnable={() => {
            void (async () => {
              setPushBusy(true);
              await enableWebPush();
              setPushBusy(false);
            })();
          }}
          showEnable={
            webPushState === 'ready' || webPushState === 'error' || webPushState === 'denied'
          }
          webPushState={webPushState}
        />
        {webPushState === 'subscribed' ? (
          <MetalButton
            icon="notifications-outline"
            label={testBusy ? 'Sending lock-screen test…' : 'Send lock-screen test'}
            onPress={() => {
              void (async () => {
                setTestBusy(true);
                await sendTestLockScreenPush();
                setTestBusy(false);
              })();
            }}
          />
        ) : null}
        {webPushState === 'install-required' ? (
          <MetalButton
            icon="refresh"
            label="I’ve added it — check again"
            onPress={() => void refreshWebPushState()}
          />
        ) : null}
      </Panel>

      <Panel tone="dark">
        <Text style={styles.honestKicker}>WHAT THIS CAN AND CANNOT DO</Text>
        <Text style={styles.honestBody}>
          Enable alerts registers this device with the alert server. A lock-screen test is a real
          push. Home → Test is only the in-app overlay while DropLinq is open. Closed-app delivery
          still needs the monitor to be awake — that always-on host is a later purchase.
        </Text>
      </Panel>

      <MetalButton icon="arrow-back" label="Back to Settings" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  videoFrame: {
    backgroundColor: palette.blackRaised,
    borderColor: palette.cardBorder,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 18,
    minHeight: 180,
    overflow: 'hidden',
    padding: 18,
  },
  videoKicker: {
    color: palette.red,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  videoTitle: {
    color: palette.onRaised,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 8,
  },
  videoBody: {
    color: palette.onRaisedDim,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  devicePrompt: {
    color: palette.cardInk,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  deviceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  honestKicker: {
    color: palette.red,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  honestBody: {
    color: palette.onRaised,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
  },
});
