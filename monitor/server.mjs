import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

import { config } from './config.mjs';
import { normalizeCoverageFilters } from './coverage-match.mjs';
import { MonitorEngine } from './monitor-engine.mjs';
import {
  productsFromPageCrawl,
  verifyPageCrawlSignature,
} from './pagecrawl-webhook.mjs';
import { JsonStore } from './storage.mjs';
import {
  getWebPushPublicConfig,
  isValidWebPushSubscription,
} from './web-push.mjs';

const allowedRegions = new Set(['us', 'ca', 'uk', 'de', 'au', 'nz', 'jp']);

const sendJson = (response, status, value) => {
  response.writeHead(status, {
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  });
  response.end(JSON.stringify(value));
};

const readBody = async (request) => {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 512_000) throw new Error('Request body is too large');
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString('utf8');
};

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};

const webDistRoot = resolve(config.webDistDir);

const serveWebApp = async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false;

  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://dropdex.local').pathname);
    const relativePath =
      pathname === '/'
        ? 'index.html'
        : extname(pathname)
          ? pathname.slice(1)
          : `${pathname.slice(1).replace(/\/$/, '')}.html`;
    const filePath = resolve(webDistRoot, relativePath);
    if (!filePath.startsWith(`${webDistRoot}/`)) return false;

    const body = await readFile(filePath);
    response.writeHead(200, {
      'Cache-Control': pathname === '/sw.js' ? 'no-cache' : 'public, max-age=300',
      'Content-Type': contentTypes[extname(filePath)] ?? 'application/octet-stream',
    });
    response.end(request.method === 'HEAD' ? undefined : body);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
};

const validateRegistration = (input) => {
  if (!input || typeof input !== 'object') throw new Error('Registration body is required');
  if (typeof input.installationId !== 'string' || input.installationId.length < 8) {
    throw new Error('A valid installationId is required');
  }

  const filters = normalizeCoverageFilters(input.filters);

  let alerts = {
    push: input.alerts?.push !== false,
    sound: input.alerts?.sound !== false,
    vibration: input.alerts?.vibration !== false,
    speech: input.alerts?.speech === true,
    fullScreen: input.alerts?.fullScreen !== false,
  };

  const webPushSubscription = isValidWebPushSubscription(input.webPushSubscription)
    ? {
        endpoint: input.webPushSubscription.endpoint,
        expirationTime:
          typeof input.webPushSubscription.expirationTime === 'number'
            ? input.webPushSubscription.expirationTime
            : null,
        keys: {
          auth: input.webPushSubscription.keys.auth.slice(0, 512),
          p256dh: input.webPushSubscription.keys.p256dh.slice(0, 512),
        },
      }
    : undefined;

  // Expo Go may not return a token; PWA registrations use Web Push instead.
  if (input.enabled && alerts.push && !input.expoPushToken && !webPushSubscription) {
    alerts = { ...alerts, push: false };
  }

  return {
    installationId: input.installationId.slice(0, 128),
    enabled: input.enabled === true,
    region: allowedRegions.has(input.region) ? input.region : 'ca',
    expoPushToken:
      typeof input.expoPushToken === 'string' ? input.expoPushToken.slice(0, 256) : undefined,
    webPushSubscription,
    filters,
    alerts,
    updatedAt: new Date().toISOString(),
  };
};

const store = new JsonStore(config.dataFile);
await store.load();

const engine = new MonitorEngine({
  store,
  urls: config.monitorUrls,
  pollIntervalMs: config.pollIntervalMs,
  requestTimeoutMs: config.requestTimeoutMs,
});

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === 'GET' && request.url === '/health') {
    const state = store.getState();
    sendJson(response, 200, {
      ok: true,
      baselineReady: state.baselineReady,
      observedProducts: Object.keys(state.snapshot).length,
      registrations: Object.keys(state.registrations).length,
      pendingEvents: state.pendingEvents.length,
    });
    return;
  }

  if (request.method === 'GET' && request.url === '/v1/status') {
    const state = store.getState();
    sendJson(response, 200, {
      baselineReady: state.baselineReady,
      observedProducts: Object.values(state.snapshot).filter((product) => product.inStock).length,
      pollIntervalMs: config.pollIntervalMs,
      lastObservationAt: state.lastObservationAt ?? null,
      lastObservationCount: state.lastObservationCount ?? 0,
      sourceBlocked: !state.baselineReady,
    });
    return;
  }

  if (request.method === 'GET' && request.url === '/v1/web-push/config') {
    sendJson(response, 200, getWebPushPublicConfig());
    return;
  }

  if (request.method === 'POST' && request.url === '/v1/registrations') {
    try {
      const registration = validateRegistration(JSON.parse(await readBody(request)));
      await store.update((state) => {
        state.registrations[registration.installationId] = registration;
        return state;
      });
      sendJson(response, 200, { ok: true, monitoring: registration.enabled });
    } catch (error) {
      sendJson(response, 422, { ok: false, error: error.message });
    }
    return;
  }

  if (request.method === 'POST' && request.url === '/v1/observations') {
    try {
      const payload = JSON.parse(await readBody(request));
      const products = Array.isArray(payload.products) ? payload.products : [];
      const allowed = products.filter(
        (product) =>
          product &&
          typeof product.id === 'string' &&
          typeof product.title === 'string' &&
          typeof product.url === 'string' &&
          allowedFormats.has(product.format),
      );

      // Device polls already alert locally; keep Railway baseline warm without double-pushing.
      const emitEvents = payload.source !== 'expo-go-device';
      const result = await engine.ingestObservations(allowed, {
        complete: payload.complete !== false,
        emitEvents,
      });
      sendJson(response, 200, { ok: true, ...result });
    } catch (error) {
      sendJson(response, 422, { ok: false, error: error.message });
    }
    return;
  }

  if (request.method === 'POST' && request.url === '/v1/webhooks/pagecrawl') {
    try {
      const rawBody = await readBody(request);
      const verified = verifyPageCrawlSignature({
        rawBody,
        signature: request.headers['x-pagecrawl-signature'],
        timestamp: request.headers['x-pagecrawl-timestamp'],
        secret: process.env.PAGECRAWL_SIGNING_SECRET,
      });
      if (!verified) {
        sendJson(response, 401, { ok: false, error: 'Invalid webhook signature' });
        return;
      }

      const payload = JSON.parse(rawBody);
      const products = productsFromPageCrawl(payload);
      const eventId = `pagecrawl-${payload.id ?? 'change'}-${payload.changed_at ?? request.headers['x-pagecrawl-timestamp']}`;
      await engine.ingestWebhookProducts(products, eventId);
      sendJson(response, 200, { ok: true, matchedProducts: products.length });
    } catch (error) {
      sendJson(response, 422, { ok: false, error: error.message });
    }
    return;
  }

  if (await serveWebApp(request, response)) return;

  sendJson(response, 404, { error: 'Not found' });
});

server.listen(config.port, '0.0.0.0', () => {
  console.log(`[server] DropLinq monitor listening on :${config.port}`);
  console.log(`[server] Polling ${config.monitorUrls.length} official page(s) every ${config.pollIntervalMs}ms`);
  engine.start();
});

const shutdown = () => {
  engine.stop();
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
