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

Keep the always-on **monitor** on Railway — static hosts only serve the UI.

## Env for web

Add your site origin to Supabase Auth redirect URLs, e.g. `https://YOUR-SITE.pages.dev/auth/callback`.
