import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { BrandHeader, Screen } from '@/components/dropdex-ui';
import {
  SettingsGroup,
  SettingsLinkRow,
  SettingsNavRow,
  SettingsToggleRow,
} from '@/components/settings-row';
import { brand } from '@/config/app-config';
import { palette } from '@/constants/dropdex';
import { legalHref } from '@/constants/legal';
import { TUTORIAL_STORAGE_KEY } from '@/constants/tutorial';
import { coverageModeCopy } from '@/data/pokemon-center-filters';
import { useAuth } from '@/store/auth-context';
import { useDropDex } from '@/store/dropdex-context';
import { requestTutorialRestart } from '@/components/site-tutorial';

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || 'DL';
}

export default function SettingsScreen() {
  const { alerts, filters, updateAlertPreferences, webPushState } = useDropDex();
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const plan = profile?.subscriptionTier ?? 'FREE';
  const coverage = coverageModeCopy[filters.coverageMode];
  const [tourDone, setTourDone] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(TUTORIAL_STORAGE_KEY)
      .then((value) => setTourDone(value === 'done' || value === 'skipped'))
      .catch(() => undefined);
  }, []);

  const displayName = useMemo(() => {
    if (profile?.username?.trim()) return profile.username.trim();
    if (profile?.email && profile.email !== 'guest@droplinq.local') {
      return profile.email.split('@')[0] || 'Account';
    }
    return 'Guest';
  }, [profile?.email, profile?.username]);

  const handle = useMemo(() => {
    if (profile?.username?.trim()) return `@${profile.username.trim()}`;
    if (profile?.email === 'guest@droplinq.local') return '@guest';
    return profile?.email ? profile.email.split('@')[0] : 'droplinq';
  }, [profile?.email, profile?.username]);

  const pushCaption =
    Platform.OS === 'web'
      ? webPushState === 'subscribed'
        ? 'This device is registered. Closed-app delivery still needs the alert server to be awake.'
        : 'Home Screen setup is required on iPhone. This is not the in-app overlay on Home.'
      : 'Uses the system notification permission on this device.';

  const updateAlert = (key: keyof typeof alerts, value: boolean) => {
    updateAlertPreferences({ ...alerts, [key]: value });
  };

  return (
    <Screen>
      <BrandHeader eyebrow="Settings" />

      <View nativeID="tour-settings" style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initialsFrom(displayName)}</Text>
        </View>
        <View style={styles.profileCopy}>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileHandle}>@{handle.replace(/^@/, '')}</Text>
          {profile?.email ? <Text style={styles.profileEmail}>{profile.email}</Text> : null}
          <Text style={styles.plan}>{plan}</Text>
        </View>
      </View>

      <SettingsGroup title="Alerts">
        <SettingsNavRow
          caption={pushCaption}
          onPress={() => router.push('/setup/notifications')}
          title="Home Screen & lock-screen"
          value={webPushState === 'subscribed' ? 'On' : 'Set up'}
        />
        <SettingsToggleRow
          caption="Tone while DropLinq is open. Does not replace lock-screen push."
          onChange={(value) => updateAlert('sound', value)}
          title="Sound"
          value={alerts.sound}
        />
        <SettingsToggleRow
          caption="Phones only. No effect on most desktops."
          onChange={(value) => updateAlert('vibration', value)}
          title="Vibration"
          value={alerts.vibration}
        />
        <SettingsToggleRow
          caption="Speaks the product name while DropLinq is open."
          onChange={(value) => updateAlert('speech', value)}
          title="Speech"
          value={alerts.speech}
        />
        <SettingsToggleRow
          caption="Full-screen overlay while you are in the app."
          onChange={(value) => updateAlert('fullScreen', value)}
          title="Full-screen overlay"
          value={alerts.fullScreen}
        />
        <SettingsToggleRow
          caption="Forces overlay, sound, speech, and vibration together while the app is open."
          last
          onChange={(value) => updateAlert('dropMode', value)}
          title="Drop Mode"
          value={alerts.dropMode ?? false}
        />
      </SettingsGroup>

      <SettingsGroup title="Coverage">
        <SettingsNavRow
          caption={coverage.description}
          onPress={() => router.push('/(tabs)/filter')}
          title={`${coverage.emoji} ${coverage.title}`}
        />
        <SettingsNavRow
          caption="New on the site, back in stock, or a preorder opening."
          last
          onPress={() => router.push('/(tabs)/filter')}
          title="When to ping you"
        />
      </SettingsGroup>

      <SettingsGroup title="General">
        <SettingsNavRow
          caption={tourDone ? 'Replay the 10-step walkthrough.' : 'Learn the main tabs.'}
          last
          onPress={() => {
            requestTutorialRestart();
            router.push('/(tabs)');
          }}
          title="Website tutorial"
        />
      </SettingsGroup>

      <SettingsGroup title="Legal">
        <SettingsLinkRow onPress={() => router.push('/legal/terms')} title="Terms of Service" />
        <SettingsLinkRow onPress={() => router.push('/legal/privacy')} title="Privacy Policy" />
        <SettingsLinkRow
          onPress={() => router.push(legalHref('/legal/cookies'))}
          title="Cookie Policy"
        />
        <SettingsLinkRow
          last
          onPress={() => router.push(legalHref('/legal/refund'))}
          title="Refund Policy"
        />
      </SettingsGroup>

      <SettingsGroup title="Account">
        <SettingsNavRow
          caption={`${brand.legalName} · ${brand.jurisdiction}. ${brand.contactEmail}`}
          onPress={() => void Linking.openURL(`mailto:${brand.contactEmail}`)}
          title="Email support"
        />
        <SettingsNavRow
          caption="We will delete the account tied to this email."
          onPress={() =>
            void Linking.openURL(
              `mailto:${brand.contactEmail}?subject=${encodeURIComponent('DropLinq account deletion')}&body=${encodeURIComponent(
                'Please delete the DropLinq account associated with this email.',
              )}`,
            )
          }
          title="Request account deletion"
        />
        <SettingsNavRow
          last
          onPress={() => void signOut()}
          title={profile?.email === 'guest@droplinq.local' ? 'Exit guest' : 'Sign out'}
        />
      </SettingsGroup>

      <View style={styles.testHint}>
        <Ionicons color={palette.cardMuted} name="information-circle-outline" size={16} />
        <Text style={styles.testHintText}>
          Home → Test plays the in-app overlay only. Lock-screen tests live on the Home Screen
          setup page.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    alignItems: 'center',
    backgroundColor: palette.card,
    borderColor: palette.cardBorder,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 16,
    marginBottom: 28,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: palette.red,
    borderRadius: 36,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    color: palette.cardInk,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  profileHandle: {
    color: palette.cardMuted,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  profileEmail: {
    color: palette.cardMuted,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  plan: {
    color: palette.red,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 8,
  },
  testHint: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  testHintText: {
    color: palette.cardMuted,
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
});
