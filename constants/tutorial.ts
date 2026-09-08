export const TUTORIAL_STORAGE_KEY = 'droplinq.tutorial.v1';

export type TutorialStepId =
  | 'welcome'
  | 'home-power'
  | 'home-test'
  | 'stock'
  | 'filter-coverage'
  | 'filter-events'
  | 'region'
  | 'settings'
  | 'homescreen'
  | 'appearance';

export type TutorialAnchor =
  | 'home'
  | 'stock'
  | 'filter'
  | 'region'
  | 'settings'
  | 'nav-search'
  | 'profile';

export type TutorialStep = {
  id: TutorialStepId;
  title: string;
  body: string;
  route: '/(tabs)' | '/(tabs)/stock' | '/(tabs)/filter' | '/(tabs)/region' | '/(tabs)/settings';
  anchor: TutorialAnchor;
  placement: 'top' | 'bottom';
};

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to DropLinq',
    body: 'This short tour highlights the main tabs. Use Next and Back anytime — you can restart it later from Settings.',
    route: '/(tabs)',
    anchor: 'home',
    placement: 'bottom',
  },
  {
    id: 'home-power',
    title: 'Home — arm alerts',
    body: 'The power control turns monitoring on. When it is on, DropLinq watches your Pokémon Center region for matching products.',
    route: '/(tabs)',
    anchor: 'home',
    placement: 'bottom',
  },
  {
    id: 'home-test',
    title: 'Home — test while you are here',
    body: 'Test alert on Home plays the in-app overlay, sound, and speech. That is not a lock-screen push — those are set up separately.',
    route: '/(tabs)',
    anchor: 'home',
    placement: 'bottom',
  },
  {
    id: 'stock',
    title: 'Stock',
    body: 'Stock is the live catalog for your region. Open a product, add it to your watchlist, and see recent availability changes.',
    route: '/(tabs)/stock',
    anchor: 'stock',
    placement: 'bottom',
  },
  {
    id: 'filter-coverage',
    title: 'Filter — what to cover',
    body: 'Coverage decides which Pokémon Center TCG products can alert you: Popular, All TCG, or a custom mix.',
    route: '/(tabs)/filter',
    anchor: 'filter',
    placement: 'bottom',
  },
  {
    id: 'filter-events',
    title: 'Filter — when to ping you',
    body: 'New on the site, back in stock, or a preorder opening. Turn off any type you do not want.',
    route: '/(tabs)/filter',
    anchor: 'filter',
    placement: 'bottom',
  },
  {
    id: 'region',
    title: 'Region',
    body: 'Each storefront is a different Pokémon Center site. Alerts follow the region you select here.',
    route: '/(tabs)/region',
    anchor: 'region',
    placement: 'bottom',
  },
  {
    id: 'settings',
    title: 'Settings',
    body: 'Account, appearance, in-app alert sounds, and legal links live here. Keep this list short — deeper setup has its own pages.',
    route: '/(tabs)/settings',
    anchor: 'settings',
    placement: 'bottom',
  },
  {
    id: 'homescreen',
    title: 'Home Screen alerts',
    body: 'On iPhone, closed-app notifications need Add to Home Screen, then Enable alerts. Settings has a dedicated setup page with a video slot for your walkthrough.',
    route: '/(tabs)/settings',
    anchor: 'settings',
    placement: 'bottom',
  },
  {
    id: 'appearance',
    title: 'Appearance',
    body: 'Open your profile menu (avatar) to switch Dark, Light, or DropLinq Special. Dark matches the Region screen: black canvas, dark cards, red selection.',
    route: '/(tabs)',
    anchor: 'profile',
    placement: 'top',
  },
];
