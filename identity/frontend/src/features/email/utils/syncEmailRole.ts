function getWebOnOneApiBaseFromReturnUrl(returnUrl: string): string {
  if (import.meta.env.VITE_WEBONONE_API_BASE_URL) {
    return import.meta.env.VITE_WEBONONE_API_BASE_URL.replace(/\/$/, '')
  }

  try {
    return `${new URL(returnUrl).origin}/api/v1`
  } catch {
    throw new Error('Invalid return URL for email role sync')
  }
}

export async function syncPlatformEmailRole(accessToken: string, returnUrl: string): Promise<void> {
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
