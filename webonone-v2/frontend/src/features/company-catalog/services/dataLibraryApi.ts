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

async function dataFetch<T>(
  path: string,
  init?: { method?: string; body?: string },
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${getDataApiBaseUrl()}${path}`, {
    method: init?.method ?? 'GET',
    headers,
    body: init?.body,
  })
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

export type LibraryAttributeUnit = {
  id: string
  name: string
  symbol: string
}

export type LibraryAttributeValueEntry = {
  id: string
  valueText: string | null
  valueNumber: number | null
  isDefault: boolean
}

/** Rich attribute shape returned by Data catalog entity get/list. */
export type LibraryCatalogAttribute = {
  attributeId: string
  name: string
  valueType: 'number' | 'text'
  unit: LibraryAttributeUnit | null
  values: LibraryAttributeValueEntry[]
}

export type LibraryListItem = CatalogPayload & {
  id: string
  name: string
  description?: string | null
  galleryImages?: { mediaId: string; url: string }[]
  attributes?: LibraryCatalogAttribute[] | unknown
  tags?: { id: string; name?: string; color?: string }[]
}

export type LibraryProductVariantAttributeValue = {
  attributeId: string
  attributeName: string
  attributeValueId: string
  valueText: string | null
  valueNumber: number | null
  valueType: 'number' | 'text'
  unitSymbol: string | null
}

export type LibraryProductVariant = {
  id: string
  productId: string
  name: string
  sku: string
  isDefault: boolean
  values: LibraryProductVariantAttributeValue[]
  createdAt: string
  updatedAt: string
}

export type LibraryProductVariantStock = {
  id: string
  variantId: string
  quantity: number
  batchNumber: string
  costPrice: number
  sellPrice: number
  purchaseDate: string
  expiredDate: string | null
  supplierUserId: string | null
  supplierDisplayName: string | null
  supplierEmail: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function parseUnit(raw: unknown): LibraryAttributeUnit | null {
  if (!isRecord(raw)) return null
  if (typeof raw.id !== 'string' || typeof raw.name !== 'string' || typeof raw.symbol !== 'string') {
    return null
  }
  return { id: raw.id, name: raw.name, symbol: raw.symbol }
}

function parseAttributeValues(raw: unknown): LibraryAttributeValueEntry[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(isRecord)
    .map((entry) => ({
      id: typeof entry.id === 'string' ? entry.id : '',
      valueText: typeof entry.valueText === 'string' ? entry.valueText : null,
      valueNumber: typeof entry.valueNumber === 'number' ? entry.valueNumber : null,
      isDefault: entry.isDefault === true,
    }))
    .filter((entry) => entry.id.length > 0)
}

/**
 * Parse Data catalog attribute links (rich multi-value shape, or legacy single value).
 */
export function parseLibraryAttributes(raw: unknown): LibraryCatalogAttribute[] {
  if (!Array.isArray(raw)) return []

  const result: LibraryCatalogAttribute[] = []
  for (const entry of raw) {
    if (!isRecord(entry) || typeof entry.attributeId !== 'string') continue

    const valueType = entry.valueType === 'number' ? 'number' : 'text'
    const name = typeof entry.name === 'string' ? entry.name : entry.attributeId
    const unit = parseUnit(entry.unit)
    let values = parseAttributeValues(entry.values)

    // Legacy single-value link on the attribute row
    if (values.length === 0 && (entry.valueText != null || entry.valueNumber != null)) {
      values = [
        {
          id: `${entry.attributeId}-legacy`,
          valueText: typeof entry.valueText === 'string' ? entry.valueText : null,
          valueNumber: typeof entry.valueNumber === 'number' ? entry.valueNumber : null,
          isDefault: true,
        },
      ]
    }

    result.push({
      attributeId: entry.attributeId,
      name,
      valueType,
      unit,
      values,
    })
  }
  return result
}

/**
 * Company payload / edit forms still expect attributeId + optional single valueText/valueNumber.
 * Preserve rich fields for display while keeping simplified defaults for fork/edit.
 */
function attributesToPayload(raw: unknown): Record<string, unknown>[] | undefined {
  const attrs = parseLibraryAttributes(raw)
  if (attrs.length === 0) return undefined

  return attrs.map((attr) => {
    const preferred = attr.values.find((v) => v.isDefault) ?? attr.values[0]
    return {
      attributeId: attr.attributeId,
      name: attr.name,
      valueType: attr.valueType,
      unit: attr.unit,
      values: attr.values,
      valueText: preferred?.valueText ?? null,
      valueNumber: preferred?.valueNumber ?? null,
    }
  })
}

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

  listProductVariants(productId: string) {
    return dataFetch<{ items: LibraryProductVariant[] }>(`/products/${productId}/variants`)
  },

  getProductVariant(productId: string, variantId: string) {
    return dataFetch<LibraryProductVariant>(`/products/${productId}/variants/${variantId}`)
  },

  listProductVariantStocks(productId: string, variantId: string) {
    return dataFetch<{ items: LibraryProductVariantStock[] }>(
      `/products/${productId}/variants/${variantId}/stocks`,
    )
  },

  suggestStockBatchNumber() {
    return dataFetch<{ batchNumber: string }>('/stocks/suggested-batch-number')
  },

  createProductVariantStock(
    productId: string,
    variantId: string,
    body: {
      quantity: number
      batch_number: string
      cost_price: number
      sell_price: number
      purchase_date: string
      expired_date?: string | null
      supplier_user_id?: string | null
      supplier_display_name?: string | null
      supplier_email?: string | null
    },
  ) {
    return dataFetch<LibraryProductVariantStock>(
      `/products/${productId}/variants/${variantId}/stocks`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    )
  },

  setProductVariantStockActive(productId: string, variantId: string, stockId: string) {
    return dataFetch<LibraryProductVariantStock>(
      `/products/${productId}/variants/${variantId}/stocks/${stockId}/active`,
      { method: 'PATCH' },
    )
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
          ? item.tags.map((t) => t.id).filter((id): id is string => typeof id === 'string')
          : undefined,
        attributes: attributesToPayload(item.attributes),
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
          ? item.tags.map((t) => t.id).filter((id): id is string => typeof id === 'string')
          : undefined,
        attributes: attributesToPayload(item.attributes),
      }
  }
}

export function formatLibraryAttributeValueLabel(
  value: { valueText: string | null; valueNumber: number | null },
  unitSymbol?: string | null,
): string {
  const base =
    value.valueText != null && value.valueText !== ''
      ? value.valueText
      : value.valueNumber != null
        ? String(value.valueNumber)
        : '—'
  return unitSymbol ? `${base} ${unitSymbol}` : base
}
