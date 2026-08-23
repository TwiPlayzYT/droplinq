import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DataSourceBanner } from '@/components/data-source-banner';
import { BrandHeader, MetalButton, Panel, Screen } from '@/components/dropdex-ui';
import { palette } from '@/constants/dropdex';
import { catalogProductFromLocal } from '@/lib/catalog-product';
import { catalogRepository } from '@/services/data';
import { useDropDex } from '@/store/dropdex-context';
import { CatalogProduct, CatalogStockEvent, stockStatusLabel } from '@/types/catalog';

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
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [events, setEvents] = useState<CatalogStockEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const watched = product ? isWatched(product.id) || watchlist.some((item) => item.product.id === id) : false;

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    let next = await catalogRepository.getProduct(id);
    if (!next) {
      const local = liveProducts.find((item) => item.id === id);
      if (local) next = catalogProductFromLocal(local, region);
    }

    setProduct(next);
    if (!next) {
      setError('Product not found.');
      setEvents([]);
      setLoading(false);
      return;
    }

    const remoteEvents = await catalogRepository.listEvents(next.id).catch(() => []);
    setEvents(remoteEvents);
    setLoading(false);
  }, [id, liveProducts, region]);

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

  if (loading && !product) {
    return (
      <Screen>
        <BrandHeader eyebrow="Product" />
        <Panel>
          <Text style={styles.copy}>Loading product…</Text>
          <MetalButton icon="arrow-back" label="Back" onPress={() => router.back()} />
        </Panel>
      </Screen>
    );
  }

  if (!product) {
    return (
      <Screen>
        <BrandHeader eyebrow="Product" />
        <Panel>
          <Text style={styles.copy}>{error ?? 'Product not found.'}</Text>
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
            <Image contentFit="cover" source={{ uri: product.imageUrl }} style={styles.image} />
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
  title: { color: palette.black, fontSize: 20, fontWeight: '900' },
  meta: { color: palette.blackSoft, fontSize: 12, marginTop: 6 },
  metaLight: { color: palette.whiteShadow, fontSize: 12, marginTop: 6 },
  status: { color: palette.redDark, fontSize: 13, fontWeight: '900', letterSpacing: 1, marginTop: 10 },
  upgrade: { color: palette.redDark, fontSize: 12, fontWeight: '800', marginVertical: 10 },
  section: { color: palette.white, fontSize: 12, fontWeight: '900', letterSpacing: 1.4, marginBottom: 8 },
  event: { color: palette.whiteShadow, fontSize: 11, marginBottom: 6 },
  copy: { color: palette.blackSoft, marginBottom: 12 },
});
