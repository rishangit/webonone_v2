import { apiClient } from '@/shared/services/apiClient'
import type {
  Attribute,
  CatalogItem,
  DashboardStats,
  PaginatedResult,
  ProductVariant,
  Tag,
  Unit,
} from '@/shared/types/data.types'

export type ListQuery = {
  q?: string
  status?: string
  page?: number
  pageSize?: number
  sort?: string
  value_type?: string
  is_base?: string
  tag_id?: string | string[]
  ids?: string | string[]
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

export const dataApi = {
  getDashboardStats() {
    return apiClient<DashboardStats>('/dashboard/stats')
  },

  listTags(query: ListQuery = {}) {
    return apiClient<PaginatedResult<Tag>>(`/tags${toQueryString(query)}`)
  },
  getTag(id: string) {
    return apiClient<Tag>(`/tags/${id}`)
  },
  createTag(body: Partial<Tag> & { name: string; color: string }) {
    return apiClient<Tag>('/tags', { method: 'POST', body: JSON.stringify(body) })
  },
  updateTag(id: string, body: Partial<Tag>) {
    return apiClient<Tag>(`/tags/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
  },
  deleteTag(id: string) {
    return apiClient<void>(`/tags/${id}`, { method: 'DELETE' })
  },

  listUnits(query: ListQuery = {}) {
    return apiClient<PaginatedResult<Unit>>(`/units${toQueryString(query)}`)
  },
  getUnit(id: string) {
    return apiClient<Unit>(`/units/${id}`)
  },
  createUnit(body: Record<string, unknown>) {
    return apiClient<Unit>('/units', { method: 'POST', body: JSON.stringify(body) })
  },
  updateUnit(id: string, body: Record<string, unknown>) {
    return apiClient<Unit>(`/units/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
  },
  deleteUnit(id: string) {
    return apiClient<void>(`/units/${id}`, { method: 'DELETE' })
  },

  listAttributes(query: ListQuery = {}) {
    return apiClient<PaginatedResult<Attribute>>(`/attributes${toQueryString(query)}`)
  },
  getAttribute(id: string) {
    return apiClient<Attribute>(`/attributes/${id}`)
  },
  createAttribute(body: Record<string, unknown>) {
    return apiClient<Attribute>('/attributes', { method: 'POST', body: JSON.stringify(body) })
  },
  updateAttribute(id: string, body: Record<string, unknown>) {
    return apiClient<Attribute>(`/attributes/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
  },
  deleteAttribute(id: string) {
    return apiClient<void>(`/attributes/${id}`, { method: 'DELETE' })
  },

  listProducts(query: ListQuery = {}) {
    return apiClient<PaginatedResult<CatalogItem>>(`/products${toQueryString(query)}`)
  },
  getProduct(id: string) {
    return apiClient<CatalogItem>(`/products/${id}`)
  },
  createProduct(body: Record<string, unknown>) {
    return apiClient<CatalogItem>('/products', { method: 'POST', body: JSON.stringify(body) })
  },
  updateProduct(id: string, body: Record<string, unknown>) {
    return apiClient<CatalogItem>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
  },
  deleteProduct(id: string) {
    return apiClient<void>(`/products/${id}`, { method: 'DELETE' })
  },
  updateProductGallery(id: string, galleryImages: { mediaId: string; url: string }[]) {
    return apiClient<CatalogItem>(`/products/${id}/gallery`, {
      method: 'PATCH',
      body: JSON.stringify({ galleryImages }),
    })
  },
  replaceProductAttributes(id: string, attributeIds: string[]) {
    return apiClient<CatalogItem>(`/products/${id}/attributes`, {
      method: 'PUT',
      body: JSON.stringify({ attribute_ids: attributeIds }),
    })
  },
  addProductAttributeValue(
    id: string,
    attributeId: string,
    body: { value_text?: string | null; value_number?: number | null },
  ) {
    return apiClient<CatalogItem>(`/products/${id}/attributes/${attributeId}/values`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  updateProductAttributeValue(
    id: string,
    valueId: string,
    body: { value_text?: string | null; value_number?: number | null },
  ) {
    return apiClient<CatalogItem>(`/products/${id}/attribute-values/${valueId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },
  setProductAttributeValueDefault(id: string, valueId: string) {
    return apiClient<CatalogItem>(`/products/${id}/attribute-values/${valueId}/default`, {
      method: 'PATCH',
    })
  },
  deleteProductAttributeValue(id: string, valueId: string) {
    return apiClient<CatalogItem>(`/products/${id}/attribute-values/${valueId}`, {
      method: 'DELETE',
    })
  },
  listProductVariants(productId: string) {
    return apiClient<{ items: ProductVariant[] }>(`/products/${productId}/variants`)
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
    return apiClient<ProductVariant>(`/products/${productId}/variants`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  listServices(query: ListQuery = {}) {
    return apiClient<PaginatedResult<CatalogItem>>(`/services${toQueryString(query)}`)
  },
  getService(id: string) {
    return apiClient<CatalogItem>(`/services/${id}`)
  },
  createService(body: Record<string, unknown>) {
    return apiClient<CatalogItem>('/services', { method: 'POST', body: JSON.stringify(body) })
  },
  updateService(id: string, body: Record<string, unknown>) {
    return apiClient<CatalogItem>(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
  },
  deleteService(id: string) {
    return apiClient<void>(`/services/${id}`, { method: 'DELETE' })
  },
  updateServiceGallery(id: string, galleryImages: { mediaId: string; url: string }[]) {
    return apiClient<CatalogItem>(`/services/${id}/gallery`, {
      method: 'PATCH',
      body: JSON.stringify({ galleryImages }),
    })
  },
  replaceServiceAttributes(id: string, attributeIds: string[]) {
    return apiClient<CatalogItem>(`/services/${id}/attributes`, {
      method: 'PUT',
      body: JSON.stringify({ attribute_ids: attributeIds }),
    })
  },
  addServiceAttributeValue(
    id: string,
    attributeId: string,
    body: { value_text?: string | null; value_number?: number | null },
  ) {
    return apiClient<CatalogItem>(`/services/${id}/attributes/${attributeId}/values`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  updateServiceAttributeValue(
    id: string,
    valueId: string,
    body: { value_text?: string | null; value_number?: number | null },
  ) {
    return apiClient<CatalogItem>(`/services/${id}/attribute-values/${valueId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },
  setServiceAttributeValueDefault(id: string, valueId: string) {
    return apiClient<CatalogItem>(`/services/${id}/attribute-values/${valueId}/default`, {
      method: 'PATCH',
    })
  },
  deleteServiceAttributeValue(id: string, valueId: string) {
    return apiClient<CatalogItem>(`/services/${id}/attribute-values/${valueId}`, {
      method: 'DELETE',
    })
  },

  listSpaces(query: ListQuery = {}) {
    return apiClient<PaginatedResult<CatalogItem>>(`/spaces${toQueryString(query)}`)
  },
  getSpace(id: string) {
    return apiClient<CatalogItem>(`/spaces/${id}`)
  },
  createSpace(body: Record<string, unknown>) {
    return apiClient<CatalogItem>('/spaces', { method: 'POST', body: JSON.stringify(body) })
  },
  updateSpace(id: string, body: Record<string, unknown>) {
    return apiClient<CatalogItem>(`/spaces/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
  },
  deleteSpace(id: string) {
    return apiClient<void>(`/spaces/${id}`, { method: 'DELETE' })
  },
  updateSpaceGallery(id: string, galleryImages: { mediaId: string; url: string }[]) {
    return apiClient<CatalogItem>(`/spaces/${id}/gallery`, {
      method: 'PATCH',
      body: JSON.stringify({ galleryImages }),
    })
  },
  replaceSpaceAttributes(id: string, attributeIds: string[]) {
    return apiClient<CatalogItem>(`/spaces/${id}/attributes`, {
      method: 'PUT',
      body: JSON.stringify({ attribute_ids: attributeIds }),
    })
  },
  addSpaceAttributeValue(
    id: string,
    attributeId: string,
    body: { value_text?: string | null; value_number?: number | null },
  ) {
    return apiClient<CatalogItem>(`/spaces/${id}/attributes/${attributeId}/values`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  updateSpaceAttributeValue(
    id: string,
    valueId: string,
    body: { value_text?: string | null; value_number?: number | null },
  ) {
    return apiClient<CatalogItem>(`/spaces/${id}/attribute-values/${valueId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },
  setSpaceAttributeValueDefault(id: string, valueId: string) {
    return apiClient<CatalogItem>(`/spaces/${id}/attribute-values/${valueId}/default`, {
      method: 'PATCH',
    })
  },
  deleteSpaceAttributeValue(id: string, valueId: string) {
    return apiClient<CatalogItem>(`/spaces/${id}/attribute-values/${valueId}`, {
      method: 'DELETE',
    })
  },
}
