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

export type CatalogKind = 'products' | 'services' | 'spaces'

export type DataTagSummary = {
  id: string
  name: string
  color: string
  description?: string | null
}

export type DataLibraryGalleryImage = {
  mediaId: string
  url: string
}

export type DataLibraryCatalogItem = {
  id: string
  name: string
  description: string | null
  status: string
  tags: DataTagSummary[]
  galleryImages?: DataLibraryGalleryImage[]
  /** Present on services from Data catalog DTO. */
  timeMode?: 'duration' | 'window'
  durationMinutes?: number | null
  startTime?: string | null
  endTime?: string | null
}

type ListResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

function apiBase(): string {
  if (!env.dataApiBaseUrl) {
    throw new Error('DATA_API_BASE_URL not configured')
  }
  return env.dataApiBaseUrl.replace(/\/$/, '').replace(/\/api\/v1$/i, '')
}

function hasInternalConfig(): boolean {
  return Boolean(env.dataApiBaseUrl?.trim() && env.dataServiceApiKey?.trim())
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

async function internalGet<T>(path: string, searchParams: URLSearchParams): Promise<T | null> {
  if (!hasInternalConfig()) return null
  try {
    const url = `${apiBase()}/api/v1/internal/${path}?${searchParams.toString()}`
    const res = await fetch(url, {
      headers: {
        'X-Data-Service-Key': env.dataServiceApiKey,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) {
      console.warn(`[dataCatalogClient] internal ${path} failed (${res.status})`)
      return null
    }
    return (await res.json()) as T
  } catch (err) {
    console.warn('[dataCatalogClient] internal request failed:', err)
    return null
  }
}

/** Soft-degrade: returns [] when Data is unavailable. */
export async function listInternalTagsByQuery(q: string): Promise<DataTagSummary[]> {
  const items: DataTagSummary[] = []
  let page = 1
  while (page <= 5) {
    const params = new URLSearchParams({
      q,
      page: String(page),
      pageSize: '100',
      sort: 'name',
    })
    const result = await internalGet<ListResult<DataTagSummary>>('tags', params)
    if (!result) break
    items.push(...result.items)
    if (items.length >= result.total || result.items.length === 0) break
    page += 1
  }
  return items
}

export async function listInternalTagsByIds(ids: string[]): Promise<DataTagSummary[]> {
  if (ids.length === 0) return []
  const unique = [...new Set(ids)]
  const items: DataTagSummary[] = []
  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100)
    const params = new URLSearchParams({
      ids: chunk.join(','),
      pageSize: String(Math.min(100, chunk.length)),
    })
    const result = await internalGet<ListResult<DataTagSummary>>('tags', params)
    if (!result) break
    items.push(...result.items)
  }
  return items
}

/** Soft-degrade: returns [] when Data is unavailable. Matches q OR any tag_id (union). */
export async function listMatchingLibraryIds(
  kind: CatalogKind,
  options: { q?: string; tagIds?: string[] },
): Promise<string[]> {
  const ids = new Set<string>()

  async function collectPages(buildParams: (page: number) => URLSearchParams): Promise<void> {
    let page = 1
    let collectedForQuery = 0
    while (page <= 5) {
      const result = await internalGet<ListResult<DataLibraryCatalogItem>>(
        kind,
        buildParams(page),
      )
      if (!result) break
      for (const item of result.items) {
        ids.add(item.id)
      }
      collectedForQuery += result.items.length
      if (collectedForQuery >= result.total || result.items.length === 0) break
      if (result.items.length < result.pageSize) break
      page += 1
    }
  }

  if (options.q) {
    await collectPages((page) => {
      const params = new URLSearchParams({
        q: options.q!,
        page: String(page),
        pageSize: '100',
        sort: 'name',
      })
      return params
    })
  }

  if (options.tagIds && options.tagIds.length > 0) {
    await collectPages((page) => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '100',
        sort: 'name',
      })
      for (const tagId of options.tagIds!) {
        params.append('tag_id', tagId)
      }
      return params
    })
  }

  return [...ids]
}

export async function listLibraryItemsByIds(
  kind: CatalogKind,
  ids: string[],
): Promise<DataLibraryCatalogItem[]> {
  if (ids.length === 0) return []
  const unique = [...new Set(ids)]
  const items: DataLibraryCatalogItem[] = []
  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100)
    const params = new URLSearchParams({
      ids: chunk.join(','),
      pageSize: String(Math.min(100, chunk.length)),
    })
    const result = await internalGet<ListResult<DataLibraryCatalogItem>>(kind, params)
    if (!result) break
    items.push(...result.items)
  }
  return items
}
