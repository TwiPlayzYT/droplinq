export const NEWS_SEEN_KEY = 'droplinq.news.seen.v1';

export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  /** Full in-app body — keep readable inside DropLinq (no external redirect required). */
  body: string;
  publishedAt: string;
  sourceLabel?: string;
};

/**
 * Curated DropLinq news / community notes.
 * Newest first. When you add an item, users who have not seen its id get a one-time popup after login.
 */
export const NEWS_ITEMS: NewsItem[] = [
  {
    id: '2026-10-15-pc-30th-anniversary-drop',
    title: 'Pokémon Center 30th anniversary drop drew heavy fan backlash',
    summary:
      'A recent 30th Celebration TCG release frustrated collectors over tin contents and product presentation — not a DropLinq stock SKU.',
    body: `Collectors reacted strongly to a Pokémon Center 30th Celebration TCG drop that many called one of the weakest anniversary offerings yet.

What people are talking about
• Tin / pack contents that felt thin for the price and hype
• Presentation and assortment choices that disappointed longtime fans
• Social posts framing the drop as Pokémon Center “trolling” the community

What this means in DropLinq
This story is community news, not a product we track as stock. You will not see it as a Stock card. We only alert on real sealed TCG listings, restocks, and queues that match your filters.

We’ll keep separating news from stock so your catalog stays clean.`,
    publishedAt: '2026-10-15T17:42:00.000Z',
    sourceLabel: 'Community note',
  },
];

export function sortNewsNewestFirst(items: NewsItem[] = NEWS_ITEMS) {
  return [...items].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function unreadNews(seenIds: Set<string>, items: NewsItem[] = NEWS_ITEMS) {
  return sortNewsNewestFirst(items).filter((item) => !seenIds.has(item.id));
}
