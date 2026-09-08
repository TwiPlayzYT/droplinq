import { PropsWithChildren, useEffect, useRef } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';

const nodes = new Map<string, Set<View>>();

export function tourDomProps(id: string) {
  return {
    collapsable: false as const,
    nativeID: `tour-${id}`,
    ...(Platform.OS === 'web' ? ({ dataSet: { tour: id } } as object) : null),
  };
}

export function TourAnchor({
  id,
  style,
  children,
}: PropsWithChildren<{ id: string; style?: StyleProp<ViewStyle> }>) {
  const ref = useRef<View>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let set = nodes.get(id);
    if (!set) {
      set = new Set();
      nodes.set(id, set);
    }
    set.add(node);
    return () => {
      set?.delete(node);
    };
  }, [id]);

  return (
    <View ref={ref} style={style} {...tourDomProps(id)}>
      {children}
    </View>
  );
}

export function nativeTourViews(id: string) {
  return nodes.get(id);
}
