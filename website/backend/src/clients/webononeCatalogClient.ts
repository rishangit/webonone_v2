import { env } from '../config/env.js'

export type CatalogKind = 'products' | 'services' | 'spaces'

export type CatalogSearchItem = {
  id: string
  kind: CatalogKind
  name: string
  description: string | null
  companyId: string
  companyName: string
  tags: Array<{ id: string; name: string; color?: string }>
  distanceKm: number | null
  latitude: number | null
  longitude: number | null
}

export type CatalogDetailItem = CatalogSearchItem & {
  galleryImages: Array<{ mediaId: string; url: string }>
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

function requireServiceKey(): string {
  if (!env.webononeServiceApiKey) {
    throw Object.assign(new Error('WebOnOne service key is not configured'), { statusCode: 503 })
  }
  return env.webononeServiceApiKey
}

/** Proxy marketplace search to WebOnOne internal catalog API. */
export async function searchCatalog(query: {
  q?: string
  page?: string | number
  pageSize?: string | number
  lat?: string | number
  lng?: string | number
}): Promise<CatalogSearchResult> {
  const params = new URLSearchParams()
  if (typeof query.q === 'string' && query.q.trim()) {
    params.set('q', query.q.trim())
  }
  if (query.page != null) params.set('page', String(query.page))
  if (query.pageSize != null) params.set('pageSize', String(query.pageSize))
  if (query.lat != null && query.lat !== '') params.set('lat', String(query.lat))
  if (query.lng != null && query.lng !== '') params.set('lng', String(query.lng))

  const url = `${apiBase()}/api/v1/internal/catalog/search?${params.toString()}`
  const res = await fetch(url, {
    headers: {
      'X-WebOnOne-Service-Key': requireServiceKey(),
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

/** Proxy marketplace detail to WebOnOne internal catalog API. */
export async function getCatalogItem(
  kind: string,
  id: string,
  query: { lat?: string | number; lng?: string | number } = {},
): Promise<CatalogDetailItem> {
  const params = new URLSearchParams()
  if (query.lat != null && query.lat !== '') params.set('lat', String(query.lat))
  if (query.lng != null && query.lng !== '') params.set('lng', String(query.lng))

  const qs = params.toString()
  const url = `${apiBase()}/api/v1/internal/catalog/${encodeURIComponent(kind)}/${encodeURIComponent(id)}${qs ? `?${qs}` : ''}`
  const res = await fetch(url, {
    headers: {
      'X-WebOnOne-Service-Key': requireServiceKey(),
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const text = await res.text()
    let message = text || `WebOnOne catalog detail failed (${res.status})`
    try {
      const body = JSON.parse(text) as { message?: string }
      if (body.message) message = body.message
    } catch {
      // keep raw text
    }
    throw Object.assign(new Error(message), {
      statusCode: res.status === 404 ? 404 : res.status >= 500 ? 502 : res.status,
    })
  }

  return (await res.json()) as CatalogDetailItem
}
