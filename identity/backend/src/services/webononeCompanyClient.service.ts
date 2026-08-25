import { env } from '../config/env.js'

function normalizeWebOnOneApiBaseUrl(raw: string): string {
  return raw.replace(/\/$/, '').replace(/\/api\/v1$/i, '')
}

function isPlaceholderServiceKey(key: string): boolean {
  return key.includes('<') || key.includes('>')
}

function resolveInternalUrl(path: string): string | null {
  if (!env.webononeApiBaseUrl || !env.webononeServiceApiKey) {
    return null
  }
  if (isPlaceholderServiceKey(env.webononeServiceApiKey)) {
    console.error(
      '[webononeCompanyClient] WEBONONE_SERVICE_API_KEY looks like a placeholder — set the real key in identity/backend/.env',
    )
    return null
  }
  return `${normalizeWebOnOneApiBaseUrl(env.webononeApiBaseUrl)}${path}`
}

type CompanyInternalResponse = {
  name?: string
}

/** Resolves company display name from WebOnOne (company data is owned there, not in Identity). */
export async function getCompanyName(companyId: string): Promise<string | null> {
  const trimmedId = companyId.trim()
  if (!trimmedId) {
    return null
  }

  const url = resolveInternalUrl(`/api/v1/internal/companies/${encodeURIComponent(trimmedId)}`)
  if (!url) {
    return null
  }

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-WebOnOne-Service-Key': env.webononeServiceApiKey,
      },
    })
    if (!res.ok) {
      const text = await res.text()
      console.error(`[webononeCompanyClient] failed (${res.status}): ${text}`)
      return null
    }

    const data = (await res.json()) as CompanyInternalResponse
    const name = typeof data.name === 'string' ? data.name.trim() : ''
    return name || null
  } catch (err) {
    console.error('[webononeCompanyClient] request failed:', err)
    return null
  }
}
