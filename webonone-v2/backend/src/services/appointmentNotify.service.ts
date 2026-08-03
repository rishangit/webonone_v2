import { fetchUserContact } from '../clients/identityUserContactClient.js'
import * as companyRepo from '../repositories/company.repository.js'
import { sendTransactionalEmail } from './emailClient.service.js'
import { sendTransactionalSms } from './smsClient.service.js'
import type { CompanyEventDto } from './companyEvent.service.js'

const BOOKED_TEMPLATE_SLUG = 'appointment_booked'
const REMINDER_24H_TEMPLATE_SLUG = 'appointment_reminder_24h'
const REMINDER_LEAD_MS = 24 * 60 * 60 * 1000

type NotifyAppointmentBookedParams = {
  companyId: string
  event: CompanyEventDto
  durationMinutes: number
}

/**
 * Best-effort email + SMS after a duration-mode appointment is booked.
 * Also schedules a 24h-before reminder when the appointment is far enough out.
 * Never throws — event create must succeed even if notify fails.
 */
export function notifyAppointmentBooked(params: NotifyAppointmentBookedParams): void {
  void notifyAppointmentBookedAsync(params).catch((err) => {
    console.error('[appointmentNotify] unexpected error:', err)
  })
}

async function notifyAppointmentBookedAsync(
  params: NotifyAppointmentBookedParams,
): Promise<void> {
  const { companyId, event, durationMinutes } = params
  if (event.timeMode !== 'duration' || !event.attendeeUserId) {
    return
  }

  const company = await companyRepo.findCompanyById(companyId)
  const companyName = company?.name?.trim() || 'Company'

  const contact = await fetchUserContact(event.attendeeUserId)
  const toEmail =
    event.attendeeEmail?.trim() || contact?.email?.trim() || null
  const toPhone = contact?.phoneNumber?.trim() || null

  const payload: Record<string, string> = {
    userName:
      event.attendeeDisplayName?.trim() || contact?.displayName || 'Customer',
    companyName,
    serviceName: event.serviceName,
    staffName: event.staffDisplayName || 'Staff',
    appointmentDate: event.startsOn,
    appointmentTime: event.startTime,
    durationMinutes: String(durationMinutes),
  }

  await sendChannels({
    companyId,
    toEmail,
    toPhone,
    payload,
    templateSlug: BOOKED_TEMPLATE_SLUG,
  })

  const reminderAt = reminderScheduledAt(event.startsOn, event.startTime)
  if (!reminderAt) {
    return
  }

  await sendChannels({
    companyId,
    toEmail,
    toPhone,
    payload,
    templateSlug: REMINDER_24H_TEMPLATE_SLUG,
    scheduledAt: reminderAt.toISOString(),
  })
}

function reminderScheduledAt(startsOn: string, startTime: string): Date | null {
  const appointmentAt = parseLocalDateTime(startsOn, startTime)
  if (!appointmentAt) return null

  const reminderAt = new Date(appointmentAt.getTime() - REMINDER_LEAD_MS)
  if (reminderAt.getTime() <= Date.now()) {
    return null
  }
  return reminderAt
}

/** Parse `YYYY-MM-DD` + `HH:mm` / `HH:mm:ss` as local wall time. */
function parseLocalDateTime(dateYmd: string, timeHm: string): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateYmd.trim())
  const timeMatch = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(timeHm.trim())
  if (!dateMatch || !timeMatch) return null

  const year = Number(dateMatch[1])
  const month = Number(dateMatch[2]) - 1
  const day = Number(dateMatch[3])
  const hour = Number(timeMatch[1])
  const minute = Number(timeMatch[2])
  const second = Number(timeMatch[3] ?? '0')
  const date = new Date(year, month, day, hour, minute, second, 0)
  if (Number.isNaN(date.getTime())) return null
  return date
}

async function sendChannels(params: {
  companyId: string
  toEmail: string | null
  toPhone: string | null
  payload: Record<string, string>
  templateSlug: string
  scheduledAt?: string
}): Promise<void> {
  const { companyId, toEmail, toPhone, payload, templateSlug, scheduledAt } = params

  if (toEmail) {
    try {
      await sendTransactionalEmail({
        templateSlug,
        toEmail,
        payload,
        companyId,
        scheduledAt,
        requestedByService: 'webonone',
      })
    } catch (err) {
      console.error(`[appointmentNotify] email failed (${templateSlug}):`, err)
    }
  }

  if (toPhone) {
    try {
      await sendTransactionalSms({
        toNumber: toPhone,
        templateSlug,
        payload,
        companyId,
        scheduledAt,
        requestedByService: 'webonone',
      })
    } catch (err) {
      console.error(`[appointmentNotify] sms failed (${templateSlug}):`, err)
    }
  }
}
