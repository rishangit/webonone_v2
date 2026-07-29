import { env } from '../config/env.js'

export type DataLibraryService = {
  id: string
  name: string
  description?: string | null
  timeMode?: 'duration' | 'window'
  durationMinutes?: number | null
  startTime?: string | null
  endTime?: string | null
}

function apiBase(): string {
  if (!env.dataApiBaseUrl) {
    throw new Error('DATA_API_BASE_URL not configured')
  }
  return env.dataApiBaseUrl.replace(/\/$/, '').replace(/\/api\/v1$/i, '')
}

/** Fetch a Data library service using the caller's JWT (same token Data FE uses). */
export async function getLibraryService(
  libraryEntityId: string,
  accessToken: string,
): Promise<DataLibraryService | null> {
  const res = await fetch(
    `${apiBase()}/api/v1/services/${encodeURIComponent(libraryEntityId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  )
  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Data library get service failed (${res.status}): ${text}`)
  }
  return (await res.json()) as DataLibraryService
}
