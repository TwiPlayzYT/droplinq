import { useEffect, useState } from 'react';

import { WebSearchPalette } from '@/components/web-search-palette';

const listeners = new Set<(open: boolean) => void>();

export function setProductSearchOpen(open: boolean) {
  listeners.forEach((listener) => listener(open));
}

/** One search palette for the top bar, the phone tab bar, and the slash shortcut. */
export function ProductSearchHost() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const listener = (next: boolean) => setOpen(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return <WebSearchPalette visible={open} onClose={() => setProductSearchOpen(false)} />;
}
