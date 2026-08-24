import { apiClient } from '@/shared/services/apiClient'
import { isPersonalCalendarSession } from '@/features/session/utils/canAccessCompanySession'
import { readSessionRoleStorage } from '@/features/session/utils/sessionRoleStorage'
import type {
  ChangeSessionScheduleBody,
  ChangeSessionScheduleResult,
  CreateSessionTokenBody,
  SessionCheckInsResult,
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

  changeSchedule(
    eventId: string,
    occurrenceDate: string,
    body: ChangeSessionScheduleBody,
  ): Promise<ChangeSessionScheduleResult> {
    return apiClient<ChangeSessionScheduleResult>(
      `/company/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(occurrenceDate)}/change`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    )
  },

  cancel(
    eventId: string,
    occurrenceDate: string,
  ): Promise<SessionDetail> {
    return apiClient<SessionDetail>(
      `/company/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(occurrenceDate)}/cancel`,
      { method: 'POST' },
    )
  },

  reassignStaff(
    eventId: string,
    occurrenceDate: string,
    staffId: string,
  ): Promise<SessionDetail> {
    return apiClient<SessionDetail>(
      `/company/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(occurrenceDate)}/reassign`,
      {
        method: 'POST',
        body: JSON.stringify({ staff_id: staffId }),
      },
    )
  },

  listCheckIns(eventId: string, occurrenceDate: string): Promise<SessionCheckInsResult> {
    return apiClient<SessionCheckInsResult>(`${sessionPath(eventId, occurrenceDate)}/check-ins`)
  },

  checkIn(eventId: string, occurrenceDate: string): Promise<SessionCheckInsResult> {
    return apiClient<SessionCheckInsResult>(`${sessionPath(eventId, occurrenceDate)}/check-ins`, {
      method: 'POST',
    })
  },

  completeWorkflow(
    eventId: string,
    occurrenceDate: string,
    tokenId: string,
  ): Promise<SessionToken> {
    return apiClient<SessionToken>(
      `/company/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(occurrenceDate)}/tokens/${encodeURIComponent(tokenId)}/workflow/complete`,
      { method: 'POST' },
    )
  },
}
