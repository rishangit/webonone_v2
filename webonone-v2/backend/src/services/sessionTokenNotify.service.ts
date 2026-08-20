import { fetchUserContact } from '../clients/identityUserContactClient.js'
import * as companyRepo from '../repositories/company.repository.js'
import { sendTransactionalEmail } from './emailClient.service.js'
import { sendTransactionalSms } from './smsClient.service.js'
import type { CompanyEventDto, SessionTokenDto } from './companyEvent.service.js'

const ISSUED_TEMPLATE_SLUG = 'session_token_issued'
const STARTED_TEMPLATE_SLUG = 'session_started'
const ENDED_TEMPLATE_SLUG = 'session_ended'
const CALLED_TEMPLATE_SLUG = 'session_token_called'
const SCHEDULE_CHANGED_TEMPLATE_SLUG = 'session_schedule_changed'

type NotifySessionTokenIssuedParams = {
  companyId: string
  event: CompanyEventDto
  token: SessionTokenDto
  /** Email from the create body when present; Identity contact is the fallback. */
  preferredEmail?: string | null
}

type NotifySessionBroadcastParams = {
  companyId: string
  event: CompanyEventDto
  tokens: SessionTokenDto[]
}

type NotifySessionTokenCalledParams = {
  companyId: string
  event: CompanyEventDto
  token: SessionTokenDto
}

type ScheduleChangeRecipient = {
  userId: string
  userDisplayName: string
  userEmail?: string | null
  tokenLabel: string
  occurrenceDate: string
}

export type NotifySessionScheduleChangedParams = {
  companyId: string
  event: CompanyEventDto
  occurrenceDate: string
  tokens: SessionTokenDto[]
  attendee: {
    userId: string
    userDisplayName: string
    userEmail?: string | null
  } | null
  previousSessionTime: string
  sessionTime: string
  sessionEndTime: string
  location: string
  sendEmail: boolean
  sendSms: boolean
}

export type NotifySessionScheduleChangedResult = {
  notifiedCount: number
  emailQueued: number
  smsQueued: number
}

/**
 * Best-effort email + SMS after a session queue token is issued.
 * Never throws — token issuance must succeed even if notify fails.
 */
export function notifySessionTokenIssued(params: NotifySessionTokenIssuedParams): void {
  void notifyOneTokenAsync({
    companyId: params.companyId,
    event: params.event,
    token: params.token,
    preferredEmail: params.preferredEmail,
    templateSlug: ISSUED_TEMPLATE_SLUG,
  }).catch((err) => {
    console.error('[sessionTokenNotify] unexpected error:', err)
  })
}

/**
 * Best-effort email + SMS to every issued token holder when a session starts.
 * Never throws — start must succeed even if notify fails.
 */
export function notifySessionStarted(params: NotifySessionBroadcastParams): void {
  void notifyAllTokensAsync(params, STARTED_TEMPLATE_SLUG).catch((err) => {
    console.error('[sessionTokenNotify] session started unexpected error:', err)
  })
}

/**
 * Best-effort email + SMS to every issued token holder when a session ends.
 * Never throws — end must succeed even if notify fails.
 */
export function notifySessionEnded(params: NotifySessionBroadcastParams): void {
  void notifyAllTokensAsync(params, ENDED_TEMPLATE_SLUG).catch((err) => {
    console.error('[sessionTokenNotify] session ended unexpected error:', err)
  })
}

/**
 * Best-effort email + SMS when a token becomes the current serving token.
 * Never throws — queue advance must succeed even if notify fails.
 */
export function notifySessionTokenCalled(params: NotifySessionTokenCalledParams): void {
  void notifyOneTokenAsync({
    companyId: params.companyId,
    event: params.event,
    token: params.token,
    preferredEmail: params.token.userEmail,
    templateSlug: CALLED_TEMPLATE_SLUG,
  }).catch((err) => {
    console.error('[sessionTokenNotify] token called unexpected error:', err)
  })
}

/**
 * Best-effort email and/or SMS after a session schedule change.
 * Returns queue counts; individual send failures are logged and skipped.
 */
export async function notifySessionScheduleChanged(
  params: NotifySessionScheduleChangedParams,
): Promise<NotifySessionScheduleChangedResult> {
  const recipients: ScheduleChangeRecipient[] =
    params.tokens.length > 0
      ? params.tokens.map((token) => ({
          userId: token.userId,
          userDisplayName: token.userDisplayName,
          userEmail: token.userEmail,
          tokenLabel: token.tokenLabel,
          occurrenceDate: token.occurrenceDate,
        }))
      : params.attendee
        ? [
            {
              userId: params.attendee.userId,
              userDisplayName: params.attendee.userDisplayName,
              userEmail: params.attendee.userEmail,
              tokenLabel: '—',
              occurrenceDate: params.occurrenceDate,
            },
          ]
        : []

  let emailQueued = 0
  let smsQueued = 0

  for (const recipient of recipients) {
    const result = await notifyScheduleChangeRecipientAsync({
      companyId: params.companyId,
      event: params.event,
      recipient,
      previousSessionTime: params.previousSessionTime,
      sessionTime: params.sessionTime,
      sessionEndTime: params.sessionEndTime,
      location: params.location,
      sendEmail: params.sendEmail,
      sendSms: params.sendSms,
    })
    emailQueued += result.emailQueued
    smsQueued += result.smsQueued
  }

  return {
    notifiedCount: recipients.length,
    emailQueued,
    smsQueued,
  }
}

async function notifyAllTokensAsync(
  params: NotifySessionBroadcastParams,
  templateSlug: string,
): Promise<void> {
  for (const token of params.tokens) {
    await notifyOneTokenAsync({
      companyId: params.companyId,
      event: params.event,
      token,
      preferredEmail: token.userEmail,
      templateSlug,
    })
  }
}

async function notifyOneTokenAsync(params: {
  companyId: string
  event: CompanyEventDto
  token: SessionTokenDto
  preferredEmail?: string | null
  templateSlug: string
}): Promise<void> {
  const { companyId, event, token, preferredEmail, templateSlug } = params

  const company = await companyRepo.findCompanyById(companyId)
  const companyName = company?.name?.trim() || 'Company'

  const contact = await fetchUserContact(token.userId)
  const toEmail =
    preferredEmail?.trim() ||
    token.userEmail?.trim() ||
    contact?.email?.trim() ||
    null
  const toPhone = contact?.phoneNumber?.trim() || null

  const payload: Record<string, string> = {
    userName: token.userDisplayName || contact?.displayName || 'Customer',
    companyName,
    serviceName: event.serviceName,
    tokenLabel: token.tokenLabel,
    sessionDate: token.occurrenceDate,
    sessionTime: event.startTime,
  }

  if (toEmail) {
    try {
      await sendTransactionalEmail({
        templateSlug,
        toEmail,
        payload,
        companyId,
        requestedByService: 'webonone',
      })
    } catch (err) {
      console.error(`[sessionTokenNotify] email failed (${templateSlug}):`, err)
    }
  }

  if (toPhone) {
    try {
      await sendTransactionalSms({
        toNumber: toPhone,
        templateSlug,
        payload,
        companyId,
        requestedByService: 'webonone',
      })
    } catch (err) {
      console.error(`[sessionTokenNotify] sms failed (${templateSlug}):`, err)
    }
  }
}

async function notifyScheduleChangeRecipientAsync(params: {
  companyId: string
  event: CompanyEventDto
  recipient: ScheduleChangeRecipient
  previousSessionTime: string
  sessionTime: string
  sessionEndTime: string
  location: string
  sendEmail: boolean
  sendSms: boolean
}): Promise<{ emailQueued: number; smsQueued: number }> {
  const {
    companyId,
    event,
    recipient,
    previousSessionTime,
    sessionTime,
    sessionEndTime,
    location,
    sendEmail,
    sendSms,
  } = params

  const company = await companyRepo.findCompanyById(companyId)
  const companyName = company?.name?.trim() || 'Company'
  const contact = await fetchUserContact(recipient.userId)
  const toEmail =
    recipient.userEmail?.trim() || contact?.email?.trim() || null
  const toPhone = contact?.phoneNumber?.trim() || null

  const payload: Record<string, string> = {
    userName: recipient.userDisplayName || contact?.displayName || 'Customer',
    companyName,
    serviceName: event.serviceName,
    tokenLabel: recipient.tokenLabel,
    sessionDate: recipient.occurrenceDate,
    previousSessionTime,
    sessionTime,
    sessionEndTime,
    location,
  }

  let emailQueued = 0
  let smsQueued = 0

  if (sendEmail && toEmail) {
    try {
      await sendTransactionalEmail({
        templateSlug: SCHEDULE_CHANGED_TEMPLATE_SLUG,
        toEmail,
        payload,
        companyId,
        requestedByService: 'webonone',
      })
      emailQueued = 1
    } catch (err) {
      console.error(
        `[sessionTokenNotify] email failed (${SCHEDULE_CHANGED_TEMPLATE_SLUG}):`,
        err,
      )
    }
  }

  if (sendSms && toPhone) {
    try {
      await sendTransactionalSms({
        toNumber: toPhone,
        templateSlug: SCHEDULE_CHANGED_TEMPLATE_SLUG,
        payload,
        companyId,
        requestedByService: 'webonone',
      })
      smsQueued = 1
    } catch (err) {
      console.error(
        `[sessionTokenNotify] sms failed (${SCHEDULE_CHANGED_TEMPLATE_SLUG}):`,
        err,
      )
    }
  }

  return { emailQueued, smsQueued }
}
