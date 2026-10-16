import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'
import type {
  CatalogBindingMode,
  CatalogEntityKind,
  CatalogGalleryImage,
  CatalogPayload,
  CompanyCatalogItem,
  ServiceWorkflowItem,
} from '@/features/sales/types/catalog.types'
import type { LibraryProductVariantStock } from '@/features/sales/services/dataLibraryApi'

export type CompanyCatalogAttribute = {
  attributeId: string
  name: string
  description: string | null
  valueType: 'number' | 'text'
  unit: { id: string; name: string; symbol: string } | null
  values: Array<{
    id: string
    libraryValueId: string | null
    valueText: string | null
    valueNumber: number | null
    isDefault: boolean
    usedByVariants: string[]
  }>
}

export type CompanyCatalogVariant = {
  id: string
  libraryVariantId: string
  productId: string
  name: string
  sku: string
  isDefault: boolean
  values: Array<{
    attributeId: string
    attributeName: string
    attributeValueId: string
    libraryValueId: string
    valueText: string | null
    valueNumber: number | null
    valueType: 'number' | 'text'
    unitSymbol: string | null
  }>
  createdAt: string
  updatedAt: string
}

const client = createApiClient(env.webononeApiBaseUrl)

type CompanyCatalogServiceRef = {
  id: string
  libraryEntityId: string | null
}

export async function resolveCompanyCatalogServiceId(
  libraryOrCatalogId: string,
): Promise<string | null> {
  const result = await client<{ items: CompanyCatalogServiceRef[] }>('/company/me/catalog/services')
  const match = (result.items ?? []).find(
    (item) => item.id === libraryOrCatalogId || item.libraryEntityId === libraryOrCatalogId,
  )
  return match?.id ?? null
}

export const companyCatalogApi = {
  list(kind: CatalogEntityKind, query?: { q?: string }) {
    const q = query?.q?.trim()
    const qs = q ? `?q=${encodeURIComponent(q)}` : ''
    return client<{ items: CompanyCatalogItem[] }>(`/company/me/catalog/${kind}${qs}`)
  },

  get(kind: CatalogEntityKind, id: string) {
    return client<CompanyCatalogItem>(`/company/me/catalog/${kind}/${encodeURIComponent(id)}`)
  },

  getForCompany(companyId: string, kind: CatalogEntityKind, id: string) {
    return client<CompanyCatalogItem>(
      `/company/${encodeURIComponent(companyId)}/catalog/${kind}/${encodeURIComponent(id)}`,
    )
  },

  link(kind: CatalogEntityKind, libraryEntityId: string) {
    return client<CompanyCatalogItem>(`/company/me/catalog/${kind}/link`, {
      method: 'POST',
      body: JSON.stringify({ libraryEntityId }),
    })
  },

  fromLibrary(
    kind: CatalogEntityKind,
    body: {
      libraryEntityId: string
      mode: Extract<CatalogBindingMode, 'linked' | 'forked'>
      payload?: CatalogPayload
    },
  ) {
    return client<CompanyCatalogItem>(`/company/me/catalog/${kind}/from-library`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  createCustom(kind: CatalogEntityKind, payload: CatalogPayload) {
    return client<CompanyCatalogItem>(`/company/me/catalog/${kind}/custom`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  fork(
    kind: CatalogEntityKind,
    id: string,
    payload: CatalogPayload,
    galleryImages?: CatalogGalleryImage[],
  ) {
    return client<CompanyCatalogItem>(`/company/me/catalog/${kind}/${id}/fork`, {
      method: 'POST',
      body: JSON.stringify({ payload, galleryImages }),
    })
  },

  update(kind: CatalogEntityKind, id: string, payload: CatalogPayload) {
    return client<CompanyCatalogItem>(`/company/me/catalog/${kind}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  updateGallery(
    kind: CatalogEntityKind,
    id: string,
    galleryImages: { mediaId: string; url: string }[],
  ) {
    return client<CompanyCatalogItem>(`/company/me/catalog/${kind}/${id}/gallery`, {
      method: 'PATCH',
      body: JSON.stringify({ galleryImages }),
    })
  },


  suggestStockBatchNumber() {
    return client<{ batchNumber: string }>('/company/me/catalog/stocks/suggested-batch-number')
  },

  listProductVariantStocks(productId: string, variantId: string) {
    return client<{ items: LibraryProductVariantStock[] }>(
      `/company/me/catalog/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/stocks`,
    )
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
    },
  ) {
    return client<LibraryProductVariantStock>(
      `/company/me/catalog/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/stocks`,
      { method: 'POST', body },
    )
  },

  updateProductVariantStock(
    productId: string,
    variantId: string,
    stockId: string,
    body: {
      quantity: number
      batch_number: string
      cost_price: number
      sell_price: number
      purchase_date: string
      expired_date?: string | null
      supplier_user_id?: string | null
    },
  ) {
    return client<LibraryProductVariantStock>(
      `/company/me/catalog/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/stocks/${encodeURIComponent(stockId)}`,
      { method: 'PATCH', body },
    )
  },

  setProductVariantStockActive(productId: string, variantId: string, stockId: string) {
    return client<LibraryProductVariantStock>(
      `/company/me/catalog/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/stocks/${encodeURIComponent(stockId)}/active`,
      { method: 'PATCH' },
    )
  },

  listServiceWorkflow(serviceId: string) {
    return client<{ items: ServiceWorkflowItem[] }>(
      `/company/me/catalog/services/${encodeURIComponent(serviceId)}/workflow`,
    )
  },

  replaceServiceWorkflow(
    serviceId: string,
    items: {
      kind: 'check_in' | 'space'
      space_id: string | null
      staff_ids: string[]
      form_ids: string[]
      session_queue: boolean
      add_items_enabled: boolean
      add_items_from_library_enabled: boolean
    }[],
  ) {
    return client<{ items: ServiceWorkflowItem[] }>(
      `/company/me/catalog/services/${encodeURIComponent(serviceId)}/workflow`,
      {
        method: 'PUT',
        body: JSON.stringify({ items }),
      },
    )
  },

  async remove(kind: CatalogEntityKind, id: string) {
    await client<unknown>(`/company/me/catalog/${kind}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },

  ensureLibraryLink(kind: CatalogEntityKind, id: string) {
    return client<{ libraryEntityId: string }>(
      `/company/me/catalog/${kind}/${encodeURIComponent(id)}/ensure-library`,
      { method: 'POST' },
    )
  },

  listCopiedAttributes(kind: CatalogEntityKind, id: string) {
    return client<{ libraryEntityId: string | null; attributes: CompanyCatalogAttribute[] }>(
      `/company/me/catalog/${kind}/${encodeURIComponent(id)}/attributes`,
    )
  },

  attachAttributesToLibrary(kind: CatalogEntityKind, id: string, attributeIds: string[]) {
    return client<{
      libraryEntityId: string
      attributes: CompanyCatalogAttribute[]
    }>(
      `/company/me/catalog/${kind}/${encodeURIComponent(id)}/attributes/attach-to-library`,
      { method: 'POST', body: JSON.stringify({ attributeIds }) },
    )
  },

  copyAttributesFromLibrary(kind: CatalogEntityKind, id: string, attributeIds: string[]) {
    return client<{ libraryEntityId: string | null; attributes: CompanyCatalogAttribute[] }>(
      `/company/me/catalog/${kind}/${encodeURIComponent(id)}/attributes/from-library`,
      { method: 'POST', body: JSON.stringify({ attributeIds }) },
    )
  },

  deleteCopiedAttribute(kind: CatalogEntityKind, id: string, attributeId: string) {
    return client<void>(
      `/company/me/catalog/${kind}/${encodeURIComponent(id)}/attributes/${encodeURIComponent(attributeId)}`,
      { method: 'DELETE' },
    )
  },

  copyAttributeValuesFromLibrary(kind: CatalogEntityKind, id: string, libraryValueIds: string[]) {
    return client<{ libraryEntityId: string | null; attributes: CompanyCatalogAttribute[] }>(
      `/company/me/catalog/${kind}/${encodeURIComponent(id)}/attribute-values/from-library`,
      { method: 'POST', body: JSON.stringify({ libraryValueIds }) },
    )
  },

  createCopiedAttributeValue(
    kind: CatalogEntityKind,
    id: string,
    attributeId: string,
    body: { valueText?: string | null; valueNumber?: number | null },
  ) {
    return client<{ libraryEntityId: string | null; attributes: CompanyCatalogAttribute[] }>(
      `/company/me/catalog/${kind}/${encodeURIComponent(id)}/attributes/${encodeURIComponent(attributeId)}/values`,
      { method: 'POST', body: JSON.stringify(body) },
    )
  },

  updateCopiedAttributeValue(
    kind: CatalogEntityKind,
    id: string,
    valueId: string,
    body: { valueText?: string | null; valueNumber?: number | null },
  ) {
    return client<void>(
      `/company/me/catalog/${kind}/${encodeURIComponent(id)}/attribute-values/${encodeURIComponent(valueId)}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    )
  },

  setCopiedAttributeValueDefault(kind: CatalogEntityKind, id: string, valueId: string) {
    return client<void>(
      `/company/me/catalog/${kind}/${encodeURIComponent(id)}/attribute-values/${encodeURIComponent(valueId)}/default`,
      { method: 'PATCH' },
    )
  },

  deleteCopiedAttributeValue(kind: CatalogEntityKind, id: string, valueId: string) {
    return client<void>(
      `/company/me/catalog/${kind}/${encodeURIComponent(id)}/attribute-values/${encodeURIComponent(valueId)}`,
      { method: 'DELETE' },
    )
  },

  listCopiedVariants(productId: string) {
    return client<{ libraryEntityId: string | null; items: CompanyCatalogVariant[] }>(
      `/company/me/catalog/products/${encodeURIComponent(productId)}/variants`,
    )
  },

  getCopiedVariant(productId: string, variantId: string) {
    return client<CompanyCatalogVariant>(
      `/company/me/catalog/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`,
    )
  },

  copyVariantsFromLibrary(productId: string, libraryVariantIds: string[]) {
    return client<{ libraryEntityId: string | null; items: CompanyCatalogVariant[] }>(
      `/company/me/catalog/products/${encodeURIComponent(productId)}/variants/from-library`,
      { method: 'POST', body: JSON.stringify({ libraryVariantIds }) },
    )
  },

  updateCopiedVariantAttributeValues(
    productId: string,
    variantId: string,
    libraryValueIds: string[],
  ) {
    return client<CompanyCatalogVariant>(
      `/company/me/catalog/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/attribute-values`,
      { method: 'PATCH', body: JSON.stringify({ libraryValueIds }) },
    )
  },

  deleteCopiedVariant(productId: string, variantId: string) {
    return client<void>(
      `/company/me/catalog/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`,
      { method: 'DELETE' },
    )
  },
}
