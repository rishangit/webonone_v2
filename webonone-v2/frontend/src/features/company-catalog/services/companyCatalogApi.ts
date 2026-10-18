import { apiClient } from '@/shared/services/apiClient'
import type { LibraryProductVariantStock } from '@/features/company-catalog/services/dataLibraryApi'
import type {
  CatalogDiscountBody,
  CatalogPriceBody,
} from '@/features/company-catalog/schemas/catalogPricingSchemas'
import type {
  CatalogDiscount,
  CatalogDiscountKind,
  CatalogPrice,
  CatalogPriceKind,
} from '@/features/company-catalog/types/catalogPricing.types'
import type {
  CatalogBindingMode,
  CatalogEntityKind,
  CatalogGalleryImage,
  CatalogPayload,
  CatalogSessionItem,
  CatalogSessionTokenItem,
  CompanyCatalogItem,
  ServiceWorkflowItem,
  WebPublishStatus,
} from '../types/companyCatalog.types'

export type CatalogShareChannelResult = 'sent' | 'failed' | 'skipped'

export type CatalogShareResult = {
  email: CatalogShareChannelResult
  sms: CatalogShareChannelResult
}

export type CompanyCatalogAttributeValue = {
  id: string
  libraryValueId: string | null
  valueText: string | null
  valueNumber: number | null
  isDefault: boolean
  usedByVariants: string[]
}

export type CompanyCatalogAttribute = {
  attributeId: string
  name: string
  description: string | null
  valueType: 'number' | 'text'
  unit: { id: string; name: string; symbol: string } | null
  values: CompanyCatalogAttributeValue[]
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

function catalogListQuery(kind: CatalogEntityKind, query?: { q?: string }): string {
  const params = new URLSearchParams()
  const q = query?.q?.trim()
  if (q) params.set('q', q)
  if (kind === 'services' || kind === 'spaces') {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    params.set('atWeekday', String(now.getDay()))
    params.set('atMinutes', String(now.getHours() * 60 + now.getMinutes()))
    params.set('atDate', `${now.getFullYear()}-${month}-${day}`)
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const companyCatalogApi = {
  list(kind: CatalogEntityKind, query?: { q?: string }) {
    return apiClient<{ items: CompanyCatalogItem[] }>(
      `/company/me/catalog/${kind}${catalogListQuery(kind, query)}`,
    )
  },

  /** Membership-scoped list (Settings → My Companies; no company JWT session required). */
  listForCompany(companyId: string, kind: CatalogEntityKind, query?: { q?: string }) {
    return apiClient<{ items: CompanyCatalogItem[] }>(
      `/company/${encodeURIComponent(companyId)}/catalog/${kind}${catalogListQuery(kind, query)}`,
    )
  },

  /** Discover preview list (Find Companies dialog, before connect). */
  listForDiscover(companyId: string, kind: CatalogEntityKind, query?: { q?: string }) {
    return apiClient<{ items: CompanyCatalogItem[] }>(
      `/company/discover/${encodeURIComponent(companyId)}/catalog/${kind}${catalogListQuery(kind, query)}`,
    )
  },

  get(kind: CatalogEntityKind, id: string) {
    return apiClient<CompanyCatalogItem>(
      `/company/me/catalog/${kind}/${id}${catalogListQuery(kind)}`,
    )
  },

  getForCompany(companyId: string, kind: CatalogEntityKind, id: string) {
    return apiClient<CompanyCatalogItem>(
      `/company/${encodeURIComponent(companyId)}/catalog/${kind}/${encodeURIComponent(id)}${catalogListQuery(kind)}`,
    )
  },

  link(kind: CatalogEntityKind, libraryEntityId: string) {
    return apiClient<CompanyCatalogItem>(`/company/me/catalog/${kind}/link`, {
      method: 'POST',
      body: JSON.stringify({ libraryEntityId }),
    })
  },

  fromLibrary(
    kind: CatalogEntityKind,
    body: { libraryEntityId: string; mode: Extract<CatalogBindingMode, 'linked' | 'forked'>; payload?: CatalogPayload },
  ) {
    return apiClient<CompanyCatalogItem>(`/company/me/catalog/${kind}/from-library`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  createCustom(kind: CatalogEntityKind, payload: CatalogPayload) {
    return apiClient<CompanyCatalogItem>(`/company/me/catalog/${kind}/custom`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  fork(kind: CatalogEntityKind, id: string, payload: CatalogPayload, galleryImages?: CatalogGalleryImage[]) {
    return apiClient<CompanyCatalogItem>(`/company/me/catalog/${kind}/${id}/fork`, {
      method: 'POST',
      body: JSON.stringify({ payload, galleryImages }),
    })
  },

  update(kind: CatalogEntityKind, id: string, payload: CatalogPayload) {
    return apiClient<CompanyCatalogItem>(`/company/me/catalog/${kind}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  updateGallery(
    kind: Extract<CatalogEntityKind, 'products' | 'services' | 'spaces'>,
    id: string,
    galleryImages: { mediaId: string; url: string }[],
  ) {
    return apiClient<CompanyCatalogItem>(`/company/me/catalog/${kind}/${id}/gallery`, {
      method: 'PATCH',
      body: JSON.stringify({ galleryImages }),
    })
  },

  updateWebPublish(
    kind: Extract<CatalogEntityKind, 'products' | 'services' | 'spaces'>,
    id: string,
    webPublishStatus: WebPublishStatus,
  ) {
    return apiClient<CompanyCatalogItem>(`/company/me/catalog/${kind}/${id}/web-publish`, {
      method: 'PATCH',
      body: JSON.stringify({ webPublishStatus }),
    })
  },

  shareItem(
    kind: Extract<CatalogEntityKind, 'products' | 'services' | 'spaces'>,
    id: string,
    body: { email?: string; phone?: string },
  ) {
    return apiClient<CatalogShareResult>(`/company/me/catalog/${kind}/${id}/share`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  listPrices(kind: CatalogPriceKind, id: string, companyId?: string) {
    const path = companyId
      ? `/company/${companyId}/catalog/${kind}/${id}/prices`
      : `/company/me/catalog/${kind}/${id}/prices`
    return apiClient<{ items: CatalogPrice[] }>(path)
  },

  createPrice(kind: CatalogPriceKind, id: string, body: CatalogPriceBody) {
    return apiClient<CatalogPrice>(`/company/me/catalog/${kind}/${id}/prices`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  updatePrice(kind: CatalogPriceKind, id: string, priceId: string, body: CatalogPriceBody) {
    return apiClient<CatalogPrice>(`/company/me/catalog/${kind}/${id}/prices/${priceId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  activatePrice(kind: CatalogPriceKind, id: string, priceId: string) {
    return apiClient<CatalogPrice>(`/company/me/catalog/${kind}/${id}/prices/${priceId}/active`, {
      method: 'POST',
    })
  },

  deletePrice(kind: CatalogPriceKind, id: string, priceId: string) {
    return apiClient<void>(`/company/me/catalog/${kind}/${id}/prices/${priceId}`, {
      method: 'DELETE',
    })
  },

  listDiscounts(kind: CatalogDiscountKind, id: string, companyId?: string) {
    const path = companyId
      ? `/company/${companyId}/catalog/${kind}/${id}/discounts`
      : `/company/me/catalog/${kind}/${id}/discounts`
    return apiClient<{ items: CatalogDiscount[] }>(path)
  },

  createDiscount(kind: CatalogDiscountKind, id: string, body: CatalogDiscountBody) {
    return apiClient<CatalogDiscount>(`/company/me/catalog/${kind}/${id}/discounts`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  updateDiscount(kind: CatalogDiscountKind, id: string, discountId: string, body: CatalogDiscountBody) {
    return apiClient<CatalogDiscount>(`/company/me/catalog/${kind}/${id}/discounts/${discountId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  deleteDiscount(kind: CatalogDiscountKind, id: string, discountId: string) {
    return apiClient<void>(`/company/me/catalog/${kind}/${id}/discounts/${discountId}`, {
      method: 'DELETE',
    })
  },

  listProductVariantStockLimits(productId: string) {
    return apiClient<{
      items: Array<{
        libraryVariantId: string
        companyVariantId?: string | null
        minQuantity: number | null
        maxQuantity: number | null
      }>
    }>(`/company/me/catalog/products/${encodeURIComponent(productId)}/variant-stock-limits`, {
      cache: 'no-store',
    })
  },

  getProductVariantStockLimits(productId: string, variantId: string) {
    return apiClient<{
      libraryVariantId: string
      minQuantity: number | null
      maxQuantity: number | null
    }>(
      `/company/me/catalog/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/stock-limits`,
      { cache: 'no-store' },
    )
  },

  upsertProductVariantStockLimits(
    productId: string,
    variantId: string,
    body: { minQuantity: number | null; maxQuantity: number | null },
  ) {
    return apiClient<{
      libraryVariantId: string
      minQuantity: number | null
      maxQuantity: number | null
    }>(
      `/company/me/catalog/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/stock-limits`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
        cache: 'no-store',
      },
    )
  },

  suggestStockBatchNumber() {
    return apiClient<{ batchNumber: string }>('/company/me/catalog/stocks/suggested-batch-number')
  },

  listProductVariantStocks(productId: string, variantId: string) {
    return apiClient<{ items: LibraryProductVariantStock[] }>(
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
    return apiClient<LibraryProductVariantStock>(
      `/company/me/catalog/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/stocks`,
      { method: 'POST', body: JSON.stringify(body) },
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
    return apiClient<LibraryProductVariantStock>(
      `/company/me/catalog/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/stocks/${encodeURIComponent(stockId)}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    )
  },

  setProductVariantStockActive(productId: string, variantId: string, stockId: string) {
    return apiClient<LibraryProductVariantStock>(
      `/company/me/catalog/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/stocks/${encodeURIComponent(stockId)}/active`,
      { method: 'PATCH' },
    )
  },

  updateServiceForm(id: string, formTemplateId: string | null) {
    return apiClient<CompanyCatalogItem>(`/company/me/catalog/services/${id}/form`, {
      method: 'PATCH',
      body: JSON.stringify({ formTemplateId }),
    })
  },

  listServiceWorkflow(serviceId: string) {
    return apiClient<{ items: ServiceWorkflowItem[] }>(
      `/company/me/catalog/services/${encodeURIComponent(serviceId)}/workflow`,
    )
  },

  listServiceWorkflowForCompany(companyId: string, serviceId: string) {
    return apiClient<{ items: ServiceWorkflowItem[] }>(
      `/company/${encodeURIComponent(companyId)}/catalog/services/${encodeURIComponent(serviceId)}/workflow`,
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
    return apiClient<{ items: ServiceWorkflowItem[] }>(
      `/company/me/catalog/services/${encodeURIComponent(serviceId)}/workflow`,
      {
        method: 'PUT',
        body: JSON.stringify({ items }),
      },
    )
  },

  listServicesWithForm() {
    return apiClient<{ items: CompanyCatalogItem[] }>('/company/me/catalog/services/with-form')
  },

  async remove(kind: CatalogEntityKind, id: string) {
    await apiClient<unknown>(`/company/me/catalog/${kind}/${id}`, { method: 'DELETE' })
  },

  listSessionsForCompany(
    companyId: string,
    serviceId: string,
    range?: { from?: string; to?: string },
  ) {
    const params = new URLSearchParams()
    if (range?.from) params.set('from', range.from)
    if (range?.to) params.set('to', range.to)
    const qs = params.toString()
    return apiClient<{ items: CatalogSessionItem[] }>(
      `/company/${encodeURIComponent(companyId)}/catalog/services/${encodeURIComponent(serviceId)}/sessions${qs ? `?${qs}` : ''}`,
    ).then((data) => data.items ?? [])
  },

  getNextToken(companyId: string, serviceId: string, eventId: string, occurrenceDate: string) {
    return apiClient<{ tokenNumber: number; tokenLabel: string }>(
      memberSessionTokenPath(companyId, serviceId, eventId, occurrenceDate, 'next'),
    )
  },

  async getMyToken(
    companyId: string,
    serviceId: string,
    eventId: string,
    occurrenceDate: string,
  ): Promise<CatalogSessionTokenItem | null> {
    try {
      return await apiClient<CatalogSessionTokenItem>(
        memberSessionTokenPath(companyId, serviceId, eventId, occurrenceDate, 'mine'),
      )
    } catch (err) {
      if (err instanceof Error && err.message === 'No token for this session') return null
      throw err
    }
  },

  bookToken(
    companyId: string,
    serviceId: string,
    eventId: string,
    occurrenceDate: string,
    body?: Record<string, never>,
  ) {
    return apiClient<CatalogSessionTokenItem>(
      memberSessionTokenPath(companyId, serviceId, eventId, occurrenceDate),
      { method: 'POST', body: JSON.stringify(body ?? {}) },
    )
  },

  ensureLibraryLink(kind: CatalogEntityKind, id: string) {
    return apiClient<{ libraryEntityId: string }>(
      `/company/me/catalog/${kind}/${encodeURIComponent(id)}/ensure-library`,
      { method: 'POST' },
    )
  },

  listCopiedAttributes(kind: CatalogEntityKind, id: string) {
    return apiClient<{
      libraryEntityId: string | null
      attributes: CompanyCatalogAttribute[]
    }>(`/company/me/catalog/${kind}/${encodeURIComponent(id)}/attributes`)
  },

  attachAttributesToLibrary(kind: CatalogEntityKind, id: string, attributeIds: string[]) {
    return apiClient<{
      libraryEntityId: string
      attributes: Array<{
        attributeId: string
        name: string
        valueType: 'number' | 'text'
        unit: { id: string; name: string; symbol: string } | null
        values: CompanyCatalogAttributeValue[]
      }>
    }>(`/company/me/catalog/${kind}/${encodeURIComponent(id)}/attributes/attach-to-library`, {
      method: 'POST',
      body: JSON.stringify({ attributeIds }),
    })
  },

  copyAttributesFromLibrary(kind: CatalogEntityKind, id: string, attributeIds: string[]) {
    return apiClient<{
      libraryEntityId: string | null
      attributes: CompanyCatalogAttribute[]
    }>(`/company/me/catalog/${kind}/${encodeURIComponent(id)}/attributes/from-library`, {
      method: 'POST',
      body: JSON.stringify({ attributeIds }),
    })
  },

  deleteCopiedAttribute(kind: CatalogEntityKind, id: string, attributeId: string) {
    return apiClient<void>(
      `/company/me/catalog/${kind}/${encodeURIComponent(id)}/attributes/${encodeURIComponent(attributeId)}`,
      { method: 'DELETE' },
    )
  },

  copyAttributeValuesFromLibrary(kind: CatalogEntityKind, id: string, libraryValueIds: string[]) {
    return apiClient<{
      libraryEntityId: string | null
      attributes: CompanyCatalogAttribute[]
    }>(`/company/me/catalog/${kind}/${encodeURIComponent(id)}/attribute-values/from-library`, {
      method: 'POST',
      body: JSON.stringify({ libraryValueIds }),
    })
  },

  createCopiedAttributeValue(
    kind: CatalogEntityKind,
    id: string,
    attributeId: string,
    body: { valueText?: string | null; valueNumber?: number | null },
  ) {
    return apiClient<{
      libraryEntityId: string | null
      attributes: CompanyCatalogAttribute[]
    }>(
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
    return apiClient<void>(
      `/company/me/catalog/${kind}/${encodeURIComponent(id)}/attribute-values/${encodeURIComponent(valueId)}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    )
  },

  setCopiedAttributeValueDefault(kind: CatalogEntityKind, id: string, valueId: string) {
    return apiClient<void>(
      `/company/me/catalog/${kind}/${encodeURIComponent(id)}/attribute-values/${encodeURIComponent(valueId)}/default`,
      { method: 'PATCH' },
    )
  },

  deleteCopiedAttributeValue(kind: CatalogEntityKind, id: string, valueId: string) {
    return apiClient<void>(
      `/company/me/catalog/${kind}/${encodeURIComponent(id)}/attribute-values/${encodeURIComponent(valueId)}`,
      { method: 'DELETE' },
    )
  },

  listCopiedVariants(productId: string) {
    return apiClient<{ libraryEntityId: string | null; items: CompanyCatalogVariant[] }>(
      `/company/me/catalog/products/${encodeURIComponent(productId)}/variants`,
    )
  },

  getCopiedVariant(productId: string, variantId: string) {
    return apiClient<CompanyCatalogVariant>(
      `/company/me/catalog/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`,
    )
  },

  copyVariantsFromLibrary(productId: string, libraryVariantIds: string[]) {
    return apiClient<{ libraryEntityId: string | null; items: CompanyCatalogVariant[] }>(
      `/company/me/catalog/products/${encodeURIComponent(productId)}/variants/from-library`,
      { method: 'POST', body: JSON.stringify({ libraryVariantIds }) },
    )
  },

  updateCopiedVariantAttributeValues(
    productId: string,
    variantId: string,
    libraryValueIds: string[],
  ) {
    return apiClient<CompanyCatalogVariant>(
      `/company/me/catalog/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/attribute-values`,
      {
        method: 'PATCH',
        body: JSON.stringify({ libraryValueIds }),
      },
    )
  },

  deleteCopiedVariant(productId: string, variantId: string) {
    return apiClient<void>(
      `/company/me/catalog/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`,
      { method: 'DELETE' },
    )
  },
}

function memberSessionTokenPath(
  companyId: string,
  serviceId: string,
  eventId: string,
  occurrenceDate: string,
  suffix?: 'next' | 'mine',
): string {
  const base = `/company/${encodeURIComponent(companyId)}/catalog/services/${encodeURIComponent(serviceId)}/sessions/${encodeURIComponent(eventId)}/${encodeURIComponent(occurrenceDate)}/tokens`
  return suffix ? `${base}/${suffix}` : base
}
