/** Non-card Pokémon Center goods. These never belong in Stock or in an alert. */
const MERCHANDISE =
  /\b(game ?boys?|jukebox|plush(?:es)?|squishmallows?|funko|amiibo|hoodies?|t-?shirts?|keychains?|sneakers?|socks?|hats?|backpacks?|mugs?)\b/i;

export function isMerchandiseTitle(title?: string | null) {
  return MERCHANDISE.test(String(title ?? ''));
}
