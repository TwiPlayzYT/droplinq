import * as WebBrowser from 'expo-web-browser';

export type OpenProductMode = 'tab' | 'popup';

/**
 * Opens Pokémon Center in the system in-app browser (SFSafariViewController /
 * Chrome Custom Tabs). Mode is ignored on native — there is no tab vs popup.
 */
export async function openPokemonCenterProduct(
  url: string,
  _mode: OpenProductMode = 'tab',
) {
  await WebBrowser.openBrowserAsync(url, {
    createTask: false,
    enableBarCollapsing: true,
    showInRecents: false,
    enableDefaultShareMenuItem: true,
  });
}
