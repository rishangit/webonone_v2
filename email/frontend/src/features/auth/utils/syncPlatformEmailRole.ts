const DEFAULT_WEBONONE_ORIGIN = 'http://localhost:3000'

export function getWebOnOneOrigin(): string {
  return import.meta.env.VITE_WEBONONE_ORIGIN ?? DEFAULT_WEBONONE_ORIGIN
}

export function getWebOnOneApiBase(): string {
  return import.meta.env.VITE_WEBONONE_API_BASE_URL ?? `${getWebOnOneOrigin().replace(/\/$/, '')}/api/v1`
}

export function getWebOnOneApiBaseFromReturnUrl(returnUrl: string): string {
  try {
    return `${new URL(returnUrl).origin}/api/v1`
  } catch {
    return getWebOnOneApiBase()
  }
}

export async function syncPlatformEmailRole(
  accessToken: string,
  returnUrl: string,
): Promise<void> {
  const apiBase = getWebOnOneApiBaseFromReturnUrl(returnUrl)
  const res = await fetch(`${apiBase}/company/me/sync-email-role`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(data.message ?? `Failed to sync email role (${res.status})`)
  }
}
