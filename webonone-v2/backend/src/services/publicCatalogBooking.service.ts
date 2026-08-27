import { findApprovedCompanyCatalogById } from '../repositories/publicCatalogSearch.repository.js'
import * as eventRepo from '../repositories/companyEvent.repository.js'
import {
  createSessionToken,
  getNextSessionTokenLabel,
  getSessionTokenForUser,
  mapEventRow,
  type SessionTokenDto,
} from './companyEvent.service.js'

function serviceError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number }
  err.statusCode = statusCode
  return err
}

async function resolvePublicWindowSession(
  serviceId: string,
  eventId: string,
): Promise<{ companyId: string }> {
  const catalog = await findApprovedCompanyCatalogById('services', serviceId)
  if (!catalog) {
    throw serviceError('Service not found', 404)
  }

  const eventRow = await eventRepo.findEventById(catalog.company_id, eventId)
  if (!eventRow) {
    throw serviceError('Event not found', 404)
  }

  const event = mapEventRow(eventRow)
  if (event.serviceId !== serviceId) {
    throw serviceError('Event does not belong to this service', 404)
  }
  if (event.timeMode !== 'window') {
    throw serviceError('Only Specific time service sessions can be booked publicly', 400)
  }

  return { companyId: catalog.company_id }
}

export async function getPublicNextToken(options: {
  serviceId: string
  eventId: string
  occurrenceDate: string
}): Promise<{ tokenNumber: number; tokenLabel: string }> {
  const { companyId } = await resolvePublicWindowSession(options.serviceId, options.eventId)
  return getNextSessionTokenLabel(companyId, options.eventId, options.occurrenceDate)
}

export async function getPublicMyToken(options: {
  serviceId: string
  eventId: string
  occurrenceDate: string
  userId: string
}): Promise<SessionTokenDto | null> {
  const { companyId } = await resolvePublicWindowSession(options.serviceId, options.eventId)
  return getSessionTokenForUser(
    companyId,
    options.eventId,
    options.occurrenceDate,
    options.userId,
  )
}

export async function bookPublicSessionToken(options: {
  serviceId: string
  eventId: string
  occurrenceDate: string
  userId: string
  userDisplayName: string
  userEmail?: string | null
  userAvatarUrl?: string | null
}): Promise<SessionTokenDto> {
  const { companyId } = await resolvePublicWindowSession(options.serviceId, options.eventId)
  return createSessionToken(companyId, options.eventId, options.occurrenceDate, {
    user_id: options.userId,
    user_display_name: options.userDisplayName,
    user_email: options.userEmail ?? null,
    user_avatar_url: options.userAvatarUrl ?? null,
  })
}
