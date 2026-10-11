import { useEffect, useState } from 'react';

/**
 * Returns true only after `active` has stayed true for `delayMs`.
 * Fast work stays invisible. A loader is for a wait that has already passed about a second.
 */
export function useDelayedFlag(active: boolean, delayMs = 1000) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) {
      setShow(false);
      return;
    }
    const timer = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(timer);
  }, [active, delayMs]);

  return show;
}
