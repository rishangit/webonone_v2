import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'
import { isPersonalCalendarSession } from '@/features/calendar/utils/calendarAccess'
import { secureStorage } from '@/shared/services/secureStorage'
import type {
  ChangeSessionScheduleBody,
  ChangeSessionScheduleResult,
  CreateSessionTokenBody,
  SessionCheckInsResult,
  SessionDetail,
  SessionToken,
} from '@/features/calendar/types/event.types'

const client = createApiClient(env.webononeApiBaseUrl)

async function usePersonalEventsApi(): Promise<boolean> {
  const stored = await secureStorage.getSessionRole()
  return isPersonalCalendarSession(stored?.role, stored?.companyId)
}

async function sessionPath(eventId: string, occurrenceDate: string): Promise<string> {
  const event = encodeURIComponent(eventId)
  const date = encodeURIComponent(occurrenceDate)
  if (await usePersonalEventsApi()) {
    return `/me/events/${event}/sessions/${date}`
  }
  return `/company/events/${event}/sessions/${date}`
}

export const sessionTokensApi = {
  async getSession(eventId: string, occurrenceDate: string): Promise<SessionDetail> {
    return client<SessionDetail>(await sessionPath(eventId, occurrenceDate))
  },

  async list(eventId: string, occurrenceDate: string): Promise<SessionDetail> {
    if (await usePersonalEventsApi()) {
      return client<SessionDetail>(await sessionPath(eventId, occurrenceDate))
    }
    return client<SessionDetail>(
      `/company/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(occurrenceDate)}/tokens`,
    )
  },

  create(
    eventId: string,
    occurrenceDate: string,
    body: CreateSessionTokenBody,
  ): Promise<SessionToken> {
    return client<SessionToken>(
      `/company/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(occurrenceDate)}/tokens`,
      { method: 'POST', body },
    )
  },

  start(eventId: string, occurrenceDate: string): Promise<SessionDetail> {
    return client<SessionDetail>(
      `/company/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(occurrenceDate)}/start`,
      { method: 'POST' },
    )
  },

  callNext(eventId: string, occurrenceDate: string): Promise<SessionDetail> {
    return client<SessionDetail>(
      `/company/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(occurrenceDate)}/call-next`,
      { method: 'POST' },
    )
  },

  callPrevious(eventId: string, occurrenceDate: string): Promise<SessionDetail> {
    return client<SessionDetail>(
      `/company/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(occurrenceDate)}/call-previous`,
      { method: 'POST' },
    )
  },

  end(eventId: string, occurrenceDate: string): Promise<SessionDetail> {
    return client<SessionDetail>(
      `/company/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(occurrenceDate)}/end`,
      { method: 'POST' },
    )
  },

  changeSchedule(
    eventId: string,
    occurrenceDate: string,
    body: ChangeSessionScheduleBody,
  ): Promise<ChangeSessionScheduleResult> {
    return client<ChangeSessionScheduleResult>(
      `/company/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(occurrenceDate)}/change`,
      { method: 'POST', body },
    )
  },

  cancel(eventId: string, occurrenceDate: string): Promise<SessionDetail> {
    return client<SessionDetail>(
      `/company/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(occurrenceDate)}/cancel`,
      { method: 'POST' },
    )
  },

  reassignStaff(eventId: string, occurrenceDate: string, staffId: string): Promise<SessionDetail> {
    return client<SessionDetail>(
      `/company/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(occurrenceDate)}/reassign`,
      { method: 'POST', body: { staff_id: staffId } },
    )
  },

  async listCheckIns(eventId: string, occurrenceDate: string): Promise<SessionCheckInsResult> {
    return client<SessionCheckInsResult>(`${await sessionPath(eventId, occurrenceDate)}/check-ins`)
  },

  async checkIn(eventId: string, occurrenceDate: string): Promise<SessionCheckInsResult> {
    return client<SessionCheckInsResult>(`${await sessionPath(eventId, occurrenceDate)}/check-ins`, {
      method: 'POST',
    })
  },

  completeWorkflow(
    eventId: string,
    occurrenceDate: string,
    tokenId: string,
  ): Promise<SessionToken> {
    return client<SessionToken>(
      `/company/events/${encodeURIComponent(eventId)}/sessions/${encodeURIComponent(occurrenceDate)}/tokens/${encodeURIComponent(tokenId)}/workflow/complete`,
      { method: 'POST' },
    )
  },
}

export function nextTokenLabel(items: { tokenNumber: number }[]): string {
  const max = items.reduce((acc, item) => Math.max(acc, item.tokenNumber), 0)
  return String(max + 1).padStart(3, '0')
}
