import * as WebBrowser from 'expo-web-browser';

/**
 * Opens Pokémon Center in the system in-app browser (SFSafariViewController /
 * Chrome Custom Tabs). Isolated from any old on-device scanner cookies.
 * WebView, which is what was causing the "Oops" security page.
 */
export async function openPokemonCenterProduct(url: string) {
  await WebBrowser.openBrowserAsync(url, {
    createTask: false,
    enableBarCollapsing: true,
    showInRecents: false,
    enableDefaultShareMenuItem: true,
  });
}
