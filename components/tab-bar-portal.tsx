import { ReactNode } from 'react';

/** Native keeps the bar in the tab layout. Web portals it so nothing clips it. */
export function mountTabBar(node: ReactNode) {
  return node;
}
