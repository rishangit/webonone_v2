import type { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import * as publicCatalogBookingService from '../services/publicCatalogBooking.service.js'
import * as publicCatalogSearchService from '../services/publicCatalogSearch.service.js'

function handleServiceError(err: unknown, res: Response) {
  const statusCode = (err as Error & { statusCode?: number }).statusCode ?? 500
  const message = err instanceof Error ? err.message : 'Internal server error'
  res.status(statusCode).json({
    message,
    code: statusCode === 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED',
  })
}

function parseOccurrenceDate(raw: string, res: Response): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    res.status(400).json({ message: 'Invalid session date', code: 'REQUEST_FAILED' })
    return null
  }
  return raw
}

export async function searchCatalog(req: Request, res: Response) {
  const result = await publicCatalogSearchService.searchPublicCatalog({
    q: typeof req.query.q === 'string' ? req.query.q : undefined,
    page: req.query.page,
    pageSize: req.query.pageSize,
    lat: req.query.lat,
    lng: req.query.lng,
  })
  res.json(result)
}

export async function getCatalogItem(req: Request, res: Response) {
  const kind = typeof req.params.kind === 'string' ? req.params.kind : ''
  const id = typeof req.params.id === 'string' ? req.params.id : ''
  const item = await publicCatalogSearchService.getPublicCatalogItem({
    kind,
    id,
    lat: req.query.lat,
    lng: req.query.lng,
  })
  if (!item) {
    res.status(404).json({ message: 'Catalog item not found', code: 'NOT_FOUND' })
    return
  }
  res.json(item)
}

export async function listServiceSessions(req: Request, res: Response) {
  const id = typeof req.params.id === 'string' ? req.params.id : ''
  const result = await publicCatalogSearchService.listPublicServiceSessions({
    serviceId: id,
    from: req.query.from,
    to: req.query.to,
  })
  res.json(result)
}

export async function getNextPublicToken(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }
  const occurrenceDate = parseOccurrenceDate(String(req.params.occurrenceDate), res)
  if (!occurrenceDate) return
  try {
    const result = await publicCatalogBookingService.getPublicNextToken({
      serviceId: String(req.params.serviceId),
      eventId: String(req.params.eventId),
      occurrenceDate,
    })
    res.json(result)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function getMyPublicToken(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }
  const occurrenceDate = parseOccurrenceDate(String(req.params.occurrenceDate), res)
  if (!occurrenceDate) return
  try {
    const item = await publicCatalogBookingService.getPublicMyToken({
      serviceId: String(req.params.serviceId),
      eventId: String(req.params.eventId),
      occurrenceDate,
      userId: req.user.id,
    })
    if (!item) {
      res.status(404).json({ message: 'No token for this session', code: 'NOT_FOUND' })
      return
    }
    res.json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function bookPublicToken(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }
  const occurrenceDate = parseOccurrenceDate(String(req.params.occurrenceDate), res)
  if (!occurrenceDate) return
  try {
    const body = req.body as {
      user_display_name: string
      user_email?: string | null
    }
    const item = await publicCatalogBookingService.bookPublicSessionToken({
      serviceId: String(req.params.serviceId),
      eventId: String(req.params.eventId),
      occurrenceDate,
      userId: req.user.id,
      userDisplayName: body.user_display_name,
      userEmail: body.user_email ?? req.user.email ?? null,
    })
    res.status(201).json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}
