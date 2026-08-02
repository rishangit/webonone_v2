import type {
  CatalogDetailItem,
  CatalogKind,
  CatalogSearchResult,
  CatalogSessionItem,
  SessionTokenItem,
} from '../types/catalog.types'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:4018/api/v1'

async function parseError(res: Response, fallback: string): Promise<Error & { statusCode: number }> {
  const data = (await res.json().catch(() => ({}))) as { message?: string }
  return Object.assign(new Error(data.message ?? fallback), { statusCode: res.status })
}

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

  async listSessions(
    serviceId: string,
    range?: { from?: string; to?: string },
  ): Promise<CatalogSessionItem[]> {
    const params = new URLSearchParams()
    if (range?.from) params.set('from', range.from)
    if (range?.to) params.set('to', range.to)
    const qs = params.toString()
    const res = await fetch(
      `${API_BASE}/catalog/services/${encodeURIComponent(serviceId)}/sessions${qs ? `?${qs}` : ''}`,
      { headers: { 'Content-Type': 'application/json' } },
    )
    if (!res.ok) {
      throw await parseError(res, 'Failed to load sessions')
    }
    const data = (await res.json()) as { items: CatalogSessionItem[] }
    return data.items ?? []
  },

  async getNextToken(
    serviceId: string,
    eventId: string,
    occurrenceDate: string,
    accessToken: string,
  ): Promise<{ tokenNumber: number; tokenLabel: string }> {
    const res = await fetch(
      `${API_BASE}/catalog/services/${encodeURIComponent(serviceId)}/sessions/${encodeURIComponent(eventId)}/${encodeURIComponent(occurrenceDate)}/tokens/next`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    )
    if (!res.ok) {
      throw await parseError(res, 'Failed to load next token')
    }
    return (await res.json()) as { tokenNumber: number; tokenLabel: string }
  },

  async getMyToken(
    serviceId: string,
    eventId: string,
    occurrenceDate: string,
    accessToken: string,
  ): Promise<SessionTokenItem | null> {
    const res = await fetch(
      `${API_BASE}/catalog/services/${encodeURIComponent(serviceId)}/sessions/${encodeURIComponent(eventId)}/${encodeURIComponent(occurrenceDate)}/tokens/mine`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    )
    if (res.status === 404) return null
    if (!res.ok) {
      throw await parseError(res, 'Failed to load your token')
    }
    return (await res.json()) as SessionTokenItem
  },

  async bookToken(
    serviceId: string,
    eventId: string,
    occurrenceDate: string,
    accessToken: string,
    body: { user_display_name: string; user_email?: string | null },
  ): Promise<SessionTokenItem> {
    const res = await fetch(
      `${API_BASE}/catalog/services/${encodeURIComponent(serviceId)}/sessions/${encodeURIComponent(eventId)}/${encodeURIComponent(occurrenceDate)}/tokens`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    )
    if (!res.ok) {
      throw await parseError(res, 'Failed to issue token')
    }
    return (await res.json()) as SessionTokenItem
  },
}
