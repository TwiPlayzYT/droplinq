import { useEffect, useState } from 'react';

/**
 * Returns true only after `active` has stayed true for `delayMs`.
 * Use for skeletons so fast loads never flash a placeholder.
 */
export function useDelayedFlag(active: boolean, delayMs = 3000) {
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
