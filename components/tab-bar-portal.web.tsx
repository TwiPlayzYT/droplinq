import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Pin the phone tab bar to the page, outside the app shell that clips overflow. */
export function mountTabBar(node: ReactNode) {
  if (typeof document === 'undefined') return node;
  return createPortal(node, document.body);
}
