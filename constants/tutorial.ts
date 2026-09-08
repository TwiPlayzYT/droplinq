export const TUTORIAL_STORAGE_KEY = 'droplinq.tutorial.v2';

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

export type TutorialStep = {
  id: TutorialStepId;
  title: string;
  body: string;
  route: '/(tabs)' | '/(tabs)/stock' | '/(tabs)/filter' | '/(tabs)/region' | '/(tabs)/settings';
  /** First visible match wins. */
  anchors: string[];
  shape: TutorialShape;
  pad: number;
  scroll: boolean;
};

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'home-power',
    title: 'This starts DropLinq',
    body: 'The big button arms alerts. Off means DropLinq is idle. Tap it to ON and we watch your Pokémon Center region for matching products. Leave it off until you are ready.',
    route: '/(tabs)',
    anchors: ['home-power'],
    shape: 'circle',
    pad: 8,
    scroll: true,
  },
  {
    id: 'home-test',
    title: 'Test while you are here',
    body: 'Test plays the in-app overlay, sound, and speech so you can hear what a hit feels like. It is not a lock-screen notification — that setup is in Settings.',
    route: '/(tabs)',
    anchors: ['home-test'],
    shape: 'pill',
    pad: 10,
    scroll: true,
  },
  {
    id: 'stock',
    title: 'Stock is the live catalog',
    body: 'This is every product DropLinq is watching in your region. Open a card for details, add it to your watchlist, and scan recent availability changes.',
    route: '/(tabs)/stock',
    anchors: ['stock-catalog', 'stock'],
    shape: 'round',
    pad: 8,
    scroll: true,
  },
  {
    id: 'filter-coverage',
    title: 'Choose what to cover',
    body: 'Coverage decides which Pokémon Center TCG products can alert you. Stay on All TCG, pick Popular, or build a custom mix.',
    route: '/(tabs)/filter',
    anchors: ['filter-coverage', 'filter'],
    shape: 'round',
    pad: 8,
    scroll: true,
  },
  {
    id: 'filter-events',
    title: 'Choose when to ping you',
    body: 'New on the site, back in stock, or a preorder opening. Turn off any type you do not care about. Coverage above still has to match.',
    route: '/(tabs)/filter',
    anchors: ['filter-events'],
    shape: 'round',
    pad: 8,
    scroll: true,
  },
  {
    id: 'region',
    title: 'Pick your Pokémon Center',
    body: 'Each row is a different storefront (Canada, US, UK, and so on). Alerts and the catalog follow the region you select here.',
    route: '/(tabs)/region',
    anchors: ['region-list', 'region'],
    shape: 'round',
    pad: 8,
    scroll: true,
  },
  {
    id: 'settings',
    title: 'Settings is home base',
    body: 'Account details, in-app alert sounds, legal links, and deeper setup live here. Keep this list short — lock-screen setup has its own page.',
    route: '/(tabs)/settings',
    anchors: ['settings-tab', 'settings'],
    shape: 'round',
    pad: 8,
    scroll: false,
  },
  {
    id: 'homescreen',
    title: 'Lock-screen alerts',
    body: 'On iPhone, closed-app notifications need Add to Home Screen, then Enable alerts. Open this row for the walkthrough and test push.',
    route: '/(tabs)/settings',
    anchors: ['settings-homescreen'],
    shape: 'round',
    pad: 6,
    scroll: true,
  },
  {
    id: 'settings-alerts',
    title: 'Sounds while DropLinq is open',
    body: 'Sound, vibration, speech, and the full-screen overlay only run while you are in the app. They do not replace lock-screen push.',
    route: '/(tabs)/settings',
    anchors: ['settings-sound'],
    shape: 'round',
    pad: 6,
    scroll: true,
  },
  {
    id: 'profile',
    title: 'Your profile',
    body: 'Tap your avatar for the account menu. From there you can open Settings, sign out, and switch how DropLinq looks.',
    route: '/(tabs)',
    anchors: ['profile'],
    shape: 'pill',
    pad: 8,
    scroll: false,
  },
  {
    id: 'appearance',
    title: 'Appearance',
    body: 'Open the profile menu, then Appearance. Dark, Light, or DropLinq Special — Dark matches the Region screen: black canvas, dark cards, red selection.',
    route: '/(tabs)',
    anchors: ['profile'],
    shape: 'pill',
    pad: 8,
    scroll: false,
  },
];
