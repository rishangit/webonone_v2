import { isAccessTokenExpired } from '@webonone/platform-embed'
import type { WebsiteAuthSession } from '@/features/auth/utils/authStorage'
import { getIdentityApiBase } from '@/features/auth/utils/identityConfig'

export class WebsiteSessionHandoffError extends Error {
  readonly code: 'expired' | 'refresh_failed' | 'invalid'

  constructor(code: WebsiteSessionHandoffError['code'], message: string) {
    super(message)
    this.name = 'WebsiteSessionHandoffError'
    this.code = code
  }
}

type RefreshResponse = {
  accessToken?: string
  expiresIn?: number
  message?: string
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(`${getIdentityApiBase()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  const data = (await res.json().catch(() => ({}))) as RefreshResponse
  if (!res.ok || !data.accessToken) {
    throw new WebsiteSessionHandoffError(
      'refresh_failed',
      data.message ?? 'Session expired — sign in again',
    )
  }
  return data.accessToken
}

/**
 * Returns a JWT Identity will accept for POST /auth/code (refresh when possible).
 */
export async function resolveAccessTokenForHandoff(
  session: WebsiteAuthSession,
): Promise<{ accessToken: string; refreshToken?: string | null }> {
  const { accessToken, refreshToken } = session
  if (!isAccessTokenExpired(accessToken)) {
    return { accessToken, refreshToken }
  }

  if (refreshToken?.trim()) {
    const nextAccessToken = await refreshAccessToken(refreshToken.trim())
    return { accessToken: nextAccessToken, refreshToken }
  }

  throw new WebsiteSessionHandoffError(
    'expired',
    'Your session expired — sign in again to open the app',
  )
}
