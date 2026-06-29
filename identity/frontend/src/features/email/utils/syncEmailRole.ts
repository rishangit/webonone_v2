export async function syncPlatformEmailRole(accessToken: string, returnUrl: string): Promise<void> {
  let apiBase: string
  try {
    apiBase = `${new URL(returnUrl).origin}/api/v1`
  } catch {
    throw new Error('Invalid return URL for email role sync')
  }

  const res = await fetch(`${apiBase}/company/me/sync-email-role`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(data.message ?? `Failed to sync email role (${res.status})`)
  }
}
