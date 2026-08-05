import { env } from '../config/env.js'

export type DataServiceSummary = {
  id: string
  name: string
}

function apiBase(): string | null {
  const raw = env.dataApiBaseUrl?.trim()
  if (!raw) return null
  return raw.replace(/\/$/, '').replace(/\/api\/v1$/i, '')
}

/** Soft-degrade Data catalog lookup for service names by id. */
export async function fetchServicesByIds(serviceIds: string[]): Promise<Map<string, DataServiceSummary>> {
  const unique = [...new Set(serviceIds.filter(Boolean))]
  const map = new Map<string, DataServiceSummary>()
  if (unique.length === 0) return map

  const base = apiBase()
  const apiKey = env.dataServiceApiKey
  if (!base || !apiKey) return map

  try {
    for (let i = 0; i < unique.length; i += 100) {
      const chunk = unique.slice(i, i + 100)
      const params = new URLSearchParams({
        ids: chunk.join(','),
        pageSize: String(Math.min(100, chunk.length)),
      })
      const res = await fetch(`${base}/api/v1/internal/services?${params.toString()}`, {
        headers: {
          'X-Data-Service-Key': apiKey,
          Accept: 'application/json',
        },
      })
      if (!res.ok) break
      const data = (await res.json()) as { items?: Array<{ id?: string; name?: string }> }
      for (const item of data.items ?? []) {
        if (item.id && item.name) {
          map.set(item.id, { id: item.id, name: item.name })
        }
      }
    }
  } catch {
    // soft degrade — leave map empty
  }

  return map
}
