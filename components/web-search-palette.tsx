import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { palette } from '@/constants/dropdex';
import { categoryNamesForProduct } from '@/lib/filter-matcher';
import { useDropDex } from '@/store/dropdex-context';
import { Product } from '@/types/dropdex';

type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Go to Home', href: '/(tabs)', icon: 'home-outline' },
  { key: 'stock', label: 'Go to Stock', href: '/(tabs)/stock', icon: 'cube-outline' },
  { key: 'filter', label: 'Go to Filter', href: '/(tabs)/filter', icon: 'options-outline' },
  { key: 'region', label: 'Go to Region', href: '/(tabs)/region', icon: 'globe-outline' },
  { key: 'settings', label: 'Go to Settings', href: '/(tabs)/settings', icon: 'settings-outline' },
];

function matchesSearch(product: Product, query: string) {
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

function productSubtitle(product: Product) {
  const categories = categoryNamesForProduct(product);
  if (categories[0]) return categories[0];
  if (product.tags[0]) return product.tags[0];
  return product.category;
}

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Collectr-style command palette — web only.
 * Empty query → navigation shortcuts; typing → product results.
 */
export function WebSearchPalette({ visible, onClose }: Props) {
  const router = useRouter();
  const { liveProducts } = useDropDex();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const trimmed = query.trim();
  const showingNav = !trimmed;

  const products = useMemo(() => {
    if (!trimmed) return [] as Product[];
    return [...liveProducts]
      .filter((product) => matchesSearch(product, trimmed))
      .sort((a, b) => a.title.localeCompare(b.title))
      .slice(0, 24);
  }, [liveProducts, trimmed]);

  const resultCount = showingNav ? NAV_ITEMS.length : products.length;

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setActiveIndex(0);
      return;
    }
    const t = setTimeout(() => inputRef.current?.focus(), 40);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    setActiveIndex(0);
  }, [trimmed]);

  useEffect(() => {
    if (activeIndex >= resultCount) {
      setActiveIndex(Math.max(0, resultCount - 1));
    }
  }, [activeIndex, resultCount]);

  const openNav = useCallback(
    (item: NavItem, newTab = false) => {
      onClose();
      if (newTab && Platform.OS === 'web' && typeof window !== 'undefined') {
        const path = item.href.replace('/(tabs)', '').replace(/^\//, '') || '';
        window.open(path ? `/${path}` : '/', '_blank');
        return;
      }
      router.push(item.href as never);
    },
    [onClose, router],
  );

  const openProduct = useCallback(
    (product: Product, newTab = false) => {
      onClose();
      const path = `/product/${product.id}`;
      if (newTab && Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(path, '_blank');
        return;
      }
      router.push(path as never);
    },
    [onClose, router],
  );

  const activate = useCallback(
    (newTab = false) => {
      if (showingNav) {
        const item = NAV_ITEMS[activeIndex];
        if (item) openNav(item, newTab);
        return;
      }
      const product = products[activeIndex];
      if (product) openProduct(product, newTab);
    },
    [activeIndex, openNav, openProduct, products, showingNav],
  );

  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((i) => Math.min(resultCount - 1, i + 1));
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        activate(event.metaKey || event.ctrlKey);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activate, onClose, resultCount, visible]);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}>
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable style={styles.panel}>
          <View style={styles.searchRow}>
            <Ionicons color={palette.whiteShadow} name="search" size={18} />
            <TextInput
              ref={inputRef}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setQuery}
              placeholder="Search any sealed or unsealed product…"
              placeholderTextColor={palette.whiteShadow}
              style={styles.input as never}
              value={query}
            />
            <Pressable
              accessibilityLabel="Close search"
              hitSlop={8}
              onPress={() => {
                if (query) setQuery('');
                else onClose();
              }}
              style={styles.closeBtn}>
              <Ionicons color={palette.whiteDim} name="close" size={18} />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={styles.results}
            contentContainerStyle={styles.resultsContent}>
            {showingNav ? (
              <>
                <Text style={[styles.sectionLabel, styles.sectionPad]}>Navigation</Text>
                {NAV_ITEMS.map((item, index) => (
                  <Pressable
                    key={item.key}
                    onHoverIn={() => setActiveIndex(index)}
                    onPress={() => openNav(item)}
                    style={[styles.row, index === activeIndex && styles.rowActive]}>
                    <Ionicons color={palette.whiteShadow} name={item.icon} size={18} />
                    <Text style={styles.rowTitle}>{item.label}</Text>
                  </Pressable>
                ))}
              </>
            ) : (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>Products</Text>
                  <Text style={styles.resultCount}>
                    {products.length} result{products.length === 1 ? '' : 's'}
                  </Text>
                </View>
                {products.length === 0 ? (
                  <Text style={styles.empty}>No products match “{trimmed}”</Text>
                ) : (
                  products.map((product, index) => (
                    <Pressable
                      key={product.id}
                      onHoverIn={() => setActiveIndex(index)}
                      onPress={() => openProduct(product)}
                      style={[styles.row, index === activeIndex && styles.rowActive]}>
                      <View style={styles.thumb}>
                        {product.imageUrl ? (
                          <Image
                            contentFit="cover"
                            source={{ uri: product.imageUrl }}
                            style={styles.thumbImage}
                            transition={0}
                          />
                        ) : (
                          <Ionicons color={palette.whiteShadow} name="cube-outline" size={18} />
                        )}
                      </View>
                      <View style={styles.productCopy}>
                        <Text numberOfLines={1} style={styles.rowTitle}>
                          {product.title}
                        </Text>
                        <Text numberOfLines={1} style={styles.rowSub}>
                          {productSubtitle(product)}
                        </Text>
                      </View>
                    </Pressable>
                  ))
                )}
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerHint}>↑↓ Navigate</Text>
            <Text style={styles.footerHint}>↵ Open</Text>
            <Text style={styles.footerHint}>⌘ ↵ New tab</Text>
            <Text style={styles.footerHint}>esc Close</Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(8px)',
        } as object)
      : null),
  },
  panel: {
    backgroundColor: '#161616',
    borderColor: '#2C2C2C',
    borderRadius: 16,
    borderWidth: 1,
    maxHeight: '70%' as unknown as number,
    maxWidth: 560,
    overflow: 'hidden',
    width: '100%',
  },
  searchRow: {
    alignItems: 'center',
    borderBottomColor: '#2C2C2C',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: {
    color: palette.white,
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 4,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  closeBtn: {
    padding: 4,
  },
  results: {
    maxHeight: 420,
  },
  resultsContent: {
    paddingBottom: 8,
    paddingTop: 10,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  sectionLabel: {
    color: palette.whiteShadow,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionPad: {
    paddingHorizontal: 16,
  },
  resultCount: {
    color: palette.whiteShadow,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  rowActive: {
    backgroundColor: '#242424',
  },
  rowTitle: {
    color: palette.white,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  rowSub: {
    color: palette.red,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  thumb: {
    alignItems: 'center',
    backgroundColor: palette.black,
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 40,
  },
  thumbImage: {
    height: '100%',
    width: '100%',
  },
  productCopy: {
    flex: 1,
    minWidth: 0,
  },
  empty: {
    color: palette.whiteShadow,
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  footer: {
    borderTopColor: '#2C2C2C',
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  footerHint: {
    color: palette.whiteShadow,
    fontSize: 11,
    fontWeight: '600',
  },
});
