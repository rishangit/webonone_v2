import type { CatalogSearchResult } from '../types/catalog.types'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:4018/api/v1'

export const catalogApi = {
  async search(query: { q: string; page?: number; pageSize?: number }): Promise<CatalogSearchResult> {
    const params = new URLSearchParams()
    params.set('q', query.q)
    if (query.page != null) params.set('page', String(query.page))
    if (query.pageSize != null) params.set('pageSize', String(query.pageSize))

    const res = await fetch(`${API_BASE}/catalog/search?${params.toString()}`, {
      headers: { 'Content-Type': 'application/json' },
    })
    const data = (await res.json().catch(() => ({}))) as { message?: string } & Partial<CatalogSearchResult>
    if (!res.ok) {
      throw new Error(data.message ?? 'Search failed')
    }
    return data as CatalogSearchResult
  },
}
