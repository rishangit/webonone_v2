import { apiClient } from '@/shared/services/apiClient'
import type { CatalogListQuery, PaginatedResult } from '@webonone/store-kit'
import { readSessionRoleStorage } from '@/features/session/utils/sessionRoleStorage'
import { isPersonalCalendarSession } from '@/features/session/utils/canAccessCompanySession'
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

function usePersonalEventsApi(): boolean {
  const stored = readSessionRoleStorage()
  return isPersonalCalendarSession(stored?.activeRole, stored?.activeCompanyId)
}

export const eventsApi = {
  async list(query: CatalogListQuery): Promise<PaginatedResult<CompanyEvent>> {
    const params = new URLSearchParams()
    if (query.q) params.set('q', query.q)
    params.set('page', String(query.page ?? 1))
    params.set('pageSize', String(query.pageSize ?? 20))
    const qs = params.toString()
    const path = usePersonalEventsApi() ? `/me/events?${qs}` : `/company/events?${qs}`
    const result = await apiClient<EventsListResponse>(path)
    return {
      items: result.items as CompanyEvent[],
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    }
  },

  async listOccurrences(from: string, to: string): Promise<CompanyEventOccurrence[]> {
    const params = new URLSearchParams({ from, to })
    const path = usePersonalEventsApi()
      ? `/me/events?${params.toString()}`
      : `/company/events?${params.toString()}`
    const result = await apiClient<EventsListResponse>(path)
    return result.items as CompanyEventOccurrence[]
  },

  get(id: string): Promise<CompanyEvent> {
    const path = usePersonalEventsApi()
      ? `/me/events/${encodeURIComponent(id)}`
      : `/company/events/${encodeURIComponent(id)}`
    return apiClient<CompanyEvent>(path)
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
