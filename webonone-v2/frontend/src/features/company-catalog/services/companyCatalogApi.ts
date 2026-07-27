import { apiClient } from '@/shared/services/apiClient'
import type {
  CatalogBindingMode,
  CatalogEntityKind,
  CatalogPayload,
  CompanyCatalogItem,
} from '../types/companyCatalog.types'

export const companyCatalogApi = {
  list(kind: CatalogEntityKind, query?: { q?: string }) {
    const q = query?.q?.trim()
    const qs = q ? `?q=${encodeURIComponent(q)}` : ''
    return apiClient<{ items: CompanyCatalogItem[] }>(`/company/me/catalog/${kind}${qs}`)
  },

  get(kind: CatalogEntityKind, id: string) {
    return apiClient<CompanyCatalogItem>(`/company/me/catalog/${kind}/${id}`)
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

  fork(kind: CatalogEntityKind, id: string, payload: CatalogPayload) {
    return apiClient<CompanyCatalogItem>(`/company/me/catalog/${kind}/${id}/fork`, {
      method: 'POST',
      body: JSON.stringify({ payload }),
    })
  },

  update(kind: CatalogEntityKind, id: string, payload: CatalogPayload) {
    return apiClient<CompanyCatalogItem>(`/company/me/catalog/${kind}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  updateGallery(
    kind: Extract<CatalogEntityKind, 'services' | 'spaces'>,
    id: string,
    galleryImages: { mediaId: string; url: string }[],
  ) {
    return apiClient<CompanyCatalogItem>(`/company/me/catalog/${kind}/${id}/gallery`, {
      method: 'PATCH',
      body: JSON.stringify({ galleryImages }),
    })
  },

  async remove(kind: CatalogEntityKind, id: string) {
    await apiClient<unknown>(`/company/me/catalog/${kind}/${id}`, { method: 'DELETE' })
  },
}
