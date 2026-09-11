import AsyncStorage from '@react-native-async-storage/async-storage';

export const TUTORIAL_STORAGE_KEY = 'droplinq.tutorial.v3';

export type TutorialPersistValue = 'done' | 'skipped';

const settledListeners = new Set<(value: TutorialPersistValue) => void>();
const clearedListeners = new Set<() => void>();

/** Clears tutorial progress so the ask shows again after setup. */
export async function clearTutorialStorage() {
  await AsyncStorage.removeItem(TUTORIAL_STORAGE_KEY);
  clearedListeners.forEach((listener) => listener());
}

export function subscribeTutorialSettled(listener: (value: TutorialPersistValue) => void) {
  settledListeners.add(listener);
  return () => {
    settledListeners.delete(listener);
  };
}

/** Notify when tutorial storage is cleared (e.g. post-setup re-ask). */
export function subscribeTutorialCleared(listener: () => void) {
  clearedListeners.add(listener);
  return () => {
    clearedListeners.delete(listener);
  };
}

/** Persist Finish / Not now and notify listeners (e.g. Pro upgrade gate). */
export function persistTutorialStatus(value: TutorialPersistValue) {
  void AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, value);
  settledListeners.forEach((listener) => listener(value));
}

export type TutorialStepId =
  | 'home-power'
  | 'home-test'
  | 'stock'
  | 'filter-coverage'
  | 'filter-events'
  | 'region'
  | 'settings'
  | 'homescreen'
  | 'settings-alerts'
  | 'profile'
  | 'appearance';

export type TutorialShape = 'circle' | 'pill' | 'round';
export type TutorialAction =
  | 'power-on'
  | 'test-alert'
  | 'tap'
  | 'coverage'
  | 'events'
  | 'region'
  | 'sound'
  | 'profile'
  | 'appearance';

export type TutorialStep = {
  id: TutorialStepId;
  title: string;
  body: string;
  hint: string;
  route: '/(tabs)/home' | '/(tabs)/stock' | '/(tabs)/filter' | '/(tabs)/region' | '/(tabs)/settings';
  anchors: string[];
  shape: TutorialShape;
  pad: number;
  scroll: boolean;
  action: TutorialAction;
};

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'home-power',
    title: 'This starts DropLinq',
    body: 'The big button arms alerts. Off means DropLinq is idle. Tap it to ON and we watch your Pokémon Center region for matching products. Leave it off until you are ready.',
    hint: 'Tap the button to turn alerts ON, or tap Next',
    route: '/(tabs)/home',
    anchors: ['home-power'],
    shape: 'circle',
    pad: 10,
    scroll: true,
    action: 'power-on',
  },
  {
    id: 'home-test',
    title: 'Test while you are here',
    body: 'Schedule a test for Now or in a few seconds. That plays the in-app overlay (and a lock-screen push if Notifications are enabled). It is not a substitute for lock-screen setup in Settings → Notifications.',
    hint: 'Tap Test, then choose Now',
    route: '/(tabs)/home',
    anchors: ['home-test'],
    shape: 'pill',
    pad: 10,
    scroll: true,
    action: 'test-alert',
  },
  {
    id: 'stock',
    title: 'Stock is the live catalog',
    body: 'This is every product DropLinq is watching in your region. Open a card for details, add it to your watchlist, and scan recent availability changes.',
    hint: 'Tap the catalog status card',
    route: '/(tabs)/stock',
    anchors: ['stock-catalog'],
    shape: 'round',
    pad: 8,
    scroll: true,
    action: 'tap',
  },
  {
    id: 'filter-coverage',
    title: 'Choose what to cover',
    body: 'Coverage decides which Pokémon Center TCG products can alert you. Stay on All TCG, pick Popular, or build a custom mix.',
    hint: 'Tap a coverage option',
    route: '/(tabs)/filter',
    anchors: ['filter-coverage'],
    shape: 'round',
    pad: 8,
    scroll: true,
    action: 'coverage',
  },
  {
    id: 'filter-events',
    title: 'Choose when to ping you',
    body: 'New on the site, back in stock, or a preorder opening. Turn off any type you do not care about. Coverage above still has to match.',
    hint: 'Tap one of the alert switches',
    route: '/(tabs)/filter',
    anchors: ['filter-events'],
    shape: 'round',
    pad: 8,
    scroll: true,
    action: 'events',
  },
  {
    id: 'region',
    title: 'Pick your Pokémon Center',
    body: 'Each row is a different storefront (Canada, US, UK, and so on). Alerts and the catalog follow the region you select here.',
    hint: 'Tap a region to select it',
    route: '/(tabs)/region',
    anchors: ['region-list'],
    shape: 'round',
    pad: 8,
    scroll: true,
    action: 'region',
  },
  {
    id: 'settings',
    title: 'Settings is home base',
    body: 'Account details, in-app alert sounds, legal links, and deeper setup live here. Keep this list short — lock-screen setup has its own page.',
    hint: 'Tap your account card',
    route: '/(tabs)/settings',
    anchors: ['settings'],
    shape: 'round',
    pad: 8,
    scroll: false,
    action: 'tap',
  },
  {
    id: 'homescreen',
    title: 'Lock-screen alerts',
    body: 'On iPhone, closed-app notifications need Add to Home Screen, then Enable alerts. Open Notifications for the walkthrough and test push.',
    hint: 'Tap Notifications',
    route: '/(tabs)/settings',
    anchors: ['settings-homescreen'],
    shape: 'round',
    pad: 6,
    scroll: true,
    action: 'tap',
  },
  {
    id: 'settings-alerts',
    title: 'Sounds while DropLinq is open',
    body: 'Sound, vibration, speech, and the full-screen overlay only run while you are in the app. They do not replace lock-screen push.',
    hint: 'Tap Sound to toggle it',
    route: '/(tabs)/settings',
    anchors: ['settings-sound'],
    shape: 'round',
    pad: 6,
    scroll: true,
    action: 'sound',
  },
  {
    id: 'profile',
    title: 'Your profile',
    body: 'Tap your avatar for the account menu. From there you can open Settings, sign out, and switch how DropLinq looks.',
    hint: 'Tap your avatar',
    route: '/(tabs)/home',
    anchors: ['profile'],
    shape: 'pill',
    pad: 8,
    scroll: false,
    action: 'profile',
  },
  {
    id: 'appearance',
    title: 'Appearance',
    body: 'Open the profile menu, then Appearance. Dark, Light, or DropLinq Special — Dark matches the Region screen: black canvas, dark cards, red selection.',
    hint: 'Pick Dark, Light, or DropLinq Special',
    route: '/(tabs)/home',
    anchors: ['appearance-menu', 'profile'],
    shape: 'round',
    pad: 8,
    scroll: false,
    action: 'appearance',
  },
];
