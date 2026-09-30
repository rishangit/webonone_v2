import { fetchUserContact } from '../clients/identityUserContactClient.js'
import { env } from '../config/env.js'
import * as companyRepo from '../repositories/company.repository.js'
import { sendTransactionalEmail } from './emailClient.service.js'
import { notifyCatalogReviewRequestInApp } from './inAppNotify.service.js'
import type { SaleDto } from './companySale.service.js'
import type { CompanyEventDto, SessionTokenDto } from './companyEvent.service.js'

const TEMPLATE_SLUG = 'catalog_review_request'

const ITEM_KIND_LABEL: Record<string, string> = {
  service: 'Service',
  product: 'Product',
  space: 'Space',
}

const SALE_KIND_TO_CATALOG_PATH: Record<string, string> = {
  product: 'products',
  service: 'services',
  space: 'spaces',
}

function appOrigin(): string {
  const raw = env.webononeAppOrigin?.trim() || 'http://127.0.0.1:3010'
  return raw.replace(/\/$/, '')
}

function absoluteReviewUrl(relativePath: string): string {
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`
  return `${appOrigin()}${path}`
}

function sessionReviewHref(eventId: string, occurrenceDate: string): string {
  return `/calendar/events/${eventId}/sessions/${occurrenceDate}?openReview=1`
}

function catalogReviewHref(companyId: string, catalogKindPath: string, catalogItemId: string): string {
  return `/settings/connected-companies/${companyId}/catalog/${catalogKindPath}/${catalogItemId}?openReview=1`
}

type NotifyOneParams = {
  companyId: string
  userId: string
  userDisplayName?: string | null
  preferredEmail?: string | null
  itemKindLabel: string
  itemName: string
  reviewHref: string
  sourceEventId: string
  sessionDate?: string
  tokenLabel?: string
}

async function notifyOneCatalogReviewRequest(params: NotifyOneParams): Promise<void> {
  const company = await companyRepo.findCompanyById(params.companyId)
  const companyName = company?.name?.trim() || 'Company'

  const contact = await fetchUserContact(params.userId)
  const toEmail =
    params.preferredEmail?.trim() ||
    contact?.email?.trim() ||
    null
  const userName =
    params.userDisplayName?.trim() || contact?.displayName?.trim() || 'Customer'

  const reviewUrl = absoluteReviewUrl(params.reviewHref)
  const payload: Record<string, string> = {
    userName,
    companyName,
    itemKind: params.itemKindLabel,
    itemName: params.itemName,
    reviewUrl,
    sessionDate: params.sessionDate?.trim() || '—',
    tokenLabel: params.tokenLabel?.trim() || '—',
  }

  if (toEmail) {
    try {
      await sendTransactionalEmail({
        templateSlug: TEMPLATE_SLUG,
        toEmail,
        payload,
        companyId: params.companyId,
        requestedByService: 'webonone',
      })
    } catch (err) {
      console.error('[catalogReviewRequestNotify] email failed:', err)
    }
  }

  await notifyCatalogReviewRequestInApp({
    userId: params.userId,
    companyId: params.companyId,
    itemName: params.itemName,
    href: params.reviewHref,
    sourceEventId: params.sourceEventId,
  })
}

/**
 * Window-mode service: after customer completes session workflow.
 */
export function notifyCatalogReviewAfterWorkflowComplete(input: {
  companyId: string
  event: CompanyEventDto
  occurrenceDate: string
  token: SessionTokenDto
}): void {
  if (input.event.timeMode !== 'window') return
  if (!input.token.workflowProgress?.done) return

  void notifyOneCatalogReviewRequest({
    companyId: input.companyId,
    userId: input.token.userId,
    userDisplayName: input.token.userDisplayName,
    preferredEmail: input.token.userEmail,
    itemKindLabel: ITEM_KIND_LABEL.service,
    itemName: input.event.serviceName,
    reviewHref: sessionReviewHref(input.event.id, input.occurrenceDate),
    sourceEventId: `catalog.review_request:workflow:${input.token.id}:${input.token.userId}`,
    sessionDate: input.occurrenceDate,
    tokenLabel: input.token.tokenLabel,
  }).catch((err) => {
    console.error('[catalogReviewRequestNotify] workflow complete unexpected error:', err)
  })
}

/**
 * Duration-mode service: when session ends for the attendee.
 */
export function notifyCatalogReviewAfterDurationSessionEnd(input: {
  companyId: string
  event: CompanyEventDto
  occurrenceDate: string
  userId: string
  userDisplayName?: string | null
  userEmail?: string | null
}): void {
  if (input.event.timeMode !== 'duration') return
  if (!input.userId) return

  void notifyOneCatalogReviewRequest({
    companyId: input.companyId,
    userId: input.userId,
    userDisplayName: input.userDisplayName,
    preferredEmail: input.userEmail,
    itemKindLabel: ITEM_KIND_LABEL.service,
    itemName: input.event.serviceName,
    reviewHref: sessionReviewHref(input.event.id, input.occurrenceDate),
    sourceEventId: `catalog.review_request:session_end:${input.event.id}:${input.occurrenceDate}:${input.userId}`,
    sessionDate: input.occurrenceDate,
    tokenLabel: '—',
  }).catch((err) => {
    console.error('[catalogReviewRequestNotify] session end unexpected error:', err)
  })
}

/**
 * Completed POS sale: one request per product/space line (not services).
 */
export function notifyCatalogReviewAfterSaleCompleted(sale: SaleDto): void {
  if (sale.status !== 'completed') return

  for (const line of sale.lines) {
    if (line.itemKind === 'service') continue
    const catalogPath = SALE_KIND_TO_CATALOG_PATH[line.itemKind]
    if (!catalogPath) continue

    void notifyOneCatalogReviewRequest({
      companyId: sale.companyId,
      userId: sale.customerUserId,
      userDisplayName: sale.customerDisplayName,
      preferredEmail: sale.customerEmail,
      itemKindLabel: ITEM_KIND_LABEL[line.itemKind] ?? line.itemKind,
      itemName: line.name,
      reviewHref: catalogReviewHref(sale.companyId, catalogPath, line.catalogItemId),
      sourceEventId: `catalog.review_request:sale:${sale.id}:${line.id}:${sale.customerUserId}`,
      sessionDate: '—',
      tokenLabel: '—',
    }).catch((err) => {
      console.error('[catalogReviewRequestNotify] sale line unexpected error:', err)
    })
  }
}
