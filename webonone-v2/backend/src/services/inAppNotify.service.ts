import {
  createNotificationsForUsers,
  createNotification,
} from './notification.service.js'
import {
  resolveCompanyAdminUserIds,
  resolveEventStaffUserId,
  resolveSessionCustomerUserIds,
  resolveSuperAdminUserIds,
} from './notificationRecipients.service.js'

const SOURCE = 'webonone' as const

function sessionHref(eventId: string, occurrenceDate: string): string {
  return `/calendar/events/${eventId}/sessions/${occurrenceDate}`
}

function eventHref(eventId: string): string {
  return `/calendar/events/${eventId}`
}

export async function notifyCompanyPendingReview(input: {
  companyId: string
  companyName: string
}): Promise<void> {
  const userIds = await resolveSuperAdminUserIds()
  await createNotificationsForUsers(userIds, {
    companyId: input.companyId,
    type: 'company.pending_review',
    title: `Company pending approval: ${input.companyName}`,
    body: `${input.companyName} was registered and needs review.`,
    href: '/companies',
    sourceService: SOURCE,
    sourceEventIdPrefix: `company.pending_review:${input.companyId}`,
  })
}

export async function notifyCompanyStatusChange(input: {
  companyId: string
  companyName: string
  status: 'approved' | 'rejected'
  registrantUserId: string
}): Promise<void> {
  const type = input.status === 'approved' ? 'company.approved' : 'company.rejected'
  const title =
    input.status === 'approved'
      ? `Company approved: ${input.companyName}`
      : `Company rejected: ${input.companyName}`
  await createNotification({
    userId: input.registrantUserId,
    companyId: input.companyId,
    type,
    title,
    body:
      input.status === 'approved'
        ? `${input.companyName} is now active on the platform.`
        : `${input.companyName} was not approved.`,
    href: '/settings/basic',
    sourceService: SOURCE,
    sourceEventId: `${type}:${input.companyId}:${input.registrantUserId}`,
  })
}

export async function notifyAppointmentBookedInApp(input: {
  companyId: string
  eventId: string
  serviceName: string
  staffId: string
  attendeeDisplayName?: string | null
}): Promise<void> {
  const staffUserId = await resolveEventStaffUserId(input.companyId, input.staffId)
  const adminIds = await resolveCompanyAdminUserIds(input.companyId)
  const recipients = [...new Set([...(staffUserId ? [staffUserId] : []), ...adminIds])]
  const who = input.attendeeDisplayName?.trim() || 'A customer'
  await createNotificationsForUsers(recipients, {
    companyId: input.companyId,
    type: 'appointment.booked',
    title: `Appointment booked: ${input.serviceName}`,
    body: `${who} booked ${input.serviceName}.`,
    href: eventHref(input.eventId),
    sourceService: SOURCE,
    sourceEventIdPrefix: `appointment.booked:${input.eventId}`,
  })
}

export async function notifySessionStartedInApp(input: {
  companyId: string
  eventId: string
  occurrenceDate: string
  serviceName: string
  attendeeUserId?: string | null
}): Promise<void> {
  const userIds = await resolveSessionCustomerUserIds(
    input.companyId,
    input.eventId,
    input.occurrenceDate,
    input.attendeeUserId,
  )
  await createNotificationsForUsers(userIds, {
    companyId: input.companyId,
    type: 'session.started',
    title: `Session started: ${input.serviceName}`,
    body: `${input.serviceName} has started.`,
    href: sessionHref(input.eventId, input.occurrenceDate),
    sourceService: SOURCE,
    sourceEventIdPrefix: `session.started:${input.eventId}:${input.occurrenceDate}`,
  })
}

export async function notifySessionTokenCalledInApp(input: {
  companyId: string
  eventId: string
  occurrenceDate: string
  serviceName: string
  userId: string
  tokenNumber: number
}): Promise<void> {
  await createNotification({
    userId: input.userId,
    companyId: input.companyId,
    type: 'session.token_called',
    title: `You're up — token #${input.tokenNumber}`,
    body: `${input.serviceName}: your turn (token #${input.tokenNumber}).`,
    href: sessionHref(input.eventId, input.occurrenceDate),
    sourceService: SOURCE,
    sourceEventId: `session.token_called:${input.eventId}:${input.occurrenceDate}:${input.userId}:${input.tokenNumber}`,
  })
}

export async function notifySessionEndedInApp(input: {
  companyId: string
  eventId: string
  occurrenceDate: string
  serviceName: string
  attendeeUserId?: string | null
}): Promise<void> {
  const userIds = await resolveSessionCustomerUserIds(
    input.companyId,
    input.eventId,
    input.occurrenceDate,
    input.attendeeUserId,
  )
  await createNotificationsForUsers(userIds, {
    companyId: input.companyId,
    type: 'session.ended',
    title: `Session ended: ${input.serviceName}`,
    body: `${input.serviceName} has ended.`,
    href: sessionHref(input.eventId, input.occurrenceDate),
    sourceService: SOURCE,
    sourceEventIdPrefix: `session.ended:${input.eventId}:${input.occurrenceDate}`,
  })
}

export async function notifySessionScheduleChangedInApp(input: {
  companyId: string
  eventId: string
  occurrenceDate: string
  serviceName: string
  attendeeUserId?: string | null
}): Promise<void> {
  const userIds = await resolveSessionCustomerUserIds(
    input.companyId,
    input.eventId,
    input.occurrenceDate,
    input.attendeeUserId,
  )
  await createNotificationsForUsers(userIds, {
    companyId: input.companyId,
    type: 'session.schedule_changed',
    title: `Schedule changed: ${input.serviceName}`,
    body: `The schedule for ${input.serviceName} was updated.`,
    href: sessionHref(input.eventId, input.occurrenceDate),
    sourceService: SOURCE,
    sourceEventIdPrefix: `session.schedule_changed:${input.eventId}:${input.occurrenceDate}:${Date.now()}`,
  })
}

export async function notifySessionDueToStartInApp(input: {
  companyId: string
  eventId: string
  occurrenceDate: string
  serviceName: string
  staffId: string
  startTime: string
}): Promise<void> {
  const staffUserId = await resolveEventStaffUserId(input.companyId, input.staffId)
  if (!staffUserId) return
  await createNotification({
    userId: staffUserId,
    companyId: input.companyId,
    type: 'session.due_to_start',
    title: `Session due to start: ${input.serviceName}`,
    body: `${input.serviceName} is due at ${input.startTime}.`,
    href: sessionHref(input.eventId, input.occurrenceDate),
    sourceService: SOURCE,
    sourceEventId: `session.due_to_start:${input.eventId}:${input.occurrenceDate}:${staffUserId}`,
  })
}
