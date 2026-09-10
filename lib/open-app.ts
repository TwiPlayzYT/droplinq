export function openAppPath(session: unknown) {
  // Collectr uses app.*; we use /app on the same host until a subdomain exists.
  return session ? '/app' : '/start';
}
