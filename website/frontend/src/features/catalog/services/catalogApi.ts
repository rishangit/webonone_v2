import type { CatalogDetailItem, CatalogKind, CatalogSearchResult } from '../types/catalog.types'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:4018/api/v1'

export const catalogApi = {
  async search(query: {
    q: string
    page?: number
    pageSize?: number
    lat?: number
    lng?: number
  }): Promise<CatalogSearchResult> {
    const params = new URLSearchParams()
    params.set('q', query.q)
    if (query.page != null) params.set('page', String(query.page))
    if (query.pageSize != null) params.set('pageSize', String(query.pageSize))
    if (query.lat != null) params.set('lat', String(query.lat))
    if (query.lng != null) params.set('lng', String(query.lng))

    const res = await fetch(`${API_BASE}/catalog/search?${params.toString()}`, {
      headers: { 'Content-Type': 'application/json' },
    })
    const data = (await res.json().catch(() => ({}))) as { message?: string } & Partial<CatalogSearchResult>
    if (!res.ok) {
      throw new Error(data.message ?? 'Search failed')
    }
    return data as CatalogSearchResult
  },

  async getById(
    kind: CatalogKind,
    id: string,
    coords?: { lat?: number; lng?: number },
  ): Promise<CatalogDetailItem> {
    const params = new URLSearchParams()
    if (coords?.lat != null) params.set('lat', String(coords.lat))
    if (coords?.lng != null) params.set('lng', String(coords.lng))
    const qs = params.toString()

    const res = await fetch(
      `${API_BASE}/catalog/${encodeURIComponent(kind)}/${encodeURIComponent(id)}${qs ? `?${qs}` : ''}`,
      { headers: { 'Content-Type': 'application/json' } },
    )
    const data = (await res.json().catch(() => ({}))) as { message?: string } & Partial<CatalogDetailItem>
    if (!res.ok) {
      throw Object.assign(new Error(data.message ?? 'Failed to load catalog item'), {
        statusCode: res.status,
      })
    }
    return data as CatalogDetailItem
  },
}
