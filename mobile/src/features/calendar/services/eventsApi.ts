import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'
import { isPersonalCalendarSession } from '@/features/calendar/utils/calendarAccess'
import { secureStorage } from '@/shared/services/secureStorage'
import type {
  CompanyEvent,
  CompanyEventOccurrence,
  CreateCompanyEventBody,
  UpdateCompanyEventBody,
} from '@/features/calendar/types/event.types'

const client = createApiClient(env.webononeApiBaseUrl)

type EventsListResponse = {
  items: CompanyEvent[] | CompanyEventOccurrence[]
  total: number
  page: number
  pageSize: number
  mode: 'series' | 'occurrences'
}

async function usePersonalEventsApi(): Promise<boolean> {
  const stored = await secureStorage.getSessionRole()
  return isPersonalCalendarSession(stored?.role, stored?.companyId)
}

export const eventsApi = {
  async list(query: { q?: string; page?: number; pageSize?: number }): Promise<{
    items: CompanyEvent[]
    total: number
    page: number
    pageSize: number
  }> {
    const params = new URLSearchParams()
    if (query.q) params.set('q', query.q)
    params.set('page', String(query.page ?? 1))
    params.set('pageSize', String(query.pageSize ?? 12))
    const personal = await usePersonalEventsApi()
    const path = personal ? `/me/events?${params}` : `/company/events?${params}`
    const result = await client<EventsListResponse>(path)
    return {
      items: result.items as CompanyEvent[],
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    }
  },

  async listOccurrences(from: string, to: string): Promise<CompanyEventOccurrence[]> {
    const params = new URLSearchParams({ from, to })
    const personal = await usePersonalEventsApi()
    const path = personal ? `/me/events?${params}` : `/company/events?${params}`
    const result = await client<EventsListResponse>(path)
    return result.items as CompanyEventOccurrence[]
  },

  async get(id: string): Promise<CompanyEvent> {
    const personal = await usePersonalEventsApi()
    const path = personal
      ? `/me/events/${encodeURIComponent(id)}`
      : `/company/events/${encodeURIComponent(id)}`
    return client<CompanyEvent>(path)
  },

  create(body: CreateCompanyEventBody): Promise<CompanyEvent> {
    return client<CompanyEvent>('/company/events', { method: 'POST', body })
  },

  update(id: string, body: UpdateCompanyEventBody): Promise<CompanyEvent> {
    return client<CompanyEvent>(`/company/events/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body,
    })
  },

  delete(id: string): Promise<void> {
    return client<void>(`/company/events/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },
}
