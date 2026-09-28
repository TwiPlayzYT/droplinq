import { ImageSourcePropType } from 'react-native';

import { ProductFormat } from '@/types/dropdex';

const placeholders: Record<string, ImageSourcePropType> = {
  etb: require('../assets/images/products/etb.png'),
  'booster-bundle': require('../assets/images/products/booster-bundle.png'),
  'booster-box': require('../assets/images/products/booster-box.png'),
  upc: require('../assets/images/products/upc.png'),
  collection: require('../assets/images/products/collection.png'),
};

/** Local format art so Stock never shows a blank thumb while live PC photos load. */
export function productPlaceholderSource(format?: ProductFormat | string | null): ImageSourcePropType {
  if (format && placeholders[format]) return placeholders[format];
  return placeholders.collection;
}
