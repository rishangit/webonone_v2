import { env } from '../config/env.js'
import type { LibraryCatalogReferenceKind } from '../types/catalogReferenceKind.js'

function normalizeWebOnOneApiBaseUrl(raw: string): string {
  return raw.replace(/\/$/, '').replace(/\/api\/v1$/i, '')
}

function hasInternalConfig(): boolean {
  return Boolean(env.webononeApiBaseUrl?.trim() && env.webononeServiceApiKey?.trim())
}

export async function fetchCompanyCatalogReferenceCounts(
  kind: LibraryCatalogReferenceKind,
  entityIds: string[],
): Promise<Map<string, number>> {
  const uniqueIds = [...new Set(entityIds.filter((id) => id.length > 0))]
  const counts = new Map<string, number>()
  for (const id of uniqueIds) counts.set(id, 0)
  if (uniqueIds.length === 0 || !hasInternalConfig()) return counts

  const url = `${normalizeWebOnOneApiBaseUrl(env.webononeApiBaseUrl)}/api/v1/internal/library-entity-reference-counts`
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WebOnOne-Service-Key': env.webononeServiceApiKey,
      },
      body: JSON.stringify({ kind, entityIds: uniqueIds }),
    })
    if (!response.ok) {
      console.warn(
        `[webononeReferenceCountsClient] reference counts failed (${response.status}): ${await response.text()}`,
      )
      return counts
    }
    const payload = (await response.json()) as { counts?: Record<string, number> }
    if (!payload.counts || typeof payload.counts !== 'object') return counts
    for (const [id, value] of Object.entries(payload.counts)) {
      counts.set(id, Number(value) || 0)
    }
  } catch (err) {
    console.warn('[webononeReferenceCountsClient] reference counts error:', err)
  }
  return counts
}
