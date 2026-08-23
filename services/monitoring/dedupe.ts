const DEFAULT_WINDOW_MS = 10 * 60 * 1000;

/**
 * Do not notify the same user about the same product+kind within the window.
 */
export function shouldNotify(args: {
  lastNotifiedAt?: string | null;
  windowMs?: number;
  now?: number;
}): boolean {
  if (!args.lastNotifiedAt) return true;
  const windowMs = args.windowMs ?? DEFAULT_WINDOW_MS;
  const now = args.now ?? Date.now();
  return now - new Date(args.lastNotifiedAt).getTime() >= windowMs;
}
