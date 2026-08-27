import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import Reanimated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import {
  BrandHeader,
  ChoiceChip,
  MetalButton,
  Panel,
  Screen,
} from '@/components/dropdex-ui';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function animateLayout() {
  if (Platform.OS === 'web') return;
  LayoutAnimation.configureNext({
    duration: 260,
    create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    update: { type: LayoutAnimation.Types.easeInEaseOut },
    delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
  });
}
import { palette } from '@/constants/dropdex';
import { coverageModeCopy } from '@/data/pokemon-center-filters';
import { getRegion } from '@/data/regions';
import {
  categoryNamesForProduct,
  matchesCatalogCoverage,
  matchesFilters,
  signalsFromLegacyProduct,
} from '@/lib/filter-matcher';
import { useWebLayout } from '@/hooks/use-web-layout';
import { useDropDex } from '@/store/dropdex-context';
import { CatalogStockEvent, StockEventKind } from '@/types/catalog';
import { Product, ProductAvailability, RegionId } from '@/types/dropdex';

type CatalogViewFilter = 'all' | 'in-stock' | 'sold-out' | 'new' | 'preorder';

type StockProduct = Product & {
  price?: number | null;
  currency?: string | null;
  retailerName?: string;
  regionName?: string;
  lastCheckedAt?: string;
};

const REGION_FLAG: Record<RegionId, string> = {
  us: '🇺🇸',
  ca: '🇨🇦',
  uk: '🇬🇧',
  de: '🇩🇪',
  au: '🇦🇺',
  nz: '🇳🇿',
  jp: '🇯🇵',
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function formatRelativeTime(iso?: string | null) {
  if (!iso) return null;
  const age = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(age) || age < 0) return null;
  if (age < 12_000) return 'just now';
  if (age < 60_000) return `${Math.max(1, Math.round(age / 1000))} sec ago`;
  if (age < 3_600_000) return `${Math.max(1, Math.round(age / 60_000))} min ago`;
  if (age < 86_400_000) return `${Math.max(1, Math.round(age / 3_600_000))} hr ago`;
  return `${Math.max(1, Math.round(age / 86_400_000))}d ago`;
}

function matchesSearch(product: Product, query: string) {
  if (!query) return true;
  const categories = categoryNamesForProduct(product);
  const haystack = [product.title, product.id, ...product.tags, ...categories]
    .join(' ')
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

function isRecentlySoldOut(product: Product) {
  if (product.availability !== 'sold-out' || !product.soldOutAt) return false;
  const age = Date.now() - new Date(product.soldOutAt).getTime();
  return age >= 0 && age <= WEEK_MS;
}

function eventAllowed(kind: StockEventKind, filters: ReturnType<typeof useDropDex>['filters']) {
  if (kind === 'restock') return filters.includeRestocks;
  if (kind === 'new_product' || kind === 'coming_soon') return filters.includeNewReleases;
  if (kind === 'preorder') return filters.includePreorders;
  return true;
}

function eventCopy(kind: StockEventKind) {
  switch (kind) {
    case 'restock':
      return { label: 'RESTOCKED', tone: 'red' as const, icon: 'refresh' as const };
    case 'new_product':
      return { label: 'NEW RELEASE', tone: 'new' as const, icon: 'sparkles' as const };
    case 'preorder':
      return { label: 'PREORDER OPEN', tone: 'preorder' as const, icon: 'time' as const };
    case 'coming_soon':
      return { label: 'COMING SOON', tone: 'preorder' as const, icon: 'hourglass' as const };
    case 'sold_out':
    default:
      return { label: 'SOLD OUT', tone: 'muted' as const, icon: 'close-circle' as const };
  }
}

function ProductThumbnail({ product, size = 72 }: { product: Product; size?: number }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!product.imageUrl || failed) {
    return <Ionicons color={palette.whiteShadow} name="image-outline" size={22} />;
  }

  return (
    <>
      {!loaded ? (
        <View style={styles.thumbLoader}>
          <ActivityIndicator color={palette.red} size="small" />
        </View>
      ) : null}
      <Image
        cachePolicy="memory-disk"
        contentFit="cover"
        onError={() => setFailed(true)}
        onLoad={() => setLoaded(true)}
        recyclingKey={product.id}
        source={{ uri: product.imageUrl }}
        style={[{ height: size, width: size }, !loaded && styles.thumbHidden]}
        transition={0}
      />
    </>
  );
}

const LiveProductCard = memo(function LiveProductCard({
  onDetails,
  onOpen,
  product,
  regionLabel,
  storefront,
}: {
  onDetails: (product: Product) => void;
  onOpen: (product: Product) => void;
  product: StockProduct;
  regionLabel: string;
  storefront: string;
}) {
  const category = categoryNamesForProduct(product)[0] ?? product.category;
  const detected = formatRelativeTime(product.lastSeenAt ?? product.detectedAt);
  const price =
    product.price != null
      ? `$${Number(product.price).toFixed(2)} ${product.currency ?? 'CAD'}`
      : null;

  return (
    <Pressable
      unstable_pressDelay={0}
      onPress={() => onDetails(product)}
      style={({ pressed }) => [styles.cardShadow, pressed && styles.pressed]}>
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.thumbWell}>
            <ProductThumbnail product={product} />
          </View>
          <View style={styles.cardCopy}>
            <Text numberOfLines={1} style={styles.eyebrow}>
              {category.toUpperCase()}
            </Text>
            <Text numberOfLines={3} style={styles.cardTitle}>
              {product.title}
            </Text>
            <Text style={styles.metaLine}>
              {product.retailerName ?? storefront} · {product.regionName ?? regionLabel}
            </Text>
            {price ? <Text style={styles.price}>{price}</Text> : null}
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>IN STOCK</Text>
            </View>
            {detected ? <Text style={styles.subtle}>Detected {detected}</Text> : null}
          </View>
        </View>
        <Pressable
          unstable_pressDelay={0}
          accessibilityRole="button"
          onPress={() => onOpen(product)}
          style={({ pressed }) => [styles.openBtn, pressed && styles.pressed]}>
          <Text style={styles.openBtnText}>OPEN PRODUCT</Text>
          <Ionicons color={palette.black} name="open-outline" size={16} />
        </Pressable>
      </View>
    </Pressable>
  );
});

const CatalogProductCard = memo(function CatalogProductCard({
  onOpen,
  product,
}: {
  onOpen: (product: Product) => void;
  product: StockProduct;
}) {
  const inStock = product.availability === 'in-stock';
  const category = categoryNamesForProduct(product)[0] ?? product.category;
  const lastSeenStamp = product.lastSeenAt ?? product.soldOutAt;
  const lastSeen = formatRelativeTime(lastSeenStamp);
  const checked = formatRelativeTime(product.lastCheckedAt ?? product.detectedAt);
  const price =
    product.price != null
      ? `$${Number(product.price).toFixed(2)} ${product.currency ?? 'CAD'}`
      : null;

  return (
    <Pressable
      unstable_pressDelay={0}
      onPress={() => onOpen(product)}
      style={({ pressed }) => [styles.cardShadow, pressed && styles.pressed]}>
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={[styles.thumbWell, styles.thumbSm]}>
            <ProductThumbnail product={product} size={56} />
          </View>
          <View style={styles.cardCopy}>
            <Text numberOfLines={1} style={styles.eyebrow}>
              {category.toUpperCase()}
            </Text>
            <Text numberOfLines={2} style={styles.cardTitleSm}>
              {product.title}
            </Text>
            <View style={[styles.statusPill, inStock ? styles.statusLive : styles.statusSold]}>
              <View style={[styles.statusDot, inStock ? styles.liveDot : styles.soldDot]} />
              <Text style={styles.statusPillText}>{inStock ? 'IN STOCK' : 'SOLD OUT'}</Text>
            </View>
            {inStock && price ? <Text style={styles.price}>{price}</Text> : null}
            {inStock && checked ? (
              <Text style={styles.subtle}>Last updated {checked}</Text>
            ) : null}
            {!inStock && lastSeen ? (
              <Text style={styles.subtle}>Last seen in stock {lastSeen}</Text>
            ) : null}
            {!inStock && !lastSeen ? (
              <Text style={styles.subtle}>Not observed in stock yet</Text>
            ) : null}
          </View>
          <Ionicons color={palette.blackSoft} name="chevron-forward" size={18} />
        </View>
      </View>
    </Pressable>
  );
});

function ActivityRow({
  event,
  onPress,
  product,
}: {
  event: CatalogStockEvent;
  onPress: () => void;
  product?: StockProduct;
}) {
  const copy = eventCopy(event.kind);
  const when = formatRelativeTime(event.detectedAt) ?? 'recently';

  return (
    <Pressable
      unstable_pressDelay={0}
      onPress={onPress}
      style={({ pressed }) => [styles.cardShadow, pressed && styles.pressed]}>
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={[styles.thumbWell, styles.thumbSm]}>
            {product ? (
              <ProductThumbnail product={product} size={56} />
            ) : (
              <Ionicons color={palette.whiteShadow} name="image-outline" size={20} />
            )}
          </View>
          <View style={styles.cardCopy}>
            <Text
              style={[
                styles.activityKind,
                copy.tone === 'red' && styles.kindRed,
                copy.tone === 'new' && styles.kindNew,
                copy.tone === 'preorder' && styles.kindPreorder,
                copy.tone === 'muted' && styles.kindMuted,
              ]}>
              {copy.label}
            </Text>
            <Text numberOfLines={2} style={styles.cardTitleSm}>
              {event.productName}
            </Text>
            <Text style={styles.activityMeta}>
              {event.retailerName} · {when}
            </Text>
          </View>
          <Ionicons color={palette.blackSoft} name="chevron-forward" size={18} />
        </View>
      </View>
    </Pressable>
  );
}

function CompactEmpty({
  caption,
  light = false,
  title,
}: {
  caption: string;
  light?: boolean;
  title: string;
}) {
  return (
    <View style={styles.compactEmpty}>
      <Ionicons color={palette.red} name="cube-outline" size={22} />
      <Text style={[styles.compactEmptyTitle, light && styles.compactEmptyTitleLight]}>
        {title}
      </Text>
      <Text style={[styles.compactEmptyCaption, light && styles.compactEmptyCaptionLight]}>
        {caption}
      </Text>
    </View>
  );
}

function SkeletonBlock() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonThumb} />
      <View style={styles.skeletonLines}>
        <View style={[styles.skeletonLine, { width: '42%' }]} />
        <View style={[styles.skeletonLine, { width: '88%' }]} />
        <View style={[styles.skeletonLine, { width: '64%' }]} />
      </View>
    </View>
  );
}

function CollapsibleSection({
  count,
  expanded,
  onToggle,
  title,
  children,
}: {
  count?: number | string;
  expanded: boolean;
  onToggle: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.collapseBlock}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        unstable_pressDelay={0}
        onPress={() => {
          animateLayout();
          onToggle();
        }}
        style={({ pressed }) => [styles.sectionHead, styles.sectionHeadPressable, pressed && styles.pressed]}>
        <View style={styles.sectionHeadLeft}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Ionicons
            color={palette.whiteDim}
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
          />
        </View>
        {count != null ? <Text style={styles.sectionCount}>{count}</Text> : null}
      </Pressable>
      {expanded ? (
        <Reanimated.View entering={FadeInDown.duration(220)} exiting={FadeOutUp.duration(160)}>
          {children}
        </Reanimated.View>
      ) : null}
    </View>
  );
}

export default function StockScreen() {
  const {
    catalogLoading,
    filters,
    lastBackendUpdate,
    liveProducts,
    liveStatus,
    monitoring,
    openProductBrowser,
    refreshCatalog,
    region,
    stockEvents,
  } = useDropDex();
  const router = useRouter();
  const { isDesktopWeb, contentColumns } = useWebLayout();
  const [query, setQuery] = useState('');
  const [viewFilter, setViewFilter] = useState<CatalogViewFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [liveOpen, setLiveOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const regionConfig = getRegion(region);
  const coverage = coverageModeCopy[filters.coverageMode];
  const pulse = useRef(new Animated.Value(0.35)).current;

  const customEmpty =
    filters.coverageMode === 'CUSTOM' &&
    filters.customCategoryIds.length === 0 &&
    !filters.includeOtherTcgProducts;

  useEffect(() => {
    if (query.trim()) {
      setSearchOpen(true);
      setCatalogOpen(true);
    }
  }, [query]);

  // Desktop web opens key sections so the full-width site feels populated (native stays collapsed).
  useEffect(() => {
    if (!isDesktopWeb) return;
    setSearchOpen(true);
    setLiveOpen(true);
    setActivityOpen(true);
    setCatalogOpen(true);
  }, [isDesktopWeb]);

  useEffect(() => {
    if (!monitoring) {
      pulse.setValue(0.35);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          toValue: 0.35,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [monitoring, pulse]);

  const matchingProducts = useMemo(
    () =>
      (liveProducts as StockProduct[])
        .filter((product) => matchesFilters(product, filters))
        .sort((a, b) => a.title.localeCompare(b.title)),
    [filters, liveProducts],
  );

  /** Full coverage set for Catalog — ignores new/restock/preorder alert toggles. */
  const coverageProducts = useMemo(
    () =>
      (liveProducts as StockProduct[])
        .filter((product) => matchesCatalogCoverage(product, filters))
        .sort((a, b) => {
          const dateCmp = (b.releaseDate ?? '').localeCompare(a.releaseDate ?? '');
          if (dateCmp) return dateCmp;
          return a.title.localeCompare(b.title);
        }),
    [filters, liveProducts],
  );

  const liveNow = useMemo(
    () => matchingProducts.filter((product) => product.availability === 'in-stock'),
    [matchingProducts],
  );

  const activity = useMemo(() => {
    const coverageById = new Map(coverageProducts.map((product) => [product.id, product]));

    const fromBackend = stockEvents
      .filter((event) => eventAllowed(event.kind, filters))
      .filter((event) => {
        if (coverageById.has(event.productId)) return true;
        const raw = liveProducts.find((item) => item.id === event.productId);
        return raw ? matchesCatalogCoverage(raw, filters) : false;
      })
      .sort((a, b) => {
        const heat = (kind: StockEventKind) =>
          kind === 'restock' ? 3 : kind === 'sold_out' ? 2 : kind === 'new_product' ? 1 : 0;
        const heatCmp = heat(b.kind) - heat(a.kind);
        if (heatCmp) return heatCmp;
        return b.detectedAt.localeCompare(a.detectedAt);
      });

    if (fromBackend.length > 0) return fromBackend.slice(0, 6);

    // Rank coverage products by restock heat: popular formats + recent stock movement.
    const ranked = [...coverageProducts]
      .map((product) => {
        const signals = signalsFromLegacyProduct(product);
        let heat = 0;
        if (signals.isPopular) heat += 120;
        if (product.format === 'etb' || product.format === 'upc') heat += 50;
        if (product.format === 'booster-box') heat += 25;
        if (product.availability === 'in-stock') heat += 70;
        if (isRecentlySoldOut(product)) heat += 90;
        const stamp = product.soldOutAt ?? product.lastSeenAt ?? product.detectedAt;
        const ageHours = Math.max(0, (Date.now() - new Date(stamp).getTime()) / 3_600_000);
        heat += Math.max(0, 48 - ageHours);
        if (product.releaseType === 'preorder') heat += 20;
        return { product, heat, stamp };
      })
      .filter(({ heat }) => heat >= 40)
      .sort((a, b) => b.heat - a.heat || b.stamp.localeCompare(a.stamp))
      .slice(0, 6);

    return ranked.map(({ product, stamp }) => {
      const kind: StockEventKind =
        product.availability === 'in-stock'
          ? product.releaseType === 'preorder'
            ? 'preorder'
            : 'restock'
          : 'sold_out';
      return {
        id: `heat-${product.id}`,
        productId: product.id,
        productName: product.title,
        retailerName: product.retailerName ?? regionConfig.storefront,
        regionName: product.regionName ?? regionConfig.label,
        kind: eventAllowed(kind, filters) ? kind : 'sold_out',
        newStatus:
          product.availability === 'in-stock' ? ('in-stock' as const) : ('out-of-stock' as const),
        detectedAt: stamp,
        verificationStatus: 'unverified' as const,
        confidenceScore: 0,
        source: 'restock-heat',
        dataSource: 'mock' as const,
      };
    });
  }, [
    coverageProducts,
    filters,
    liveProducts,
    regionConfig.label,
    regionConfig.storefront,
    stockEvents,
  ]);

  const productsById = useMemo(
    () => new Map(coverageProducts.map((product) => [product.id, product])),
    [coverageProducts],
  );

  const catalogProducts = useMemo(() => {
    let list = coverageProducts.filter((product) => matchesSearch(product, query));
    if (viewFilter === 'in-stock') {
      list = list.filter((product) => product.availability === 'in-stock');
    } else if (viewFilter === 'sold-out') {
      list = list.filter((product) => product.availability !== 'in-stock');
    } else if (viewFilter === 'new') {
      list = list.filter((product) => product.releaseType === 'new');
    } else if (viewFilter === 'preorder') {
      list = list.filter((product) => product.releaseType === 'preorder');
    }
    return list;
  }, [coverageProducts, query, viewFilter]);

  const watchedCountLabel = customEmpty
    ? 'Pick categories in Filter'
    : filters.coverageMode === 'CUSTOM'
      ? `${filters.customCategoryIds.length} types`
      : `${coverageProducts.length} tracked`;

  const lastUpdateIso =
    lastBackendUpdate ?? liveStatus.lastCheckedAt ?? null;
  const relativeUpdate = formatRelativeTime(lastUpdateIso);

  // Catalog load failure only — cloud push registration errors must not block Stock.
  const catalogFailed = liveStatus.state === 'error';

  const statusLine = !monitoring
    ? `Off · ${watchedCountLabel}`
    : catalogLoading
      ? `Checking… · ${watchedCountLabel}`
      : catalogFailed
        ? `Catalog offline · ${watchedCountLabel}`
        : `${liveNow.length} in stock · ${watchedCountLabel}${
            relativeUpdate ? ` · ${relativeUpdate}` : ''
          }`;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshCatalog();
    } finally {
      setRefreshing(false);
    }
  }, [refreshCatalog]);

  const openDetails = (product: Product) => router.push(`/product/${product.id}`);
  const showSkeletons = catalogLoading && coverageProducts.length === 0 && !customEmpty;

  return (
    <Screen wide onRefresh={onRefresh} refreshing={refreshing}>
      <BrandHeader eyebrow={regionConfig.label} />

      <Pressable
        unstable_pressDelay={0}
        accessibilityHint="Opens Filter tab"
        onPress={() => router.push('/(tabs)/filter')}
        style={({ pressed }) => [styles.coverageShadow, pressed && styles.pressed]}>
        <View style={styles.coverageCard}>
          <Animated.View
            style={[
              styles.heartbeatLamp,
              monitoring && !catalogFailed && styles.heartbeatOn,
              { opacity: monitoring && !catalogFailed ? pulse : 0.4 },
            ]}
          />
          <View style={styles.coverageCopy}>
            <Text numberOfLines={1} style={styles.coverageTitle}>
              {REGION_FLAG[region]} {coverage.title}
            </Text>
            <Text numberOfLines={1} style={styles.statusLine}>
              {statusLine}
            </Text>
          </View>
          <Ionicons color={palette.blackSoft} name="options-outline" size={20} />
        </View>
      </Pressable>

      {catalogFailed && coverageProducts.length === 0 ? (
        <Pressable
          unstable_pressDelay={0}
          onPress={() => void refreshCatalog()}
          style={({ pressed }) => [styles.slimError, pressed && styles.pressed]}>
          <Text style={styles.slimErrorText}>Couldn&apos;t refresh catalog · Tap to retry</Text>
        </Pressable>
      ) : null}

      {isDesktopWeb ? (
        <View style={styles.webHero}>
          <View style={styles.webHeroCopy}>
            <Text style={styles.webHeroKicker}>LIVE MONITORING</Text>
            <Text style={styles.webHeroTitle}>Stock command center</Text>
            <Text style={styles.webHeroBody}>{statusLine}</Text>
          </View>
          <View style={styles.webHeroAside}>
            <Text style={styles.webHeroStat}>{liveNow.length}</Text>
            <Text style={styles.webHeroStatLabel}>IN STOCK NOW</Text>
          </View>
        </View>
      ) : null}

      {!searchOpen ? (
        <Pressable
          accessibilityHint="Opens product search"
          accessibilityRole="button"
          unstable_pressDelay={0}
          onPress={() => {
            animateLayout();
            setSearchOpen(true);
            requestAnimationFrame(() => searchInputRef.current?.focus());
          }}
          style={({ pressed }) => [styles.searchCollapsed, pressed && styles.pressed]}>
          <Ionicons color={palette.blackSoft} name="search" size={18} />
          <Text style={styles.searchCollapsedText}>Search products</Text>
        </Pressable>
      ) : (
        <Reanimated.View entering={FadeInDown.duration(200)} style={styles.searchExpanded}>
          <View style={styles.searchWell}>
            <Ionicons color={palette.blackSoft} name="search" size={18} />
            <TextInput
              ref={searchInputRef}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              clearButtonMode="while-editing"
              onChangeText={setQuery}
              placeholder="Search monitored products…"
              placeholderTextColor={palette.whiteShadow}
              returnKeyType="search"
              style={styles.searchInput}
              value={query}
            />
            <Pressable
              accessibilityLabel="Close search"
              hitSlop={10}
              unstable_pressDelay={0}
              onPress={() => {
                animateLayout();
                setQuery('');
                setViewFilter('all');
                setSearchOpen(false);
              }}>
              <Ionicons color={palette.blackSoft} name="close-circle" size={20} />
            </Pressable>
          </View>
          <View style={styles.chips}>
            {(
              [
                ['all', 'All'],
                ['in-stock', 'In stock'],
                ['sold-out', 'Sold out'],
                ['new', 'New'],
                ['preorder', 'Preorder'],
              ] as const
            ).map(([id, label]) => (
              <ChoiceChip
                key={id}
                label={label}
                onPress={() => setViewFilter(id)}
                selected={viewFilter === id}
              />
            ))}
          </View>
        </Reanimated.View>
      )}

      <CollapsibleSection
        count={liveNow.length}
        expanded={liveOpen}
        onToggle={() => setLiveOpen((value) => !value)}
        title="🔴 LIVE NOW">
        {customEmpty ? (
          <Panel>
            <CompactEmpty
              caption="Choose Custom categories in Filter to start tracking products."
              light
              title="Nothing to show"
            />
            <MetalButton
              icon="options-outline"
              label="Open Filter"
              onPress={() => router.push('/(tabs)/filter')}
            />
          </Panel>
        ) : showSkeletons ? (
          <>
            <SkeletonBlock />
            <SkeletonBlock />
          </>
        ) : liveNow.length === 0 ? (
          <Panel>
            <CompactEmpty
              caption="DropLinq is monitoring your selected Pokémon Center products."
              light
              title="Nothing in stock"
            />
          </Panel>
        ) : (
          <View style={isDesktopWeb ? styles.productGrid : undefined}>
            {liveNow.map((product) => (
              <View
                key={product.id}
                style={
                  isDesktopWeb
                    ? [styles.productGridItem, contentColumns >= 3 ? styles.col3 : styles.col2]
                    : undefined
                }>
                <LiveProductCard
                  onDetails={openDetails}
                  onOpen={openProductBrowser}
                  product={product}
                  regionLabel={regionConfig.label}
                  storefront={regionConfig.storefront}
                />
              </View>
            ))}
          </View>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        count={activity.length}
        expanded={activityOpen}
        onToggle={() => setActivityOpen((value) => !value)}
        title="⚡ RECENT ACTIVITY">
        {activity.length === 0 ? (
          <Panel>
            <CompactEmpty
              caption="High-heat restock candidates and stock changes will show up here."
              light
              title="No recent changes"
            />
          </Panel>
        ) : (
          <View style={isDesktopWeb ? styles.productGrid : undefined}>
            {activity.map((event) => {
              const linked =
                productsById.get(event.productId) ??
                (liveProducts.find((item) => item.id === event.productId) as
                  | StockProduct
                  | undefined);
              return (
                <View
                  key={event.id}
                  style={
                    isDesktopWeb
                      ? [styles.productGridItem, contentColumns >= 3 ? styles.col3 : styles.col2]
                      : undefined
                  }>
                  <ActivityRow
                    event={event}
                    onPress={() => {
                      if (linked) openDetails(linked);
                      else router.push(`/product/${event.productId}`);
                    }}
                    product={linked}
                  />
                </View>
              );
            })}
          </View>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        count={catalogProducts.length}
        expanded={catalogOpen}
        onToggle={() => setCatalogOpen((value) => !value)}
        title="📦 CATALOG">
        {catalogProducts.length === 0 ? (
          <Panel>
            <CompactEmpty
              caption="No products match your Filter coverage."
              light
              title="No catalog matches"
            />
          </Panel>
        ) : (
          <View style={isDesktopWeb ? styles.productGrid : undefined}>
            {catalogProducts.map((product) => (
              <View
                key={product.id}
                style={
                  isDesktopWeb
                    ? [styles.productGridItem, contentColumns >= 3 ? styles.col3 : styles.col2]
                    : undefined
                }>
                <CatalogProductCard onOpen={openDetails} product={product} />
              </View>
            ))}
          </View>
        )}
      </CollapsibleSection>
    </Screen>
  );

}

const styles = StyleSheet.create({
  webHero: {
    alignItems: 'center',
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    overflow: 'hidden',
    paddingHorizontal: 28,
    paddingVertical: 28,
  },
  webHeroCopy: { flex: 1, paddingRight: 24 },
  webHeroKicker: {
    color: palette.red,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  webHeroTitle: {
    color: palette.white,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0.2,
    marginBottom: 10,
  },
  webHeroBody: {
    color: palette.whiteDim,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    maxWidth: 520,
  },
  webHeroAside: {
    alignItems: 'center',
    backgroundColor: palette.black,
    borderColor: palette.redDark,
    borderRadius: 18,
    borderWidth: 1,
    minWidth: 140,
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
  webHeroStat: {
    color: palette.white,
    fontSize: 40,
    fontWeight: '900',
  },
  webHeroStatLabel: {
    color: palette.whiteShadow,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'flex-start',
  },
  productGridItem: {
    marginBottom: 2,
  },
  col2: {
    width: '48%',
    flexBasis: '48%',
    flexGrow: 1,
    maxWidth: '48%',
  },
  col3: {
    width: '31.5%',
    flexBasis: '31.5%',
    flexGrow: 1,
    maxWidth: '32%',
  },
  coverageShadow: {
    backgroundColor: palette.whiteShadow,
    borderRadius: 16,
    marginBottom: 16,
    paddingBottom: 3,
  },
  coverageCard: {
    alignItems: 'center',
    backgroundColor: palette.white,
    borderColor: palette.whiteDim,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  coverageCopy: { flex: 1 },
  coverageTitle: {
    color: palette.black,
    fontSize: 15,
    fontWeight: '900',
  },
  statusLine: {
    color: palette.blackSoft,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    marginTop: 6,
  },
  heartbeatLamp: {
    backgroundColor: palette.whiteShadow,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  heartbeatOn: {
    backgroundColor: palette.red,
    shadowColor: palette.red,
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  slimError: {
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  slimErrorText: {
    color: palette.whiteDim,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  collapseBlock: {
    marginBottom: 4,
    marginTop: 4,
  },
  sectionHead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 6,
  },
  sectionHeadPressable: {
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  sectionHeadLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  sectionTitle: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  sectionCount: {
    color: palette.whiteDim,
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 10,
  },
  compactEmpty: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  compactEmptyTitle: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 8,
  },
  compactEmptyTitleLight: { color: palette.black },
  compactEmptyCaption: {
    color: palette.whiteShadow,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
    maxWidth: 280,
    textAlign: 'center',
  },
  compactEmptyCaptionLight: { color: palette.blackSoft },
  cardShadow: {
    backgroundColor: palette.whiteShadow,
    borderRadius: 20,
    marginBottom: 12,
    paddingBottom: 4,
  },
  pressed: { opacity: 0.88 },
  card: {
    backgroundColor: palette.white,
    borderColor: palette.whiteDim,
    borderRadius: 19,
    borderWidth: 1,
    padding: 12,
  },
  cardRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  thumbWell: {
    alignItems: 'center',
    backgroundColor: palette.black,
    borderColor: palette.blackSoft,
    borderRadius: 14,
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 72,
  },
  thumbSm: { height: 56, width: 56 },
  thumbHidden: { opacity: 0 },
  thumbLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: { flex: 1 },
  eyebrow: {
    color: palette.redDark,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  cardTitle: {
    color: palette.black,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
    marginTop: 6,
  },
  cardTitleSm: {
    color: palette.black,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 19,
    marginTop: 5,
  },
  metaLine: {
    color: palette.blackSoft,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: 6,
  },
  price: {
    color: palette.black,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 8,
  },
  liveBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: palette.red,
    borderColor: palette.redDark,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  liveDot: { backgroundColor: palette.white, borderRadius: 4, height: 8, width: 8 },
  soldDot: { backgroundColor: palette.red, borderRadius: 4, height: 8, width: 8 },
  liveBadgeText: {
    color: palette.white,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtle: {
    color: palette.blackSoft,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 5,
  },
  openBtn: {
    alignItems: 'center',
    backgroundColor: palette.whiteDim,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
  },
  openBtnText: {
    color: palette.black,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statusPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginTop: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusLive: { backgroundColor: palette.red, borderColor: palette.redDark },
  statusSold: { backgroundColor: palette.black, borderColor: palette.blackSoft },
  statusPillText: {
    color: palette.white,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.9,
  },
  statusDot: { borderRadius: 4, height: 7, width: 7 },
  activityKind: {
    color: palette.blackSoft,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  kindRed: { color: palette.redDark },
  kindNew: { color: '#0F7A4A' },
  kindPreorder: { color: '#2F5FCC' },
  kindMuted: { color: palette.blackSoft },
  activityMeta: {
    color: palette.blackSoft,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: 6,
  },
  searchCollapsed: {
    alignItems: 'center',
    backgroundColor: palette.white,
    borderColor: palette.whiteDim,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    minHeight: 46,
    paddingHorizontal: 14,
  },
  searchCollapsedText: {
    color: palette.blackSoft,
    fontSize: 15,
    fontWeight: '700',
  },
  searchExpanded: {
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  searchWell: {
    alignItems: 'center',
    backgroundColor: palette.white,
    borderColor: palette.whiteDim,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  searchInput: {
    color: palette.black,
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    paddingVertical: 10,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  skeletonCard: {
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    padding: 12,
  },
  skeletonThumb: {
    backgroundColor: palette.blackSoft,
    borderRadius: 12,
    height: 64,
    width: 64,
  },
  skeletonLines: { flex: 1, gap: 8, justifyContent: 'center' },
  skeletonLine: {
    backgroundColor: palette.blackSoft,
    borderRadius: 6,
    height: 10,
  },
});
