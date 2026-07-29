import { apiClient } from '@/shared/services/apiClient'
import type { CreateSessionTokenBody, SessionToken } from '../types/event.types'

type SessionTokensListResponse = {
  items: SessionToken[]
}

export const sessionTokensApi = {
  list(eventId: string, occurrenceDate: string): Promise<SessionToken[]> {
    return apiClient<SessionTokensListResponse>(
      `/company/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(occurrenceDate)}/tokens`,
    ).then((result) => result.items)
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
}
