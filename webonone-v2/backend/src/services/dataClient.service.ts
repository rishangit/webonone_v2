import { env } from '../config/env.js'

function normalizeDataApiBaseUrl(raw: string): string {
  return raw.replace(/\/$/, '').replace(/\/api\/v1$/i, '')
}

function isPlaceholderServiceKey(key: string): boolean {
  return key.includes('<') || key.includes('>')
}

function resolveInternalDataUrl(path: string): string | null {
  if (!env.dataApiBaseUrl || !env.dataServiceApiKey) {
    console.error('[dataClient] DATA_API_BASE_URL or DATA_SERVICE_API_KEY not configured; cannot sync Data role')
    return null
  }
  if (isPlaceholderServiceKey(env.dataServiceApiKey)) {
    console.error(
      '[dataClient] DATA_SERVICE_API_KEY looks like a placeholder — set the real key in webonone-v2/backend/.env',
    )
    return null
  }
  return `${normalizeDataApiBaseUrl(env.dataApiBaseUrl)}${path}`
}

export async function syncDataUserRole(params: {
  userId: string
  role: string
  companyId?: string | null
}): Promise<void> {
  const url = resolveInternalDataUrl('/api/v1/internal/sync-user-role')
  if (!url) {
    const err = new Error('Data role sync is not configured') as Error & { statusCode?: number }
    err.statusCode = 503
    throw err
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Data-Service-Key': env.dataServiceApiKey,
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const text = await response.text()
    const err = new Error(`Data role sync failed (${response.status}): ${text}`) as Error & { statusCode?: number }
    err.statusCode = response.status >= 500 ? 503 : response.status
    throw err
  }
}
