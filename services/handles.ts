const monitorUrl = (
  process.env.EXPO_PUBLIC_MONITOR_API_URL ?? 'https://droplinq-monitor.onrender.com'
).replace(/\/$/, '');

export async function checkHandle(handle: string, accessToken?: string | null) {
  try {
    const response = await fetch(`${monitorUrl}/v1/handles/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ handle }),
    });
    if (response.status === 404) return { ok: true as const, unchecked: true as const };
    const body = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
    if (!response.ok || body?.ok === false) {
      return { ok: false as const, message: body?.message || 'Already taken.' };
    }
    return { ok: true as const };
  } catch {
    return { ok: true as const, unchecked: true as const };
  }
}

export async function claimHandle(handle: string, accessToken: string) {
  try {
    const response = await fetch(`${monitorUrl}/v1/handles/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ handle }),
    });
    if (response.status === 404) return { ok: true as const };
    const body = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
    if (!response.ok || body?.ok === false) {
      return { ok: false as const, message: body?.message || 'Could not save that handle. Try again.' };
    }
    return { ok: true as const };
  } catch {
    return { ok: false as const, message: 'Could not save that handle. Try again.' };
  }
}
