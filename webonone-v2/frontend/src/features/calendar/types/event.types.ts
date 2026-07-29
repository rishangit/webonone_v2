export type EventTimeMode = 'duration' | 'window'
export type EventRecurrence = 'none' | 'weekly'

export type CompanyEvent = {
  id: string
  companyId: string
  serviceId: string
  serviceName: string
  timeMode: EventTimeMode
  staffId: string
  staffDisplayName: string
  attendeeUserId: string | null
  attendeeDisplayName: string | null
  attendeeEmail: string | null
  startsOn: string
  startTime: string
  endTime: string
  weekdays: number[]
  recurrence: EventRecurrence
  recurrenceUntil: string | null
  createdAt: string
  updatedAt: string
}

export type CompanyEventOccurrence = CompanyEvent & {
  occurrenceDate: string
  start: string
  end: string
  title: string
}

export type SessionToken = {
  id: string
  companyId: string
  eventId: string
  occurrenceDate: string
  tokenNumber: number
  tokenLabel: string
  userId: string
  userDisplayName: string
  userEmail: string | null
  createdAt: string
  updatedAt: string
}

export type CreateSessionTokenBody = {
  user_id: string
  user_display_name: string
  user_email?: string | null
}

export type CreateCompanyEventBody = {
  service_id: string
  staff_id: string
  attendee_user_id?: string | null
  attendee_display_name?: string | null
  attendee_email?: string | null
  starts_on: string
  start_time?: string
  weekdays: number[]
  recurrence?: EventRecurrence
  recurrence_until: string
}

export type UpdateCompanyEventBody = Partial<CreateCompanyEventBody>
