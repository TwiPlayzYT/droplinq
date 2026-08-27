export type OpenProductMode = 'tab' | 'popup';

/**
 * Web: open Pokémon Center in a real browser tab or a sized popup window.
 * Empty feature string = normal tab (avoids Expo WebBrowser’s 500×650 popup).
 */
export async function openPokemonCenterProduct(
  url: string,
  mode: OpenProductMode = 'tab',
) {
  const features =
    mode === 'popup'
      ? 'noopener,noreferrer,width=520,height=780,left=80,top=40,popup=yes'
      : 'noopener,noreferrer';

  const win = window.open(url, '_blank', features);
  if (!win) {
    throw new Error('Popup blocked');
  }
  try {
    win.opener = null;
  } catch {
    // Cross-origin / browser restrictions — ignore.
  }
}
