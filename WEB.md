# DropLinq Web (PWA)

DropLinq is **one Expo codebase** for iOS, Android, and Web (`react-native-web`).  
Native apps stay exactly as they are (EAS / Expo Go). Web-only layout uses `Platform.OS === 'web'` / `useWebLayout()`.

## Layout behavior

| Viewport | Behavior |
|----------|----------|
| **Native iOS/Android** | Unchanged phone UI (bottom tabs, BrandHeader ball, single column) |
| **Mobile web** (&lt; 900px) | Same phone-style UI + bottom tabs |
| **Desktop web** (≥ 900px) | Full-width site: top nav, page titles, multi-column Stock/Region grids, Home side-by-side, hero banner |

## Local web

```bash
npm run web
```

## Production static build

```bash
npm run export:web
# outputs ./dist
```

## Recommended free hosting

| Host | Why |
|------|-----|
| **Cloudflare Pages** (recommended) | Free CDN, HTTPS, custom domain |
| **Render Static Site** | Simple; see `render.yaml` |
| **Netlify** | See `netlify.toml` |

Keep the always-on **monitor** on Render (`droplinq-monitor`) or Railway — static hosts only serve the UI.

## Env for web

| Variable | Where |
|----------|--------|
| `EXPO_PUBLIC_MONITOR_API_URL` | Static site build env → `https://droplinq-monitor.onrender.com` |
| `EXPO_PUBLIC_VAPID_PUBLIC_KEY` | Static site build env (public half of VAPID) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | **Monitor service only** |

Generate keys: `npx web-push generate-vapid-keys`

## Lock-screen alerts (how it works)

1. User taps **Enable alerts** → browser permission → Web Push subscription
2. Site registers the subscription with the monitor
3. Monitor polls / receives drop signals and sends Web Push
4. Service worker (`/sw.js`) shows the OS notification on desktop or Home Screen iPhone

**iPhone:** Safari → Share → Add to Home Screen, then open that icon and Enable alerts.  
**Desktop:** Chrome / Edge / Firefox → Enable alerts → Allow.

Free Render web services sleep after idle time. For true 24/7 closed-tab alerts, upgrade `droplinq-monitor` to a paid always-on plan (or Railway Hobby).
