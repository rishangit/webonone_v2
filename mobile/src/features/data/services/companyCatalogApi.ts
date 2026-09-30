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

  updatePricing(kind: CatalogEntityKind, id: string, listPrice: number | null) {
    return client<CompanyCatalogItem>(`/company/me/catalog/${kind}/${id}/pricing`, {
      method: 'PATCH',
      body: JSON.stringify({ listPrice }),
    })
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
}
