import { getDataApiBaseUrl } from '@/features/data/utils/dataConfig'
import type { CatalogEntityKind, CatalogPayload } from '../types/companyCatalog.types'

let getToken: () => string | null = () => null

export function setDataLibraryTokenGetter(getter: () => string | null) {
  getToken = getter
}

type Paginated<T> = { items: T[]; total: number; page: number; pageSize: number }

const KIND_PATH: Record<CatalogEntityKind, string> = {
  tags: 'tags',
  units: 'units',
  attributes: 'attributes',
  products: 'products',
  services: 'services',
  spaces: 'spaces',
}

async function dataFetch<T>(path: string): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${getDataApiBaseUrl()}${path}`, { headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { message?: string }).message ?? 'Data library request failed')
  }
  return data as T
}

function toQueryString(params: Record<string, string | number | string[] | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue
    if (Array.isArray(value)) {
      for (const v of value) search.append(key, String(v))
    } else {
      search.set(key, String(value))
    }
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export type LibraryListItem = CatalogPayload & { id: string; name: string; description?: string | null }

export const dataLibraryApi = {
  list(kind: CatalogEntityKind, query: { q?: string; page?: number; pageSize?: number; ids?: string[] } = {}) {
    return dataFetch<Paginated<LibraryListItem>>(
      `/${KIND_PATH[kind]}${toQueryString({
        q: query.q,
        page: query.page,
        pageSize: query.pageSize,
        ids: query.ids,
      })}`,
    )
  },

  get(kind: CatalogEntityKind, id: string) {
    return dataFetch<LibraryListItem>(`/${KIND_PATH[kind]}/${id}`)
  },
}

/** Map a Data library DTO into the company catalog payload shape (camelCase). */
export function libraryItemToPayload(kind: CatalogEntityKind, item: LibraryListItem): CatalogPayload {
  const base: CatalogPayload = {
    name: item.name,
    description: item.description ?? null,
    status: item.status,
  }

  switch (kind) {
    case 'tags':
      return { ...base, color: item.color }
    case 'units':
      return {
        ...base,
        symbol: item.symbol,
        isBase: item.isBase,
        baseUnitId: item.baseUnitId ?? null,
      }
    case 'attributes':
      return {
        ...base,
        valueType: item.valueType,
        unitId: item.unitId ?? null,
      }
    case 'services':
      return {
        ...base,
        tagIds: Array.isArray(item.tags)
          ? (item.tags as { id: string }[]).map((t) => t.id)
          : undefined,
        attributes: Array.isArray(item.attributes)
          ? (item.attributes as { attributeId: string; valueText: string | null; valueNumber: number | null }[]).map(
              (a) => ({
                attributeId: a.attributeId,
                valueText: a.valueText,
                valueNumber: a.valueNumber,
              }),
            )
          : undefined,
        timeMode: item.timeMode,
        durationMinutes: item.durationMinutes ?? null,
        startTime: item.startTime ?? null,
        endTime: item.endTime ?? null,
      }
    case 'products':
    case 'spaces':
      return {
        ...base,
        tagIds: Array.isArray(item.tags)
          ? (item.tags as { id: string }[]).map((t) => t.id)
          : undefined,
        attributes: Array.isArray(item.attributes)
          ? (item.attributes as { attributeId: string; valueText: string | null; valueNumber: number | null }[]).map(
              (a) => ({
                attributeId: a.attributeId,
                valueText: a.valueText,
                valueNumber: a.valueNumber,
              }),
            )
          : undefined,
      }
  }
}
