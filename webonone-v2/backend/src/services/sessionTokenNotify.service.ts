import { fetchUserContact } from '../clients/identityUserContactClient.js'
import * as companyRepo from '../repositories/company.repository.js'
import { sendTransactionalEmail } from './emailClient.service.js'
import { sendTransactionalSms } from './smsClient.service.js'
import type { CompanyEventDto, SessionTokenDto } from './companyEvent.service.js'

const ISSUED_TEMPLATE_SLUG = 'session_token_issued'
const STARTED_TEMPLATE_SLUG = 'session_started'
const ENDED_TEMPLATE_SLUG = 'session_ended'
const CALLED_TEMPLATE_SLUG = 'session_token_called'

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
