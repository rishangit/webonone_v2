import { env } from '../config/env.js'

function normalizePaymentApiBaseUrl(raw: string): string {
  return raw.replace(/\/$/, '').replace(/\/api\/v1$/i, '')
}

function isPlaceholderServiceKey(key: string): boolean {
  return key.includes('<') || key.includes('>')
}

function resolveInternalPaymentUrl(path: string): string | null {
  if (!env.paymentApiBaseUrl || !env.paymentServiceApiKey) {
    console.warn('[paymentClient] PAYMENT_API_BASE_URL or PAYMENT_SERVICE_API_KEY not configured')
    return null
  }
  if (isPlaceholderServiceKey(env.paymentServiceApiKey)) {
    console.error(
      '[paymentClient] PAYMENT_SERVICE_API_KEY looks like a placeholder — set the real key in webonone-v2/backend/.env',
    )
    return null
  }
  return `${normalizePaymentApiBaseUrl(env.paymentApiBaseUrl)}${path}`
}

export type UpsertPaymentCompanyInput = {
  companyId: string
  name: string
  logoUrl?: string | null
  activatedAt?: string | null
  status: 'active' | 'inactive'
}

async function postInternalPayment(path: string, body: unknown): Promise<Response | null> {
  const url = resolveInternalPaymentUrl(path)
  if (!url) return null

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Payment-Service-Key': env.paymentServiceApiKey,
    },
    body: JSON.stringify(body),
  })
}

/** Fire-and-forget sync of company activation to Payment (system billing). */
export async function upsertPaymentCompany(input: UpsertPaymentCompanyInput): Promise<void> {
  try {
    const response = await postInternalPayment('/api/v1/internal/companies/upsert', {
      companyId: input.companyId,
      name: input.name,
      logoUrl: input.logoUrl ?? undefined,
      activatedAt: input.activatedAt ?? undefined,
      status: input.status,
    })
    if (!response) return

    if (!response.ok) {
      const text = await response.text()
      console.error(`[paymentClient] upsert failed (${response.status}): ${text}`)
    }
  } catch (err) {
    console.error('[paymentClient] upsert error:', err)
  }
}

/** Sync company to Payment; throws on misconfig or HTTP error (for backfill scripts). */
export async function upsertPaymentCompanyStrict(input: UpsertPaymentCompanyInput): Promise<void> {
  const response = await postInternalPayment('/api/v1/internal/companies/upsert', {
    companyId: input.companyId,
    name: input.name,
    logoUrl: input.logoUrl ?? undefined,
    activatedAt: input.activatedAt ?? undefined,
    status: input.status,
  })
  if (!response) {
    throw new Error('Payment API not configured (PAYMENT_API_BASE_URL / PAYMENT_SERVICE_API_KEY)')
  }
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Payment upsert failed (${response.status}): ${text}`)
  }
}

/** Delete Payment mirrors not in keepCompanyIds (orphans / local test companies). */
export async function purgePaymentOrphanCompanies(keepCompanyIds: string[]): Promise<string[]> {
  const response = await postInternalPayment('/api/v1/internal/companies/purge-orphans', {
    keepCompanyIds,
  })
  if (!response) {
    throw new Error('Payment API not configured (PAYMENT_API_BASE_URL / PAYMENT_SERVICE_API_KEY)')
  }
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Payment purge-orphans failed (${response.status}): ${text}`)
  }
  const data = (await response.json()) as { deleted?: string[] }
  return data.deleted ?? []
}
