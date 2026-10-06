import type { DeviceScope, SmsRole } from '../models/db.js'
import {
  getTextLkCredentials,
  isTextLkReady,
} from './gatewayConfig.service.js'
import { fetchTextLkBalance } from './textLkProvider.service.js'

const CACHE_TTL_MS = 60_000

export interface ProviderBalanceDto {
  provider: 'textlk'
  configured: boolean
  balance: number | null
  unit: 'SMS'
  lastUpdated: string | null
}

export type ResolveBalanceScopeResult =
  | { ok: true; scope: DeviceScope; companyId: string | null }
  | { ok: false; status: number; message: string; code: string }

type CacheEntry = {
  expiresAt: number
  value: ProviderBalanceDto
}

const balanceCache = new Map<string, CacheEntry>()

export function balanceCacheKey(scope: DeviceScope, companyId: string | null): string {
  return `${scope}:${companyId ?? 'platform'}`
}

/** Test helper — clears in-memory balance cache. */
export function clearProviderBalanceCache(): void {
  balanceCache.clear()
}

export function resolveBalanceScope(user: {
  role: SmsRole
  companyId: string | null
}): ResolveBalanceScopeResult {
  if (user.role === 'super_admin') {
    return { ok: true, scope: 'platform', companyId: null }
  }
  if (user.role === 'company_admin') {
    if (!user.companyId) {
      return {
        ok: false,
        status: 400,
        message: 'Company admin has no company assigned',
        code: 'BAD_REQUEST',
      }
    }
    return { ok: true, scope: 'company', companyId: user.companyId }
  }
  return { ok: false, status: 403, message: 'Forbidden', code: 'FORBIDDEN' }
}

function notConfiguredDto(): ProviderBalanceDto {
  return {
    provider: 'textlk',
    configured: false,
    balance: null,
    unit: 'SMS',
    lastUpdated: null,
  }
}

export async function getTextLkProviderBalance(input: {
  scope: DeviceScope
  companyId: string | null
  force?: boolean
}): Promise<
  | { ok: true; dto: ProviderBalanceDto }
  | { ok: false; status: number; message: string; code: string }
> {
  const key = balanceCacheKey(input.scope, input.companyId)
  if (!input.force) {
    const cached = balanceCache.get(key)
    if (cached && cached.expiresAt > Date.now()) {
      return { ok: true, dto: cached.value }
    }
  }

  const ready = await isTextLkReady(input.scope, input.companyId)
  if (!ready) {
    const dto = notConfiguredDto()
    balanceCache.set(key, { value: dto, expiresAt: Date.now() + CACHE_TTL_MS })
    return { ok: true, dto }
  }

  let credentials: { apiToken: string }
  try {
    credentials = await getTextLkCredentials(input.scope, input.companyId)
  } catch {
    const dto = notConfiguredDto()
    return { ok: true, dto }
  }

  const result = await fetchTextLkBalance(credentials.apiToken)
  if (!result.ok) {
    return {
      ok: false,
      status: 502,
      message: 'Unable to retrieve SMS balance',
      code: 'PROVIDER_ERROR',
    }
  }

  const dto: ProviderBalanceDto = {
    provider: 'textlk',
    configured: true,
    balance: result.balance,
    unit: 'SMS',
    lastUpdated: new Date().toISOString(),
  }
  balanceCache.set(key, { value: dto, expiresAt: Date.now() + CACHE_TTL_MS })
  return { ok: true, dto }
}
