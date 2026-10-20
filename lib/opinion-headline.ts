/** Opinion / press pieces that must never appear as Stock SKUs. */
const OPINION_HEADLINE =
  /\b(trolls?|worst|disaster|fails?|failed|scam|ripoffs?|rip-?offs?|controversy|outrage|backlash|error cards?|mistakes?|disappoint(?:ing|ment)?|trash|garbage|fans with|clickbait|rant)\b/i;

export function isOpinionHeadline(title: string | null | undefined) {
  return OPINION_HEADLINE.test(String(title ?? ''));
}
