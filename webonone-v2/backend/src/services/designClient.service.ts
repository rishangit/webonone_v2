import { env } from '../config/env.js'

function normalizeDesignApiBaseUrl(raw: string): string {
  return raw.replace(/\/$/, '').replace(/\/api\/v1$/i, '')
}

function isPlaceholderServiceKey(key: string): boolean {
  return key.includes('<') || key.includes('>')
}

function resolveInternalDesignUrl(path: string): string | null {
  if (!env.designApiBaseUrl || !env.designServiceApiKey) {
    console.error('[designClient] DESIGN_API_BASE_URL or DESIGN_SERVICE_API_KEY not configured; cannot call Design')
    return null
  }
  if (isPlaceholderServiceKey(env.designServiceApiKey)) {
    console.error(
      '[designClient] DESIGN_SERVICE_API_KEY looks like a placeholder — set the real key in webonone-v2/backend/.env',
    )
    return null
  }
  return `${normalizeDesignApiBaseUrl(env.designApiBaseUrl)}${path}`
}

export async function ensureStarterWebsite(
  companyId: string,
  companyName: string,
  userId: string,
): Promise<void> {
  const url = resolveInternalDesignUrl(
    `/api/v1/internal/companies/${encodeURIComponent(companyId)}/website/ensure-starter`,
  )
  if (!url) return

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Design-Service-Key': env.designServiceApiKey,
    },
    body: JSON.stringify({ companyName, userId }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Design ensure-starter failed (${response.status}): ${text}`)
  }
}
