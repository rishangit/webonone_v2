import { apiClient } from '@/shared/services/apiClient'
import type {
  CatalogBindingMode,
  CatalogEntityKind,
  CatalogGalleryImage,
  CatalogPayload,
  CompanyCatalogItem,
} from '../types/companyCatalog.types'

export const companyCatalogApi = {
  list(kind: CatalogEntityKind, query?: { q?: string }) {
    const q = query?.q?.trim()
    const qs = q ? `?q=${encodeURIComponent(q)}` : ''
    return apiClient<{ items: CompanyCatalogItem[] }>(`/company/me/catalog/${kind}${qs}`)
  },

  /** Membership-scoped list (Settings → My Companies; no company JWT session required). */
  listForCompany(companyId: string, kind: CatalogEntityKind, query?: { q?: string }) {
    const q = query?.q?.trim()
    const qs = q ? `?q=${encodeURIComponent(q)}` : ''
    return apiClient<{ items: CompanyCatalogItem[] }>(
      `/company/${encodeURIComponent(companyId)}/catalog/${kind}${qs}`,
    )
  },

  get(kind: CatalogEntityKind, id: string) {
    return apiClient<CompanyCatalogItem>(`/company/me/catalog/${kind}/${id}`)
  },

  getForCompany(companyId: string, kind: CatalogEntityKind, id: string) {
    return apiClient<CompanyCatalogItem>(
      `/company/${encodeURIComponent(companyId)}/catalog/${kind}/${encodeURIComponent(id)}`,
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

  updatePricing(
    kind: Extract<CatalogEntityKind, 'products' | 'services' | 'spaces'>,
    id: string,
    listPrice: number | null,
  ) {
    return apiClient<CompanyCatalogItem>(`/company/me/catalog/${kind}/${id}/pricing`, {
      method: 'PATCH',
      body: JSON.stringify({ listPrice }),
    })
  },

  updateServiceForm(id: string, formTemplateId: string | null) {
    return apiClient<CompanyCatalogItem>(`/company/me/catalog/services/${id}/form`, {
      method: 'PATCH',
      body: JSON.stringify({ formTemplateId }),
    })
  },

  listServicesWithForm() {
    return apiClient<{ items: CompanyCatalogItem[] }>('/company/me/catalog/services/with-form')
  },

  async remove(kind: CatalogEntityKind, id: string) {
    await apiClient<unknown>(`/company/me/catalog/${kind}/${id}`, { method: 'DELETE' })
  },
}
