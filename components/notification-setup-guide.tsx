import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { MetalButton } from '@/components/dropdex-ui';
import { palette } from '@/constants/dropdex';
import type { WebPushState } from '@/services/web-push-service';

export type PreferredDevice = 'phone' | 'desktop';

type GuideStep = {
  n: string;
  title: string;
  body: string;
};

const PHONE_IOS_STEPS: GuideStep[] = [
  {
    n: '1',
    title: 'Open DropLinq in Safari',
    body: 'Chrome and in-app browsers on iPhone often block lock-screen alerts. Use Safari.',
  },
  {
    n: '2',
    title: 'Tap Share',
    body: 'Tap the Share icon (square with an arrow) at the bottom of Safari.',
  },
  {
    n: '3',
    title: 'Add to Home Screen',
    body: 'Scroll the sheet and choose “Add to Home Screen”, then tap Add.',
  },
  {
    n: '4',
    title: 'Open the DropLinq icon',
    body: 'Launch DropLinq from your Home Screen (not from a Safari tab).',
  },
  {
    n: '5',
    title: 'Allow notifications',
    body: 'Tap Enable alerts and choose Allow when iOS asks. You’re set — drops can reach you with the site closed.',
  },
];

const PHONE_ANDROID_STEPS: GuideStep[] = [
  {
    n: '1',
    title: 'Install DropLinq',
    body: 'In Chrome, tap the menu (⋮) → “Install app” or “Add to Home screen”.',
  },
  {
    n: '2',
    title: 'Open the installed app',
    body: 'Launch DropLinq from your home screen so it runs like an app.',
  },
  {
    n: '3',
    title: 'Allow notifications',
    body: 'Tap Enable alerts and allow notifications. Drops can reach you even when DropLinq is closed.',
  },
];

const DESKTOP_STEPS: GuideStep[] = [
  {
    n: '1',
    title: 'Keep this tab signed in',
    body: 'Use Chrome, Edge, or Firefox on this computer for the most reliable alerts.',
  },
  {
    n: '2',
    title: 'Allow notifications',
    body: 'Tap Enable alerts. When the browser asks, choose Allow — not Block.',
  },
  {
    n: '3',
    title: 'Leave DropLinq running in the background',
    body: 'You don’t need the tab focused. As long as the browser isn’t fully quit, lock-screen / system alerts can still arrive.',
  },
];

function detectPhoneFlavor(): 'ios' | 'android' {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return 'ios';
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) return 'android';
  return 'ios';
}

export function stepsForDevice(device: PreferredDevice): GuideStep[] {
  if (device === 'desktop') return DESKTOP_STEPS;
  return detectPhoneFlavor() === 'android' ? PHONE_ANDROID_STEPS : PHONE_IOS_STEPS;
}

type Props = {
  device: PreferredDevice;
  dense?: boolean;
  light?: boolean;
  onEnable?: () => void;
  enableBusy?: boolean;
  enableLabel?: string;
  webPushState?: WebPushState;
  showEnable?: boolean;
};

export function NotificationSetupGuide({
  device,
  dense,
  light,
  onEnable,
  enableBusy,
  enableLabel,
  webPushState,
  showEnable = true,
}: Props) {
  const steps = stepsForDevice(device);
  const titleColor = light ? palette.onRaised : palette.cardInk;
  const bodyColor = light ? palette.onRaisedDim : palette.cardMuted;
  const stepBg = light ? palette.black : palette.card;
  const stepBorder = light ? palette.blackSoft : palette.cardBorder;

  const statusCopy = (() => {
    switch (webPushState) {
      case 'subscribed':
        return 'Lock-screen alerts are on for this device.';
      case 'install-required':
        return 'Finish Add to Home Screen first, then open DropLinq from that icon.';
      case 'denied':
        return 'Notifications are blocked in browser settings. Reset permission for this site, then try again.';
      case 'unsupported':
        return 'This browser can’t receive Web Push. Try Chrome/Edge/Firefox, or Safari on iPhone via Home Screen.';
      case 'error':
        return 'Push isn’t fully configured on the server yet, or the browser failed. You can still use in-app alerts while the site is open.';
      case 'ready':
        return 'Ready — tap Enable alerts when you finish the steps above.';
      default:
        return null;
    }
  })();

  return (
    <View style={dense ? undefined : styles.wrap}>
      <Text style={[styles.headline, { color: titleColor }]}>
        {device === 'phone'
          ? 'Get notified on your mobile — even when DropLinq is closed'
          : 'Get notified on this computer — even when the tab isn’t focused'}
      </Text>
      <Text style={[styles.sub, { color: bodyColor }]}>
        Same idea as other sites asking “Allow notifications?” — this is how drops reach you in the
        background.
      </Text>

      {steps.map((step) => (
        <View
          key={step.n}
          style={[styles.step, { backgroundColor: stepBg, borderColor: stepBorder }]}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{step.n}</Text>
          </View>
          <View style={styles.stepCopy}>
            <Text style={[styles.stepTitle, { color: titleColor }]}>{step.title}</Text>
            <Text style={[styles.stepBody, { color: bodyColor }]}>{step.body}</Text>
          </View>
        </View>
      ))}

      {statusCopy ? (
        <View style={styles.statusRow}>
          <Ionicons
            color={webPushState === 'subscribed' ? palette.red : bodyColor}
            name={webPushState === 'subscribed' ? 'checkmark-circle' : 'information-circle-outline'}
            size={18}
          />
          <Text style={[styles.statusText, { color: bodyColor }]}>{statusCopy}</Text>
        </View>
      ) : null}

      {showEnable && onEnable && webPushState !== 'subscribed' && webPushState !== 'unsupported' ? (
        <MetalButton
          icon="notifications"
          label={enableBusy ? 'Enabling…' : enableLabel ?? 'Enable alerts'}
          onPress={onEnable}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  headline: {
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
    marginBottom: 8,
  },
  sub: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginBottom: 14,
  },
  step: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: palette.red,
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    marginTop: 2,
    width: 24,
  },
  badgeText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: '900',
  },
  stepCopy: { flex: 1, minWidth: 0 },
  stepTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  stepBody: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  statusRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    marginTop: 4,
  },
  statusText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
});
