import { apiClient } from '@/shared/services/apiClient'
import { isPersonalCalendarSession } from '@/features/session/utils/canAccessCompanySession'
import { readSessionRoleStorage } from '@/features/session/utils/sessionRoleStorage'
import type {
  CreateSessionTokenBody,
  SessionDetail,
  SessionToken,
} from '../types/event.types'

function usePersonalEventsApi(): boolean {
  const stored = readSessionRoleStorage()
  return isPersonalCalendarSession(stored?.activeRole, stored?.activeCompanyId)
}

function sessionPath(eventId: string, occurrenceDate: string): string {
  const event = encodeURIComponent(eventId)
  const date = encodeURIComponent(occurrenceDate)
  if (usePersonalEventsApi()) {
    return `/me/events/${event}/sessions/${date}`
  }
  return `/company/events/${event}/sessions/${date}`
}

export const sessionTokensApi = {
  getSession(eventId: string, occurrenceDate: string): Promise<SessionDetail> {
    return apiClient<SessionDetail>(sessionPath(eventId, occurrenceDate))
  },

  list(eventId: string, occurrenceDate: string): Promise<SessionDetail> {
    if (usePersonalEventsApi()) {
      return apiClient<SessionDetail>(sessionPath(eventId, occurrenceDate))
    }
    return apiClient<SessionDetail>(
      `/company/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(occurrenceDate)}/tokens`,
    )
  },

  create(
    eventId: string,
    occurrenceDate: string,
    body: CreateSessionTokenBody,
  ): Promise<SessionToken> {
    return apiClient<SessionToken>(
      `/company/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(occurrenceDate)}/tokens`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    )
  },

  start(eventId: string, occurrenceDate: string): Promise<SessionDetail> {
    return apiClient<SessionDetail>(
      `/company/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(occurrenceDate)}/start`,
      { method: 'POST' },
    )
  },

  callNext(eventId: string, occurrenceDate: string): Promise<SessionDetail> {
    return apiClient<SessionDetail>(
      `/company/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(occurrenceDate)}/call-next`,
      { method: 'POST' },
    )
  },

  callPrevious(eventId: string, occurrenceDate: string): Promise<SessionDetail> {
    return apiClient<SessionDetail>(
      `/company/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(occurrenceDate)}/call-previous`,
      { method: 'POST' },
    )
  },

  end(eventId: string, occurrenceDate: string): Promise<SessionDetail> {
    return apiClient<SessionDetail>(
      `/company/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(occurrenceDate)}/end`,
      { method: 'POST' },
    )
  },
}
