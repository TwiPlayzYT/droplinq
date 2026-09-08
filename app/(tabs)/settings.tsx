import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { EditProfileModal } from '@/components/edit-profile-modal';
import { BrandHeader, Screen } from '@/components/dropdex-ui';
import { TourAnchor } from '@/components/tour-anchor';
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
import { displayNameFrom, handleFrom } from '@/lib/profile-identity';
import { useAuth } from '@/store/auth-context';
import { emitTourAction, isTutorialSessionActive } from '@/services/tour-session';
import { useDropDex } from '@/store/dropdex-context';
import { requestTutorialRestart } from '@/components/site-tutorial';

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || 'DL';
}

export default function SettingsScreen() {
  const { alerts, filters, updateAlertPreferences, webPushState } = useDropDex();
  const { profile, signOut, updateIdentity } = useAuth();
  const router = useRouter();
  const plan = profile?.subscriptionTier ?? 'FREE';
  const coverage = coverageModeCopy[filters.coverageMode];
  const [tourDone, setTourDone] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(TUTORIAL_STORAGE_KEY)
      .then((value) => setTourDone(value === 'done' || value === 'skipped'))
      .catch(() => undefined);
  }, []);

  const displayName = useMemo(() => displayNameFrom(profile), [profile]);
  const handle = useMemo(() => handleFrom(profile), [profile]);

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

      <TourAnchor id="settings">
      <Pressable
        accessibilityLabel="Edit display name and handle"
        onPress={() => {
          if (isTutorialSessionActive()) {
            emitTourAction('tap');
            return;
          }
          setEditError(null);
          setEditOpen(true);
        }}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initialsFrom(displayName)}</Text>
        </View>
        <View style={styles.profileCopy}>
          <Text style={styles.profileName}>{displayName}</Text>
          <View style={styles.handleRow}>
            <Text style={styles.profileHandle}>@{handle}</Text>
            <Ionicons color={palette.red} name="pencil-outline" size={14} />
          </View>
          {profile?.email ? <Text style={styles.profileEmail}>{profile.email}</Text> : null}
          <Text style={styles.plan}>{plan}</Text>
        </View>
      </View>
      </Pressable>
      </TourAnchor>

      <EditProfileModal
        busy={editBusy}
        displayName={displayName}
        error={editError}
        handle={handle}
        onClose={() => {
          if (editBusy) return;
          setEditOpen(false);
          setEditError(null);
        }}
        onSave={async ({ displayName: nextName, handle: nextHandle }) => {
          setEditBusy(true);
          setEditError(null);
          try {
            const result = await updateIdentity({ displayName: nextName, handle: nextHandle });
            if (!result.ok) {
              setEditError(result.message);
              return;
            }
            setEditOpen(false);
          } catch (err) {
            setEditError(err instanceof Error ? err.message : 'Could not update profile.');
          } finally {
            setEditBusy(false);
          }
        }}
        visible={editOpen}
      />

      <SettingsGroup title="Alerts">
        <SettingsNavRow
          caption={pushCaption}
          onPress={() => router.push('/setup/notifications')}
          title="Home Screen & lock-screen"
          tourId="settings-homescreen"
          value={webPushState === 'subscribed' ? 'On' : 'Set up'}
        />
        <SettingsToggleRow
          caption="Tone while DropLinq is open. Does not replace lock-screen push."
          onChange={(value) => updateAlert('sound', value)}
          title="Sound"
          tourId="settings-sound"
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
          caption={tourDone ? 'Replay the walkthrough of Home, Stock, Filter, and Settings.' : 'Learn the main features.'}
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
    borderColor: palette.redLight,
    borderRadius: 40,
    borderWidth: 3,
    height: 80,
    justifyContent: 'center',
    width: 80,
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
  handleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  profileHandle: {
    color: palette.red,
    fontSize: 15,
    fontWeight: '700',
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
