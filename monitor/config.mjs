const numberFromEnv = (name, fallback) => {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  port: numberFromEnv('PORT', 3000),
  pollIntervalMs: Math.max(numberFromEnv('POLL_INTERVAL_MS', 30_000), 15_000),
  requestTimeoutMs: Math.max(numberFromEnv('REQUEST_TIMEOUT_MS', 15_000), 5_000),
  dataFile: process.env.DATA_FILE ?? './monitor/data/state.json',
  webDistDir: process.env.WEB_DIST_DIR ?? './dist',
  monitorUrls: (
    process.env.MONITOR_URLS ??
    [
      'https://www.pokemoncenter.com/en-ca/category/trading-card-game',
      'https://www.pokemoncenter.com/en-ca/category/new-releases',
    ].join(',')
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
};
