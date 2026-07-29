import { apiClient } from '@/shared/services/apiClient'
import type { CatalogListQuery, PaginatedResult } from '@webonone/store-kit'
import type {
  CompanyEvent,
  CompanyEventOccurrence,
  CreateCompanyEventBody,
  UpdateCompanyEventBody,
} from '../types/event.types'

type EventsListResponse = {
  items: CompanyEvent[] | CompanyEventOccurrence[]
  total: number
  page: number
  pageSize: number
  mode: 'series' | 'occurrences'
}

export const eventsApi = {
  async list(query: CatalogListQuery): Promise<PaginatedResult<CompanyEvent>> {
    const params = new URLSearchParams()
    if (query.q) params.set('q', query.q)
    params.set('page', String(query.page ?? 1))
    params.set('pageSize', String(query.pageSize ?? 20))
    const qs = params.toString()
    const result = await apiClient<EventsListResponse>(`/company/events?${qs}`)
    return {
      items: result.items as CompanyEvent[],
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    }
  },

  async listOccurrences(from: string, to: string): Promise<CompanyEventOccurrence[]> {
    const params = new URLSearchParams({ from, to })
    const result = await apiClient<EventsListResponse>(`/company/events?${params.toString()}`)
    return result.items as CompanyEventOccurrence[]
  },

  get(id: string): Promise<CompanyEvent> {
    return apiClient<CompanyEvent>(`/company/events/${encodeURIComponent(id)}`)
  },

  create(body: CreateCompanyEventBody): Promise<CompanyEvent> {
    return apiClient<CompanyEvent>('/company/events', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  update(id: string, body: UpdateCompanyEventBody): Promise<CompanyEvent> {
    return apiClient<CompanyEvent>(`/company/events/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  delete(id: string): Promise<void> {
    return apiClient<void>(`/company/events/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },
}
