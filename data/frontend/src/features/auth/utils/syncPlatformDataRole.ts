import { getWebOnOneApiBaseFromReturnUrl } from '@/features/auth/utils/identityConfig'

export async function syncPlatformDataRole(
  accessToken: string,
  returnUrl: string,
): Promise<void> {
  const apiBase = getWebOnOneApiBaseFromReturnUrl(returnUrl)
  const res = await fetch(`${apiBase}/company/me/sync-Data-role`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(data.message ?? `Failed to sync Data role (${res.status})`)
  }
}
