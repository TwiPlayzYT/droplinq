import { Product, RegionId } from '@/types/dropdex';

export type RegionConfig = {
  id: RegionId;
  /** Full country label shown in the Region tab. */
  label: string;
  /** Short badge code shown on the selector row. */
  code: string;
  /** Human-readable storefront name. */
  storefront: string;
  /** Domain shown in the UI. */
  domain: string;
  /** Locale path segment on pokemoncenter.com ('' for the US root store). */
  localePath: string;
  /** Storefront home. */
  baseUrl: string;
  /** Catalog pages the live scanner cycles through. */
  catalogUrls: string[];
  /** Locale used to format release dates for this storefront. */
  dateLocale: string;
  /** Typical Pokémon Center drop window for the region. */
  dropWindow: string;
  /**
   * Days to shift catalog release dates for the region's schedule.
   * Japan runs its own calendar and gets sets roughly eight weeks early.
   */
  releaseOffsetDays: number;
};

export const regions: RegionConfig[] = [
  {
    id: 'us',
    label: 'United States',
    code: 'US',
    storefront: 'Pokémon Center US',
    domain: 'pokemoncenter.com',
    localePath: '',
    baseUrl: 'https://www.pokemoncenter.com',
    catalogUrls: [
      'https://www.pokemoncenter.com/category/trading-card-game',
      'https://www.pokemoncenter.com/category/new-releases',
    ],
    dateLocale: 'en-US',
    dropWindow: 'Drops weekdays ~10 AM–2 PM ET',
    releaseOffsetDays: 0,
  },
  {
    id: 'ca',
    label: 'Canada',
    code: 'CA',
    storefront: 'Pokémon Center Canada',
    domain: 'pokemoncenter.com/en-ca',
    localePath: '/en-ca',
    baseUrl: 'https://www.pokemoncenter.com/en-ca',
    catalogUrls: [
      'https://www.pokemoncenter.com/en-ca/category/trading-card-game',
      'https://www.pokemoncenter.com/en-ca/category/new-releases',
    ],
    dateLocale: 'en-CA',
    dropWindow: 'Drops weekdays ~11 AM–2 PM ET',
    releaseOffsetDays: 0,
  },
  {
    id: 'uk',
    label: 'United Kingdom',
    code: 'UK',
    storefront: 'Pokémon Center UK',
    domain: 'pokemoncenter.com/en-gb',
    localePath: '/en-gb',
    baseUrl: 'https://www.pokemoncenter.com/en-gb',
    catalogUrls: [
      'https://www.pokemoncenter.com/en-gb/category/trading-card-game',
      'https://www.pokemoncenter.com/en-gb/category/new-releases',
    ],
    dateLocale: 'en-GB',
    dropWindow: 'Drops weekdays ~10 AM–1 PM UK time',
    releaseOffsetDays: 0,
  },
  {
    id: 'de',
    label: 'Germany (Mainland Europe)',
    code: 'DE',
    storefront: 'Pokémon Center Deutschland',
    domain: 'pokemoncenter.com/de-de',
    localePath: '/de-de',
    baseUrl: 'https://www.pokemoncenter.com/de-de',
    catalogUrls: [
      'https://www.pokemoncenter.com/de-de/category/trading-card-game',
      'https://www.pokemoncenter.com/de-de/category/new-releases',
    ],
    dateLocale: 'de-DE',
    dropWindow: 'Drops weekdays ~10 AM–1 PM CET',
    releaseOffsetDays: 0,
  },
  {
    id: 'au',
    label: 'Australia',
    code: 'AU',
    storefront: 'Pokémon Center Australia',
    domain: 'pokemoncenter.com/en-au',
    localePath: '/en-au',
    baseUrl: 'https://www.pokemoncenter.com/en-au',
    catalogUrls: [
      'https://www.pokemoncenter.com/en-au/category/trading-card-game',
      'https://www.pokemoncenter.com/en-au/category/new-releases',
    ],
    dateLocale: 'en-AU',
    dropWindow: 'Drops weekdays ~9 AM–12 PM AEST',
    releaseOffsetDays: 0,
  },
  {
    id: 'nz',
    label: 'New Zealand',
    code: 'NZ',
    storefront: 'Pokémon Center New Zealand',
    domain: 'pokemoncenter.com/en-nz',
    localePath: '/en-nz',
    baseUrl: 'https://www.pokemoncenter.com/en-nz',
    catalogUrls: [
      'https://www.pokemoncenter.com/en-nz/category/trading-card-game',
      'https://www.pokemoncenter.com/en-nz/category/new-releases',
    ],
    dateLocale: 'en-NZ',
    dropWindow: 'Drops weekdays ~9 AM–12 PM NZST',
    releaseOffsetDays: 0,
  },
  {
    id: 'jp',
    label: 'Japan',
    code: 'JP',
    storefront: 'Pokémon Center Online',
    domain: 'pokemoncenter-online.com',
    localePath: '',
    baseUrl: 'https://www.pokemoncenter-online.com',
    catalogUrls: [
      'https://www.pokemoncenter-online.com/?main_page=list&cPath=90',
      'https://www.pokemoncenter-online.com/?main_page=new_arrival',
    ],
    dateLocale: 'ja-JP',
    dropWindow: 'Drops daily ~10 AM JST · JP sets run ~8 weeks ahead',
    releaseOffsetDays: -56,
  },
];

export const defaultRegionId: RegionId = 'ca';

export const getRegion = (id: RegionId): RegionConfig =>
  regions.find((region) => region.id === id) ?? regions[1];

const PC_URL_PATTERN = /^https:\/\/www\.pokemoncenter\.com(\/en-ca)?(\/.*)?$/;

/** Rewrites a canonical (en-ca) Pokémon Center URL onto the region's storefront. */
export function localizeUrl(url: string, region: RegionConfig): string {
  const match = url.match(PC_URL_PATTERN);
  if (!match) return url;
  const path = match[2] ?? '';

  if (region.id === 'jp') {
    // pokemoncenter-online.com has a different structure; deep product paths
    // don't translate, so fall back to its TCG search.
    const searchMatch = path.match(/^\/search\/(.+)$/);
    const productMatch = path.match(/^\/product\/[^/]+\/(.+)$/);
    const term = searchMatch?.[1] ?? productMatch?.[1];
    if (term) {
      const keyword = decodeURIComponent(term).replace(/-/g, ' ');
      return `https://www.pokemoncenter-online.com/?main_page=search&keyword=${encodeURIComponent(keyword)}`;
    }
    return region.baseUrl;
  }

  return `https://www.pokemoncenter.com${region.localePath}${path}`;
}

const shiftDate = (isoDate: string, days: number): string => {
  if (!days) return isoDate;
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/** Rewrites a catalog product's storefront URL and release timing for a region. */
export function localizeProduct(product: Product, region: RegionConfig): Product {
  return {
    ...product,
    url: localizeUrl(product.url, region),
    releaseDate: product.releaseDate
      ? shiftDate(product.releaseDate, region.releaseOffsetDays)
      : product.releaseDate,
  };
}
