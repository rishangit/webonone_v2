import { apiClient } from '@/shared/services/apiClient'
import type {
  CatalogBindingMode,
  CatalogEntityKind,
  CatalogGalleryImage,
  CatalogPayload,
  CatalogSessionItem,
  CatalogSessionTokenItem,
  CompanyCatalogItem,
  ServiceWorkflowItem,
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

  /** Discover preview list (Find Companies dialog, before connect). */
  listForDiscover(companyId: string, kind: CatalogEntityKind, query?: { q?: string }) {
    const q = query?.q?.trim()
    const qs = q ? `?q=${encodeURIComponent(q)}` : ''
    return apiClient<{ items: CompanyCatalogItem[] }>(
      `/company/discover/${encodeURIComponent(companyId)}/catalog/${kind}${qs}`,
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
    body: {
      user_display_name: string
      user_email?: string | null
      user_avatar_url?: string | null
    },
  ) {
    return apiClient<CatalogSessionTokenItem>(
      memberSessionTokenPath(companyId, serviceId, eventId, occurrenceDate),
      { method: 'POST', body: JSON.stringify(body) },
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
