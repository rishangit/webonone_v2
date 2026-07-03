import { getWebOnOneApiBase, getWebOnOneApiBaseFromReturnUrl } from '@/features/auth/utils/identityConfig'
import type { DataRole } from '@/features/auth/types/auth.types'

export async function syncPlatformDataRole(
  accessToken: string,
  returnUrl?: string | null,
  sessionRole?: DataRole,
  companyId?: string | null,
): Promise<void> {
  const apiBase = returnUrl ? getWebOnOneApiBaseFromReturnUrl(returnUrl) : getWebOnOneApiBase()
  const body =
    sessionRole != null
      ? JSON.stringify({ sessionRole, companyId: companyId ?? null })
      : JSON.stringify({})

  const res = await fetch(`${apiBase}/company/me/sync-data-role`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body,
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(data.message ?? `Failed to sync Data role (${res.status})`)
  }
}
