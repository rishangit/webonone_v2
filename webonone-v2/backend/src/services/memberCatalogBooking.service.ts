import * as eventRepo from '../repositories/companyEvent.repository.js'
import * as catalogService from './companyCatalog.service.js'
import {
  buildWindowSessionItems,
  createSessionToken,
  getNextSessionTokenLabel,
  getSessionTokenForUser,
  mapEventRow,
  parseSessionDateRange,
  type CatalogSessionItemDto,
  type SessionTokenDto,
} from './companyEvent.service.js'

function serviceError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number }
  err.statusCode = statusCode
  return err
}

async function resolveMemberWindowSession(options: {
  userId: string
  companyId: string
  serviceId: string
  eventId: string
}): Promise<{ companyId: string }> {
  await catalogService.getCatalogItem(options.userId, options.companyId, 'services', options.serviceId)

  const eventRow = await eventRepo.findEventById(options.companyId, options.eventId)
  if (!eventRow) {
    throw serviceError('Event not found', 404)
  }

  const event = mapEventRow(eventRow)
  if (event.serviceId !== options.serviceId) {
    throw serviceError('Event does not belong to this service', 404)
  }
  if (event.timeMode !== 'window') {
    throw serviceError('Only Specific time service sessions can be booked', 400)
  }

  return { companyId: options.companyId }
}

export async function listMemberServiceSessions(options: {
  userId: string
  companyId: string
  serviceId: string
  from?: unknown
  to?: unknown
}): Promise<{ items: CatalogSessionItemDto[] }> {
  const serviceId = options.serviceId.trim()
  if (!serviceId) return { items: [] }

  await catalogService.getCatalogItem(options.userId, options.companyId, 'services', serviceId)

  const range = parseSessionDateRange(options.from, options.to)
  if (!range) return { items: [] }

  const items = await buildWindowSessionItems(options.companyId, serviceId, range.from, range.to)
  return { items }
}

export async function getMemberNextToken(options: {
  userId: string
  companyId: string
  serviceId: string
  eventId: string
  occurrenceDate: string
}): Promise<{ tokenNumber: number; tokenLabel: string }> {
  const { companyId } = await resolveMemberWindowSession(options)
  return getNextSessionTokenLabel(companyId, options.eventId, options.occurrenceDate)
}

export async function getMemberMyToken(options: {
  userId: string
  companyId: string
  serviceId: string
  eventId: string
  occurrenceDate: string
}): Promise<SessionTokenDto | null> {
  const { companyId } = await resolveMemberWindowSession(options)
  return getSessionTokenForUser(companyId, options.eventId, options.occurrenceDate, options.userId)
}

export async function bookMemberSessionToken(options: {
  userId: string
  companyId: string
  serviceId: string
  eventId: string
  occurrenceDate: string
  userDisplayName: string
  userEmail?: string | null
  userAvatarUrl?: string | null
}): Promise<SessionTokenDto> {
  const { companyId } = await resolveMemberWindowSession(options)
  return createSessionToken(companyId, options.eventId, options.occurrenceDate, {
    user_id: options.userId,
    user_display_name: options.userDisplayName,
    user_email: options.userEmail ?? null,
    user_avatar_url: options.userAvatarUrl ?? null,
  })
}
