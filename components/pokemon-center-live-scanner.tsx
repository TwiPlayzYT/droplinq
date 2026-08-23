import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { seededEtbs } from '@/data/historical-etbs';
import { localizeProduct, RegionConfig } from '@/data/regions';
import {
  classifyFormat,
  extractImageForProductId,
  extractProducts,
  looksBlockedHtml,
  normalizeImageUrl,
} from '@/lib/pokemon-center-parser';
import { Product, ProductAvailability, ProductFormat } from '@/types/dropdex';

const SAFARI_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';

/** How long to wait for one catalog page before treating it as stuck. */
const CATALOG_PAGE_TIMEOUT_MS = 20_000;

/**
 * Scan pacing. Pokémon Center sits behind Imperva bot protection; checking on
 * a fast, perfectly regular clock gets the device IP flagged, which then
 * blocks the user's real browser sessions too ("Oops! Something's gone
 * wrong… Trainer"). So cycles run slower with random jitter, and challenges
 * trigger an escalating cool-down instead of immediate retries.
 */
const BASE_CYCLE_MS = 45_000;
const MAX_BACKOFF_MS = 8 * 60_000;

const withJitter = (ms: number) => Math.round(ms * (0.8 + Math.random() * 0.4));

const EXTRACT_CATALOG_SCRIPT = `
(function () {
  var attempts = 0;
  var maxAttempts = 5;

  function blocked(html, title, bodyText) {
    var value = (html + ' ' + title + ' ' + bodyText).toLowerCase();
    return (
      value.indexOf('pardon our interruption') !== -1 ||
      value.indexOf('incapsula incident id') !== -1 ||
      value.indexOf('request unsuccessful') !== -1 ||
      value.indexOf('checking your browser before accessing') !== -1 ||
      value.indexOf("something's gone wrong") !== -1 ||
      value.indexOf('get you back on track, trainer') !== -1
    );
  }

  function absUrl(url) {
    if (!url) return '';
    url = String(url).trim();
    if (!url || url.indexOf('data:') === 0) return '';
    try {
      return new URL(url, location.href).href;
    } catch (e) {
      return url;
    }
  }

  function bestFromSrcset(srcset) {
    if (!srcset) return '';
    var best = '';
    var bestW = -1;
    String(srcset).split(',').forEach(function (part) {
      var bits = part.trim().split(/\\s+/);
      var url = bits[0] || '';
      var w = parseInt(String(bits[1] || '0').replace('w', ''), 10) || 0;
      if (url && w >= bestW) {
        bestW = w;
        best = url;
      }
    });
    return best;
  }

  function imageFromNode(node) {
    if (!node) return '';
    var img = node.querySelector
      ? node.querySelector('img, source, [style*="background-image"]')
      : null;
    if (!img && node.tagName && String(node.tagName).toLowerCase() === 'img') img = node;
    if (!img) return '';

    var url =
      absUrl(img.getAttribute('src')) ||
      absUrl(img.getAttribute('data-src')) ||
      absUrl(img.getAttribute('data-lazy-src')) ||
      absUrl(bestFromSrcset(img.getAttribute('srcset'))) ||
      absUrl(bestFromSrcset(img.getAttribute('data-srcset'))) ||
      absUrl(img.currentSrc);

    if (!url) {
      var style = String(img.getAttribute('style') || '');
      var bg = style.match(/url\\((['"]?)(.*?)\\1\\)/i);
      if (bg && bg[2]) url = absUrl(bg[2]);
    }
    return url;
  }

  function warmImages() {
    Array.prototype.forEach.call(document.querySelectorAll('img'), function (img) {
      try {
        img.loading = 'eager';
        var lazy =
          img.getAttribute('data-src') ||
          img.getAttribute('data-lazy-src') ||
          bestFromSrcset(img.getAttribute('data-srcset'));
        if (lazy && (!img.getAttribute('src') || img.getAttribute('src').indexOf('data:') === 0)) {
          img.setAttribute('src', lazy);
        }
      } catch (e) {}
    });
  }

  function collect() {
    try {
      warmImages();
      var root = document.querySelector('main') || document.body;
      var html = document.documentElement ? document.documentElement.outerHTML : '';
      var title = String(document.title || '');
      var bodyText = String((root && (root.innerText || root.textContent)) || '');

      if (blocked(html, title, bodyText)) {
        attempts += 1;
        if (attempts < maxAttempts) {
          setTimeout(collect, 450);
          return;
        }
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'blocked',
          href: String(location.href || ''),
          title: title,
          html: html.slice(0, 60000)
        }));
        return;
      }

      var products = [];
      var seen = {};
      var anchors = Array.prototype.slice.call(
        root.querySelectorAll('a[href*="/product/"]')
      );

      anchors.forEach(function (anchor) {
        var href = String(anchor.getAttribute('href') || '');
        var match = href.match(/\\/(?:[a-z]{2}-[a-z]{2}\\/)?product\\/([a-zA-Z0-9-]+)\\/([a-zA-Z0-9][a-zA-Z0-9-]*)/);
        if (!match) return;

        var id = match[1];
        if (seen[id]) return;
        seen[id] = true;

        var card =
          anchor.closest('article, li, [class*="product"], [class*="Product"], [data-testid]') ||
          anchor.parentElement;
        var cardText = String((card && (card.innerText || card.textContent)) || '').toLowerCase();
        var titleNode = card
          ? card.querySelector('h2, h3, [class*="title"], [class*="Title"], [class*="name"]')
          : null;
        var productTitle = String(
          (titleNode && (titleNode.innerText || titleNode.textContent)) ||
          anchor.getAttribute('aria-label') ||
          anchor.innerText ||
          ''
        ).trim();

        var imageUrl = imageFromNode(card) || imageFromNode(anchor);

        var availability = 'in-stock';
        if (
          cardText.indexOf('sold out') !== -1 ||
          cardText.indexOf('out of stock') !== -1 ||
          cardText.indexOf('currently unavailable') !== -1
        ) {
          availability = 'sold-out';
        }

        products.push({
          id: id,
          slug: match[2],
          title: productTitle,
          url: absUrl(href.split('?')[0]),
          imageUrl: imageUrl,
          availability: availability
        });
      });

      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'catalog',
        href: String(location.href || ''),
        title: title,
        html: html.slice(0, 280000),
        products: products
      }));
    } catch (error) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'error',
        message: String(error && error.message ? error.message : error)
      }));
    }
  }

  setTimeout(collect, 700);
})();
true;
`;

type ScannerStatus = {
  state: 'idle' | 'polling' | 'ok' | 'error';
  observedCount: number;
  lastCheckedAt?: string;
  message: string;
  progress?: number;
};

type CatalogProductPayload = {
  id: string;
  slug: string;
  title: string;
  url: string;
  imageUrl?: string;
  availability?: ProductAvailability;
};

type PagePayload = {
  type: 'catalog' | 'blocked' | 'error';
  href?: string;
  title?: string;
  html?: string;
  products?: CatalogProductPayload[];
  message?: string;
};

type Props = {
  enabled: boolean;
  region: RegionConfig;
  onStatus: (status: ScannerStatus) => void;
  onProducts: (products: Product[]) => void | Promise<void>;
  reportObservations: (products: Product[]) => Promise<void>;
};

const titleFromSlug = (slug: string) =>
  slug
    .split('-')
    .filter(Boolean)
    .map((word) =>
      word.length <= 3 ? word.toUpperCase() : `${word[0].toUpperCase()}${word.slice(1)}`,
    )
    .join(' ')
    .replaceAll(' And ', ' & ');

function toProduct(payload: CatalogProductPayload): Product | null {
  const title = payload.title?.trim() || titleFromSlug(payload.slug);
  const format = classifyFormat(title) as ProductFormat | undefined;
  if (!format) return null;
  const now = new Date().toISOString();

  return {
    id: payload.id,
    title,
    category: 'Trading Card Game',
    format,
    releaseType:
      title.toLowerCase().includes('preorder') || title.toLowerCase().includes('pre-order')
        ? 'preorder'
        : 'new',
    url: payload.url,
    imageUrl: normalizeImageUrl(payload.imageUrl),
    availability: payload.availability === 'sold-out' ? 'sold-out' : 'in-stock',
    soldOutAt: payload.availability === 'sold-out' ? now : undefined,
    lastSeenAt: now,
    detectedAt: now,
    tags: ['tcg', format],
  };
}

function applyAvailabilityTransition(
  existing: Product | undefined,
  nextAvailability: ProductAvailability,
  now: string,
): Pick<Product, 'availability' | 'soldOutAt'> {
  if (nextAvailability === 'sold-out') {
    return {
      availability: 'sold-out',
      soldOutAt:
        existing?.availability === 'sold-out' && existing.soldOutAt
          ? existing.soldOutAt
          : now,
    };
  }

  return {
    availability: 'in-stock',
    soldOutAt: undefined,
  };
}

export function PokemonCenterLiveScanner({
  enabled,
  region,
  onStatus,
  onProducts,
  reportObservations,
}: Props) {
  const catalogUrls = region.catalogUrls;
  const [catalogIndex, setCatalogIndex] = useState(0);
  const [scanKey, setScanKey] = useState(0);
  const productsRef = useRef(new Map<string, Product>());
  const seenThisCycleRef = useRef(new Set<string>());
  const catalogHitsRef = useRef(0);
  const challengeRef = useRef(false);
  const pageErrorRef = useRef(false);
  const handledRef = useRef(false);
  const cycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const publishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seededRef = useRef(false);
  const initialLoadCompleteRef = useRef(false);
  const consecutiveFailuresRef = useRef(0);

  const clearPageTimeout = () => {
    if (pageTimeoutRef.current) {
      clearTimeout(pageTimeoutRef.current);
      pageTimeoutRef.current = null;
    }
  };

  const armPageTimeout = () => {
    clearPageTimeout();
    pageTimeoutRef.current = setTimeout(() => {
      if (handledRef.current) return;
      handledRef.current = true;
      pageErrorRef.current = true;
      onStatus({
        state: 'polling',
        observedCount: productsRef.current.size,
        message: `${region.storefront} is taking longer than usual…`,
        progress: initialLoadCompleteRef.current ? 100 : catalogIndex === 0 ? 40 : 70,
      });
      void advanceCatalog();
    }, CATALOG_PAGE_TIMEOUT_MS);
  };

  const publishNow = async (
    statusMessage?: string,
    state: ScannerStatus['state'] = 'polling',
    progress?: number,
  ) => {
    const products = [...productsRef.current.values()];
    await onProducts(products);
    if (statusMessage) {
      onStatus({
        state,
        observedCount: products.length,
        lastCheckedAt: new Date().toISOString(),
        message: statusMessage,
        progress,
      });
    }
  };

  const schedulePublish = (statusMessage?: string, progress?: number) => {
    if (publishTimerRef.current) clearTimeout(publishTimerRef.current);
    publishTimerRef.current = setTimeout(() => {
      void publishNow(statusMessage, 'polling', progress);
    }, 16);
  };

  const ensureSeed = () => {
    const now = new Date().toISOString();
    seededEtbs.map((seed) => localizeProduct(seed, region)).forEach((product) => {
      const existing = productsRef.current.get(product.id);
      if (!existing) {
        productsRef.current.set(product.id, {
          ...product,
          historical: false,
          availability: product.availability ?? 'sold-out',
          soldOutAt: product.soldOutAt,
          lastSeenAt: product.lastSeenAt,
          detectedAt: product.detectedAt || now,
        });
        return;
      }

      productsRef.current.set(product.id, {
        ...existing,
        imageUrl: product.imageUrl || existing.imageUrl,
        historical: false,
        pcCategoryId: product.pcCategoryId ?? existing.pcCategoryId,
        releaseDate: product.releaseDate ?? existing.releaseDate,
        releaseType: product.releaseType ?? existing.releaseType,
        soldOutAt: product.soldOutAt ?? existing.soldOutAt,
      });
    });
  };

  const startCycle = () => {
    ensureSeed();
    seenThisCycleRef.current = new Set();
    catalogHitsRef.current = 0;
    challengeRef.current = false;
    pageErrorRef.current = false;
    handledRef.current = false;
    setCatalogIndex(0);
    setScanKey((value) => value + 1);
    onStatus({
      state: 'polling',
      observedCount: productsRef.current.size,
      message: `Opening ${region.storefront} catalog…`,
      progress: initialLoadCompleteRef.current ? 100 : 12,
    });
    armPageTimeout();

    if (!seededRef.current) {
      seededRef.current = true;
      void publishNow('Loading stock…', 'polling', 20);
    }
  };

  // Region switch: drop everything from the old storefront and rescan fresh.
  const regionRef = useRef(region.id);
  if (regionRef.current !== region.id) {
    regionRef.current = region.id;
    productsRef.current = new Map();
    seededRef.current = false;
    initialLoadCompleteRef.current = false;
    consecutiveFailuresRef.current = 0;
  }

  useEffect(() => {
    if (!enabled) {
      seededRef.current = false;
      initialLoadCompleteRef.current = false;
      consecutiveFailuresRef.current = 0;
      onStatus({
        state: 'idle',
        observedCount: 0,
        message: 'Live monitor standby',
        progress: 0,
      });
      return;
    }

    ensureSeed();
    startCycle();
    return () => {
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
      if (publishTimerRef.current) clearTimeout(publishTimerRef.current);
      clearPageTimeout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, region.id]);

  if (!enabled) return null;

  const finishCycle = async () => {
    clearPageTimeout();
    const now = new Date().toISOString();
    const reliablePass = catalogHitsRef.current > 0 && !challengeRef.current && !pageErrorRef.current;

    // Only flip missing items to sold out after a confirmed good catalog pass.
    // Every seeded product is watched — older drops can return to stock.
    if (reliablePass) {
      productsRef.current.forEach((product, id) => {
        if (seenThisCycleRef.current.has(id)) return;
        if (product.availability === 'in-stock') {
          productsRef.current.set(id, {
            ...product,
            historical: false,
            availability: 'sold-out',
            soldOutAt: now,
            detectedAt: now,
          });
        }
      });
    }

    const products = [...productsRef.current.values()];
    const inStock = products.filter((product) => product.availability === 'in-stock').length;
    const soldOut = products.filter((product) => product.availability === 'sold-out').length;

    await onProducts(products);
    await reportObservations(products).catch(() => undefined);

    consecutiveFailuresRef.current = reliablePass
      ? 0
      : consecutiveFailuresRef.current + 1;
    const nextDelay = reliablePass
      ? withJitter(BASE_CYCLE_MS)
      : withJitter(
          Math.min(
            BASE_CYCLE_MS * 2 ** consecutiveFailuresRef.current,
            MAX_BACKOFF_MS,
          ),
        );
    const coolDownLabel = `Cooling down ~${Math.max(1, Math.round(nextDelay / 60_000))} min so the store unblocks`;

    if (reliablePass) {
      onStatus({
        state: 'ok',
        observedCount: products.length,
        lastCheckedAt: now,
        message: `Live: ${inStock} in stock · ${soldOut} sold out`,
        progress: 100,
      });
    } else if (challengeRef.current) {
      onStatus({
        state: 'error',
        observedCount: products.length,
        lastCheckedAt: now,
        message: `Store security check · ${coolDownLabel}`,
        progress: 100,
      });
    } else if (pageErrorRef.current) {
      onStatus({
        state: 'error',
        observedCount: products.length,
        lastCheckedAt: now,
        message: `Could not refresh live stock · ${coolDownLabel}`,
        progress: 100,
      });
    } else {
      onStatus({
        state: 'error',
        observedCount: products.length,
        lastCheckedAt: now,
        message: 'No live catalog matches · showing saved products',
        progress: 100,
      });
    }

    initialLoadCompleteRef.current = true;
    cycleTimerRef.current = setTimeout(startCycle, nextDelay);
  };

  const advanceCatalog = async () => {
    clearPageTimeout();
    if (catalogIndex < catalogUrls.length - 1) {
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
      // Human-ish pause between catalog pages instead of an instant hop.
      cycleTimerRef.current = setTimeout(() => {
        handledRef.current = false;
        setCatalogIndex((value) => value + 1);
        setScanKey((value) => value + 1);
        armPageTimeout();
      }, withJitter(2_000));
      return;
    }

    await finishCycle();
  };

  const mergeFound = (found: Product[]) => {
    const now = new Date().toISOString();
    found.forEach((raw) => {
      const product = localizeProduct(raw, region);
      const existing = productsRef.current.get(product.id);
      const transition = applyAvailabilityTransition(
        existing,
        product.availability === 'sold-out' ? 'sold-out' : 'in-stock',
        now,
      );

      productsRef.current.set(product.id, {
        ...existing,
        ...product,
        ...transition,
        historical: false,
        releaseDate: existing?.releaseDate ?? product.releaseDate,
        imageUrl: product.imageUrl || existing?.imageUrl,
        lastSeenAt: now,
        detectedAt: now,
      });
      seenThisCycleRef.current.add(product.id);
      catalogHitsRef.current += 1;
    });
  };

  const handleMessage = async (event: WebViewMessageEvent) => {
    if (handledRef.current) return;

    try {
      const payload = JSON.parse(event.nativeEvent.data) as PagePayload;
      handledRef.current = true;
      clearPageTimeout();

      if (payload.type === 'error') {
        pageErrorRef.current = true;
        await advanceCatalog();
        return;
      }

      if (payload.type === 'blocked' || looksBlockedHtml(payload.html ?? '')) {
        // Stop the cycle immediately — hitting more catalog pages while
        // Imperva is already blocking just digs a deeper hole for the IP.
        challengeRef.current = true;
        await finishCycle();
        return;
      }

      const html = payload.html ?? '';
      const fromDom = (payload.products ?? [])
        .map(toProduct)
        .filter((product): product is Product => Boolean(product))
        .map((product) => ({
          ...product,
          imageUrl:
            product.imageUrl ||
            extractImageForProductId(html, product.id) ||
            undefined,
        }));

      // The full-HTML regex parse is expensive (280 KB on the JS thread), so
      // only fall back to it when the in-page DOM extraction came up empty.
      const fromHtml =
        fromDom.length > 0
          ? []
          : extractProducts(html).map((product) => ({
              ...product,
              availability: 'in-stock' as const,
              imageUrl: product.imageUrl || extractImageForProductId(html, product.id),
              lastSeenAt: new Date().toISOString(),
            }));

      const merged = new Map<string, Product>();
      [...fromHtml, ...fromDom].forEach((product) => {
        const existing = merged.get(product.id);
        merged.set(product.id, {
          ...existing,
          ...product,
          imageUrl: normalizeImageUrl(product.imageUrl || existing?.imageUrl),
          availability:
            product.availability === 'sold-out' || existing?.availability === 'sold-out'
              ? 'sold-out'
              : 'in-stock',
        });
      });

      mergeFound([...merged.values()]);
      schedulePublish(
        catalogHitsRef.current > 0
          ? `Updated ${catalogHitsRef.current} products`
          : `Reading ${region.storefront}…`,
        initialLoadCompleteRef.current ? 100 : catalogIndex === 0 ? 55 : 88,
      );
      await advanceCatalog();
    } catch {
      handledRef.current = true;
      pageErrorRef.current = true;
      clearPageTimeout();
      await advanceCatalog();
    }
  };

  return (
    <View pointerEvents="none" style={styles.hidden}>
      <WebView
        key={`${region.id}-${scanKey}-catalog-${catalogIndex}`}
        source={{ uri: catalogUrls[Math.min(catalogIndex, catalogUrls.length - 1)] }}
        onMessage={handleMessage}
        onError={() => {
          if (handledRef.current) return;
          handledRef.current = true;
          pageErrorRef.current = true;
          clearPageTimeout();
          void advanceCatalog();
        }}
        onHttpError={() => {
          if (handledRef.current) return;
          handledRef.current = true;
          pageErrorRef.current = true;
          clearPageTimeout();
          void advanceCatalog();
        }}
        injectedJavaScript={EXTRACT_CATALOG_SCRIPT}
        javaScriptEnabled
        domStorageEnabled
        // Keep the scanner's cookies out of Safari / SFSafariViewController.
        // When Imperva flags the monitor it sets block cookies; sharing them
        // with the system browser is what made "Oops, Trainer" appear on
        // every region when the user opened a product.
        sharedCookiesEnabled={false}
        thirdPartyCookiesEnabled={false}
        setSupportMultipleWindows={false}
        originWhitelist={['*']}
        userAgent={SAFARI_UA}
        style={styles.hidden}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: {
    height: 2,
    opacity: 0,
    overflow: 'hidden',
    position: 'absolute',
    width: 2,
    zIndex: -1,
  },
});
