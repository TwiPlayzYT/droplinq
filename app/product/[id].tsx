import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DataSourceBanner } from '@/components/data-source-banner';
import { BrandHeader, MetalButton, Panel, Screen } from '@/components/dropdex-ui';
import { palette } from '@/constants/dropdex';
import { catalogProductFromLocal } from '@/lib/catalog-product';
import { catalogRepository } from '@/services/data';
import { useDropDex } from '@/store/dropdex-context';
import { CatalogProduct, CatalogStockEvent, stockStatusLabel } from '@/types/catalog';
import { Product, RegionId } from '@/types/dropdex';

function resolveLocalProduct(
  id: string | undefined,
  liveProducts: Product[],
  watchlist: { product: Product }[],
  region: RegionId,
): CatalogProduct | null {
  if (!id) return null;
  const local =
    liveProducts.find((item) => item.id === id) ??
    watchlist.find((item) => item.product.id === id)?.product;
  return local ? catalogProductFromLocal(local, region) : null;
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    addToWatchlist,
    isWatched,
    liveProducts,
    openProductBrowser,
    region,
    removeFromWatchlist,
    watchlist,
  } = useDropDex();

  const localProduct = useMemo(
    () => resolveLocalProduct(id, liveProducts, watchlist, region),
    [id, liveProducts, region, watchlist],
  );

  const [product, setProduct] = useState<CatalogProduct | null>(localProduct);
  const [events, setEvents] = useState<CatalogStockEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Keep local catalog in sync if list updates while this screen is open.
  useEffect(() => {
    if (localProduct && (!product || product.id !== localProduct.id)) {
      setProduct(localProduct);
    }
  }, [localProduct, product]);

  const watched = product
    ? isWatched(product.id) || watchlist.some((item) => item.product.id === id)
    : false;

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);

    const local = resolveLocalProduct(id, liveProducts, watchlist, region);
    if (local) setProduct(local);

    const remote = await catalogRepository.getProduct(id).catch(() => null);
    const next = remote ?? local;
    if (!next) {
      setProduct(null);
      setError('Product not found.');
      setEvents([]);
      return;
    }

    setProduct(next);
    const remoteEvents = await catalogRepository.listEvents(next.id).catch(() => []);
    setEvents(remoteEvents);
  }, [id, liveProducts, region, watchlist]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleWatch = () => {
    if (!product || busy) return;
    setBusy(true);
    setError(null);
    if (watched) {
      removeFromWatchlist(product.id);
    } else {
      const result = addToWatchlist(product);
      if (!result.ok) {
        setError(result.message);
      }
    }
    setBusy(false);
  };

  if (!product) {
    return (
      <Screen>
        <BrandHeader eyebrow="Product" />
        <Panel>
          <Text style={styles.copy}>{error ?? 'Loading product…'}</Text>
          <MetalButton icon="arrow-back" label="Back" onPress={() => router.back()} />
        </Panel>
      </Screen>
    );
  }

  return (
    <Screen>
      <BrandHeader eyebrow={product.retailerName} />
      <DataSourceBanner />
      <Panel>
        <View style={styles.imageWell}>
          {product.imageUrl ? (
            <Image
              cachePolicy="memory-disk"
              contentFit="cover"
              source={{ uri: product.imageUrl }}
              style={styles.image}
              transition={0}
            />
          ) : (
            <Ionicons color={palette.whiteShadow} name="image-outline" size={32} />
          )}
        </View>
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.meta}>
          {product.retailerName} · {product.regionName} · {product.tcgName}
        </Text>
        <Text style={styles.status}>{stockStatusLabel(product.stockStatus)}</Text>
        <Text style={styles.meta}>
          {product.price != null ? `${product.currency} ${product.price}` : 'Price unavailable'}
        </Text>
        <Text style={styles.meta}>
          Last checked:{' '}
          {product.lastCheckedAt ? new Date(product.lastCheckedAt).toLocaleString() : 'Unknown'}
        </Text>
        {error ? <Text style={styles.upgrade}>{error}</Text> : null}
        <MetalButton
          icon={watched ? 'bookmark' : 'bookmark-outline'}
          label={watched ? 'Remove from watchlist' : 'Watch product'}
          onPress={toggleWatch}
        />
        <View style={{ height: 10 }} />
        <MetalButton
          icon="open-outline"
          label="Open product"
          onPress={() => openProductBrowser(product)}
        />
      </Panel>
      <Panel tone="dark">
        <Text style={styles.section}>STOCK HISTORY</Text>
        {events.length === 0 ? (
          <Text style={styles.metaLight}>No events stored yet.</Text>
        ) : (
          events.map((event) => (
            <Text key={event.id} style={styles.event}>
              {event.kind.replace('_', ' ').toUpperCase()} · {event.verificationStatus} ·{' '}
              {new Date(event.detectedAt).toLocaleString()}
            </Text>
          ))
        )}
      </Panel>
      <MetalButton icon="arrow-back" label="Back" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  imageWell: {
    alignItems: 'center',
    backgroundColor: palette.black,
    borderRadius: 16,
    height: 180,
    justifyContent: 'center',
    marginBottom: 14,
    overflow: 'hidden',
  },
  image: { height: '100%', width: '100%' },
  title: { color: palette.cardInk, fontSize: 20, fontWeight: '900', lineHeight: 26 },
  meta: { color: palette.cardMuted, fontSize: 12, lineHeight: 18, marginTop: 8 },
  metaLight: { color: palette.whiteShadow, fontSize: 12, lineHeight: 18, marginTop: 8 },
  status: { color: palette.redDark, fontSize: 13, fontWeight: '900', letterSpacing: 1, marginTop: 12 },
  upgrade: { color: palette.redDark, fontSize: 12, fontWeight: '800', lineHeight: 17, marginVertical: 12 },
  section: { color: palette.white, fontSize: 12, fontWeight: '900', letterSpacing: 1.4, marginBottom: 12 },
  event: { color: palette.whiteShadow, fontSize: 11, lineHeight: 16, marginBottom: 8 },
  copy: { color: palette.cardMuted, lineHeight: 18, marginBottom: 12 },
});
