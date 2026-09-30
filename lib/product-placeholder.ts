import { ImageSourcePropType } from 'react-native';

import { ProductFormat } from '@/types/dropdex';

/** Bundled packshots — Stock never depends on a network fetch for seeded SKUs. */
export const LOCAL_PRODUCT_PHOTOS: Record<string, ImageSourcePropType> = {
  '30th-celebration-etb': require('../assets/images/product-photos/30th-celebration-etb.jpg'),
  '552998': require('../assets/images/product-photos/552998.jpg'),
  '553031': require('../assets/images/product-photos/553031.jpg'),
  '557340': require('../assets/images/product-photos/557340.jpg'),
  '557345': require('../assets/images/product-photos/557345.jpg'),
  '557354': require('../assets/images/product-photos/557354.jpg'),
  '565606': require('../assets/images/product-photos/565606.jpg'),
  '565629': require('../assets/images/product-photos/565629.jpg'),
  '565632': require('../assets/images/product-photos/565632.jpg'),
  '593324': require('../assets/images/product-photos/593324.jpg'),
  '600518': require('../assets/images/product-photos/600518.jpg'),
  '610929': require('../assets/images/product-photos/610929.jpg'),
  '610931': require('../assets/images/product-photos/610931.jpg'),
  '610953': require('../assets/images/product-photos/610953.jpg'),
  '624675': require('../assets/images/product-photos/624675.jpg'),
  '624679': require('../assets/images/product-photos/624679.jpg'),
  '625670': require('../assets/images/product-photos/625670.jpg'),
  '630431': require('../assets/images/product-photos/630431.jpg'),
  '630687': require('../assets/images/product-photos/630687.jpg'),
  '630688': require('../assets/images/product-photos/630688.jpg'),
  '630696': require('../assets/images/product-photos/630696.jpg'),
  '644282': require('../assets/images/product-photos/644282.jpg'),
  '644298': require('../assets/images/product-photos/644298.jpg'),
  '644362': require('../assets/images/product-photos/644362.jpg'),
  '648415': require('../assets/images/product-photos/648415.jpg'),
  '654135': require('../assets/images/product-photos/654135.jpg'),
  '654137': require('../assets/images/product-photos/654137.jpg'),
  '654160': require('../assets/images/product-photos/654160.jpg'),
  '654213': require('../assets/images/product-photos/654213.jpg'),
  '668497': require('../assets/images/product-photos/668497.jpg'),
  '668541': require('../assets/images/product-photos/668541.jpg'),
  '672394': require('../assets/images/product-photos/672394.jpg'),
  '672396': require('../assets/images/product-photos/672396.jpg'),
  '672404': require('../assets/images/product-photos/672404.jpg'),
  '684444': require('../assets/images/product-photos/684444.jpg'),
  '684452': require('../assets/images/product-photos/684452.jpg'),
  '684456': require('../assets/images/product-photos/684456.jpg'),
  '688712': require('../assets/images/product-photos/688712.jpg'),
  '690660': require('../assets/images/product-photos/690660.jpg'),
  '692939': require('../assets/images/product-photos/692939.jpg'),
  '692942': require('../assets/images/product-photos/692942.jpg'),
  '692949': require('../assets/images/product-photos/692949.jpg'),
  '704152': require('../assets/images/product-photos/704152.jpg'),
  '704153': require('../assets/images/product-photos/704153.jpg'),
  '704189': require('../assets/images/product-photos/704189.jpg'),
  '244727': require('../assets/images/product-photos/244727.jpg'),
  '283599': require('../assets/images/product-photos/283599.jpg'),
  '527671': require('../assets/images/product-photos/527671.jpg'),
  '528049': require('../assets/images/product-photos/528049.jpg'),
  '531539': require('../assets/images/product-photos/531539.jpg'),
  '553002': require('../assets/images/product-photos/553002.jpg'),
  '562357': require('../assets/images/product-photos/562357.jpg'),
  '616296': require('../assets/images/product-photos/616296.jpg'),
  '628493': require('../assets/images/product-photos/628493.jpg'),
  '639828': require('../assets/images/product-photos/639828.jpg'),
  '644363': require('../assets/images/product-photos/644363.jpg'),
  '656487': require('../assets/images/product-photos/656487.jpg'),
  '656950': require('../assets/images/product-photos/656950.jpg'),
  '666909': require('../assets/images/product-photos/666909.jpg'),
  '668536': require('../assets/images/product-photos/668536.jpg'),
  '668537': require('../assets/images/product-photos/668537.jpg'),
  '672391': require('../assets/images/product-photos/672391.jpg'),
};

const formatPlaceholders: Record<string, ImageSourcePropType> = {
  etb: require('../assets/images/products/etb.png'),
  'booster-bundle': require('../assets/images/products/booster-bundle.png'),
  'booster-box': require('../assets/images/products/booster-box.png'),
  upc: require('../assets/images/products/upc.png'),
  collection: require('../assets/images/products/collection.png'),
};

export function productPlaceholderSource(format?: ProductFormat | string | null): ImageSourcePropType {
  if (format && formatPlaceholders[format]) return formatPlaceholders[format];
  return formatPlaceholders.collection;
}

/** Prefer bundled packshot when imageUrl points at /product-photos/{id}.jpg. */
export function resolveProductImageSource(
  imageUrl?: string | null,
  format?: ProductFormat | string | null,
): ImageSourcePropType {
  if (imageUrl) {
    const photo = imageUrl.match(/\/product-photos\/([^/?#]+)\.jpe?g$/i);
    if (photo?.[1] && LOCAL_PRODUCT_PHOTOS[photo[1]]) {
      return LOCAL_PRODUCT_PHOTOS[photo[1]];
    }
    const art = imageUrl.match(/\/product-art\/([^/?#]+)\.png$/i);
    if (art?.[1] && formatPlaceholders[art[1]]) {
      return formatPlaceholders[art[1]];
    }
    return { uri: imageUrl };
  }
  return productPlaceholderSource(format);
}
