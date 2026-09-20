import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'
import type { CatalogEntityKind } from '@/features/sales/types/catalog.types'

const client = createApiClient(env.dataApiBaseUrl)

type Paginated<T> = { items: T[]; total: number; page: number; pageSize: number }

export type LibraryListItem = Record<string, unknown> & {
  id: string
  name: string
  description?: string | null
  galleryImages?: { mediaId: string; url: string }[]
}

export type LibraryProductVariant = {
  id: string
  productId: string
  name: string
  sku: string
  isDefault: boolean
}

export type LibraryProductVariantStock = {
  id: string
  variantId: string
  quantity: number
  sellPrice: number
  isActive: boolean
}

const KIND_PATH: Record<CatalogEntityKind, string> = {
  products: 'products',
  services: 'services',
  spaces: 'spaces',
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

export const dataLibraryApi = {
  list(kind: CatalogEntityKind, query: { q?: string; page?: number; pageSize?: number; ids?: string[] } = {}) {
    return client<Paginated<LibraryListItem>>(
      `/${KIND_PATH[kind]}${toQueryString({
        q: query.q,
        page: query.page,
        pageSize: query.pageSize,
        ids: query.ids,
      })}`,
    )
  },

  listProductVariants(productId: string) {
    return client<{ items: LibraryProductVariant[] }>(`/products/${productId}/variants`)
  },

  listProductVariantStocks(productId: string, variantId: string) {
    return client<{ items: LibraryProductVariantStock[] }>(
      `/products/${productId}/variants/${variantId}/stocks`,
    )
  },
}
