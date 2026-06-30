import { getWebOnOneApiBaseFromReturnUrl } from '@/features/auth/utils/identityConfig'

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
