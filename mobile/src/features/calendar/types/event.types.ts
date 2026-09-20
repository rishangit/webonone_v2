export type EventTimeMode = 'duration' | 'window'
export type EventRecurrence =
  | 'none'
  | 'weekly'
  | 'biweekly'
  | 'monthly_first_week'
  | 'monthly_by_date'

export type EventGalleryImage = {
  mediaId: string
  url: string
}

export type CompanyEvent = {
  id: string
  companyId: string
  serviceId: string
  serviceName: string
  serviceImageUrl: string | null
  staffImageUrl: string | null
  attendeeImageUrl: string | null
  serviceGalleryImages: EventGalleryImage[]
  spaceGalleryImages: EventGalleryImage[]
  formTemplateId: string | null
  timeMode: EventTimeMode
  staffId: string | null
  staffDisplayName: string | null
  attendeeUserId: string | null
  attendeeDisplayName: string | null
  attendeeEmail: string | null
  spaceId: string | null
  spaceName: string | null
  startsOn: string
  startTime: string
  endTime: string
  weekdays: number[]
  recurrence: EventRecurrence
  recurrenceUntil: string | null
  excludedDates: string[]
  createdAt: string
  updatedAt: string
  tokenOccurrenceDates?: string[]
  viewerIsAssignedStaff?: boolean
}

export type SessionTokenStatus = 'waiting' | 'serving' | 'completed'
export type SessionRunStatus = 'scheduled' | 'started' | 'ended'
export type SessionScheduleChangeKind = 'delayed' | 'early'

export type CompanyEventOccurrence = CompanyEvent & {
  occurrenceDate: string
  start: string
  end: string
  title: string
  runStatus: SessionRunStatus
  scheduleChanged?: boolean
  scheduleChangeKind?: SessionScheduleChangeKind | null
  originalStartTime?: string
  originalEndTime?: string
  sessionCancelled?: boolean
  effectiveStaffId?: string
  effectiveStaffDisplayName?: string
  sessionIssue?: 'staff_leave' | 'cancelled' | null
  viewerCheckedIn?: boolean
}

export type SessionToken = {
  id: string
  companyId: string
  eventId: string
  occurrenceDate: string
  tokenNumber: number
  tokenLabel: string
  callOrder: number
  status: SessionTokenStatus
  userId: string
  userDisplayName: string
  userEmail: string | null
  userAvatarUrl: string | null
  createdAt: string
  updatedAt: string
  workflowProgress?: {
    steps: { id: string; label: string; kind: 'check_in' | 'space' | 'done' }[]
    currentIndex: number
    done: boolean
  }
}

export type SessionRun = {
  id: string
  companyId: string
  eventId: string
  occurrenceDate: string
  status: SessionRunStatus
  currentTokenId: string | null
  startedAt: string | null
  startedByUserId: string | null
  endedAt: string | null
  scheduledStartTime: string | null
  scheduledEndTime: string | null
  createdAt: string
  updatedAt: string
}

export type SessionDetail = {
  run: SessionRun
  items: SessionToken[]
  sessionStartTime: string
  sessionEndTime: string
  sessionCancelled?: boolean
  effectiveStaffId?: string
  effectiveStaffDisplayName?: string
  sessionIssue?: 'staff_leave' | 'cancelled' | null
  queue?: {
    prevTokenLabel: string | null
    currentTokenLabel: string | null
    nextTokenLabel: string | null
  }
  stepQueues?: Record<
    string,
    {
      prevTokenLabel: string | null
      currentTokenLabel: string | null
      nextTokenLabel: string | null
      currentTokenId: string | null
    }
  >
  viewerIsAssignedStaff?: boolean
}

export type SessionCheckIn = {
  id: string
  userId: string
  userDisplayName: string
  userEmail: string | null
  userAvatarUrl: string | null
  checkedInAt: string
}

export type SessionCheckInsResult = {
  items: SessionCheckIn[]
  canCheckIn: boolean
  checkedIn: boolean
}

export type ChangeSessionScheduleBody = {
  delayHours: number
  delayMinutes: number
  sendEmail: boolean
  sendSms: boolean
}

export type ChangeSessionScheduleResult = SessionDetail & {
  notifiedCount: number
  emailQueued: number
  smsQueued: number
}

export type CreateSessionTokenBody = {
  user_id: string
  user_display_name: string
  user_email?: string | null
  user_avatar_url?: string | null
}

export type CreateCompanyEventBody = {
  service_id: string
  staff_id?: string | null
  attendee_user_id?: string | null
  attendee_display_name?: string | null
  attendee_email?: string | null
  space_id?: string | null
  starts_on: string
  start_time?: string
  weekdays: number[]
  recurrence?: EventRecurrence
  recurrence_until: string
}

export type UpdateCompanyEventBody = Partial<CreateCompanyEventBody> & {
  expand_from?: string
}
