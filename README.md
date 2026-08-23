# DropLinq

Independent product availability monitoring for TCG retailers. Not affiliated with Pokémon, Pokémon Center, Walmart, Costco, GameStop, Best Buy, or any other brand it may monitor.

The **iPhone is the control center**. Retailer monitoring belongs on a backend process that writes to Supabase.

## Data modes

Set in `.env`:

- `EXPO_PUBLIC_DATA_MODE=mock` — local catalog/auth (default for Expo Go)
- `EXPO_PUBLIC_DATA_MODE=supabase` — requires URL + anon key

See `.env.example`. Never put the Supabase **service role** key in the app.

## Run (Expo Go)

```bash
npm start
```

Scan the `exp://` QR with Expo Go on the same Wi‑Fi. Do not use `npx expo start -c` if you need the short Expo Go link.

Sign up (mock auth) → onboarding → Home.

SQL: `supabase/migrations/001_init.sql`
