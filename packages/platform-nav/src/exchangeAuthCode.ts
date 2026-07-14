export type ExchangeAuthCodeUser = {
  id: string
  email: string
  displayName: string
  avatarUrl?: string | null
}

export type PlatformRole = 'super_admin' | 'company_admin' | 'member'

export type ExchangeAuthCodeResult = {
  accessToken: string
  expiresIn: number
  user: ExchangeAuthCodeUser
  platformRole?: PlatformRole
  companyId?: string | null
}

export type ExchangeAuthCodeOptions = {
  identityApiBase: string
  code: string
  redirectUri: string
}

export async function exchangeAuthCode(
  opts: ExchangeAuthCodeOptions,
): Promise<ExchangeAuthCodeResult> {
  const res = await fetch(`${opts.identityApiBase.replace(/\/$/, '')}/auth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: opts.code, redirectUri: opts.redirectUri }),
  })

  const data = (await res.json().catch(() => ({}))) as {
    accessToken?: string
    expiresIn?: number
    user?: ExchangeAuthCodeUser
    platformRole?: PlatformRole
    companyId?: string | null
    message?: string
  }

  if (!res.ok || !data.accessToken || !data.user) {
    throw new Error(data.message ?? `Token exchange failed (${res.status})`)
  }

  return {
    accessToken: data.accessToken,
    expiresIn: data.expiresIn ?? 0,
    user: data.user,
    platformRole: data.platformRole,
    companyId: data.companyId,
  }
}
