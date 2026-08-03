import { apiClient } from '@/shared/services/apiClient'
import type {
  CreateSessionTokenBody,
  SessionDetail,
  SessionToken,
} from '../types/event.types'

export const sessionTokensApi = {
  getSession(eventId: string, occurrenceDate: string): Promise<SessionDetail> {
    return apiClient<SessionDetail>(
      `/company/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(occurrenceDate)}`,
    )
  },

  list(eventId: string, occurrenceDate: string): Promise<SessionDetail> {
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
