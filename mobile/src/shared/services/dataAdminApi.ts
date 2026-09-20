import { env } from '@/shared/config/env'
import type {
  Attribute,
  CatalogGalleryImage,
  CatalogItem,
  DataListQuery,
  PaginatedResult,
  ProductVariant,
  Tag,
  Unit,
} from '@/shared/types/data.types'
import { createApiClient } from './apiClient'

const client = createApiClient(env.dataApiBaseUrl)

function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value))
    }
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export const dataAdminApi = {
  listTags(query: DataListQuery = {}) {
    return client<PaginatedResult<Tag>>(`/tags${toQueryString(query)}`)
  },

  getTag(id: string) {
    return client<Tag>(`/tags/${id}`)
  },

  createTag(body: { name: string; color: string; description?: string | null; status?: string }) {
    return client<Tag>('/tags', { method: 'POST', body })
  },

  updateTag(id: string, body: Record<string, unknown>) {
    return client<Tag>(`/tags/${id}`, { method: 'PATCH', body })
  },

  deleteTag(id: string) {
    return client<void>(`/tags/${id}`, { method: 'DELETE' })
  },

  listUnits(query: DataListQuery = {}) {
    return client<PaginatedResult<Unit>>(`/units${toQueryString(query)}`)
  },

  getUnit(id: string) {
    return client<Unit>(`/units/${id}`)
  },

  createUnit(body: Record<string, unknown>) {
    return client<Unit>('/units', { method: 'POST', body })
  },

  updateUnit(id: string, body: Record<string, unknown>) {
    return client<Unit>(`/units/${id}`, { method: 'PATCH', body })
  },

  deleteUnit(id: string) {
    return client<void>(`/units/${id}`, { method: 'DELETE' })
  },

  listAttributes(query: DataListQuery = {}) {
    return client<PaginatedResult<Attribute>>(`/attributes${toQueryString(query)}`)
  },

  getAttribute(id: string) {
    return client<Attribute>(`/attributes/${id}`)
  },

  createAttribute(body: Record<string, unknown>) {
    return client<Attribute>('/attributes', { method: 'POST', body })
  },

  updateAttribute(id: string, body: Record<string, unknown>) {
    return client<Attribute>(`/attributes/${id}`, { method: 'PATCH', body })
  },

  deleteAttribute(id: string) {
    return client<void>(`/attributes/${id}`, { method: 'DELETE' })
  },

  listProducts(query: DataListQuery = {}) {
    return client<PaginatedResult<CatalogItem>>(`/products${toQueryString(query)}`)
  },

  getProduct(id: string) {
    return client<CatalogItem>(`/products/${id}`)
  },

  createProduct(body: Record<string, unknown>) {
    return client<CatalogItem>('/products', { method: 'POST', body })
  },

  updateProduct(id: string, body: Record<string, unknown>) {
    return client<CatalogItem>(`/products/${id}`, { method: 'PATCH', body })
  },

  deleteProduct(id: string) {
    return client<void>(`/products/${id}`, { method: 'DELETE' })
  },

  updateProductGallery(id: string, galleryImages: CatalogGalleryImage[]) {
    return client<CatalogItem>(`/products/${id}/gallery`, {
      method: 'PATCH',
      body: { galleryImages },
    })
  },

  replaceProductAttributes(id: string, attributeIds: string[]) {
    return client<CatalogItem>(`/products/${id}/attributes`, {
      method: 'PUT',
      body: { attribute_ids: attributeIds },
    })
  },

  listProductVariants(productId: string) {
    return client<{ items: ProductVariant[] }>(`/products/${productId}/variants`)
  },

  createProductVariant(
    productId: string,
    body: {
      name: string
      sku: string
      kind: 'default' | 'custom'
      attribute_value_ids?: string[]
    },
  ) {
    return client<ProductVariant>(`/products/${productId}/variants`, { method: 'POST', body })
  },

  deleteProductVariant(productId: string, variantId: string) {
    return client<void>(`/products/${productId}/variants/${variantId}`, { method: 'DELETE' })
  },

  listServices(query: DataListQuery = {}) {
    return client<PaginatedResult<CatalogItem>>(`/services${toQueryString(query)}`)
  },

  getService(id: string) {
    return client<CatalogItem>(`/services/${id}`)
  },

  createService(body: Record<string, unknown>) {
    return client<CatalogItem>('/services', { method: 'POST', body })
  },

  updateService(id: string, body: Record<string, unknown>) {
    return client<CatalogItem>(`/services/${id}`, { method: 'PATCH', body })
  },

  deleteService(id: string) {
    return client<void>(`/services/${id}`, { method: 'DELETE' })
  },

  updateServiceGallery(id: string, galleryImages: CatalogGalleryImage[]) {
    return client<CatalogItem>(`/services/${id}/gallery`, {
      method: 'PATCH',
      body: { galleryImages },
    })
  },

  replaceServiceAttributes(id: string, attributeIds: string[]) {
    return client<CatalogItem>(`/services/${id}/attributes`, {
      method: 'PUT',
      body: { attribute_ids: attributeIds },
    })
  },

  listSpaces(query: DataListQuery = {}) {
    return client<PaginatedResult<CatalogItem>>(`/spaces${toQueryString(query)}`)
  },

  getSpace(id: string) {
    return client<CatalogItem>(`/spaces/${id}`)
  },

  createSpace(body: Record<string, unknown>) {
    return client<CatalogItem>('/spaces', { method: 'POST', body })
  },

  updateSpace(id: string, body: Record<string, unknown>) {
    return client<CatalogItem>(`/spaces/${id}`, { method: 'PATCH', body })
  },

  deleteSpace(id: string) {
    return client<void>(`/spaces/${id}`, { method: 'DELETE' })
  },

  updateSpaceGallery(id: string, galleryImages: CatalogGalleryImage[]) {
    return client<CatalogItem>(`/spaces/${id}/gallery`, {
      method: 'PATCH',
      body: { galleryImages },
    })
  },

  replaceSpaceAttributes(id: string, attributeIds: string[]) {
    return client<CatalogItem>(`/spaces/${id}/attributes`, {
      method: 'PUT',
      body: { attribute_ids: attributeIds },
    })
  },
}
