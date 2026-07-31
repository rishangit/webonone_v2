import { env } from '../config/env.js'

export type CatalogSearchItem = {
  id: string
  kind: 'products' | 'services' | 'spaces'
  name: string
  description: string | null
  companyId: string
  companyName: string
  tags: Array<{ id: string; name: string; color?: string }>
}

export type CatalogSearchResult = {
  items: CatalogSearchItem[]
  total: number
  page: number
  pageSize: number
}

function apiBase(): string {
  if (!env.webononeApiBaseUrl) {
    throw new Error('WEBONONE_API_BASE_URL not configured')
  }
  return env.webononeApiBaseUrl.replace(/\/$/, '').replace(/\/api\/v1$/i, '')
}

/** Proxy marketplace search to WebOnOne internal catalog API. */
export async function searchCatalog(query: {
  q?: string
  page?: string | number
  pageSize?: string | number
}): Promise<CatalogSearchResult> {
  if (!env.webononeServiceApiKey) {
    throw Object.assign(new Error('WebOnOne service key is not configured'), { statusCode: 503 })
  }

  const params = new URLSearchParams()
  if (typeof query.q === 'string' && query.q.trim()) {
    params.set('q', query.q.trim())
  }
  if (query.page != null) params.set('page', String(query.page))
  if (query.pageSize != null) params.set('pageSize', String(query.pageSize))

  const url = `${apiBase()}/api/v1/internal/catalog/search?${params.toString()}`
  const res = await fetch(url, {
    headers: {
      'X-WebOnOne-Service-Key': env.webononeServiceApiKey,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw Object.assign(
      new Error(text || `WebOnOne catalog search failed (${res.status})`),
      { statusCode: res.status >= 500 ? 502 : res.status },
    )
  }

  return (await res.json()) as CatalogSearchResult
}
