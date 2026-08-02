import type { Response } from 'express'
import type { CompanySessionRequest } from '../middleware/requireCompanySession.js'
import * as eventService from '../services/companyEvent.service.js'

function handleServiceError(err: unknown, res: Response) {
  const statusCode = (err as Error & { statusCode?: number }).statusCode ?? 500
  const message = err instanceof Error ? err.message : 'Internal server error'
  res.status(statusCode).json({
    message,
    code: statusCode === 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED',
  })
}

function requireSession(
  req: CompanySessionRequest,
  res: Response,
): { companyId: string } | null {
  if (!req.user || !req.sessionCompanyId) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return null
  }
  return { companyId: req.sessionCompanyId }
}

export async function listEvents(req: CompanySessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined
    const from = typeof req.query.from === 'string' ? req.query.from : undefined
    const to = typeof req.query.to === 'string' ? req.query.to : undefined
    const page = req.query.page ? Number(req.query.page) : undefined
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined
    const result = await eventService.listCompanyEvents(session.companyId, {
      q,
      from,
      to,
      page: Number.isFinite(page) ? page : undefined,
      pageSize: Number.isFinite(pageSize) ? pageSize : undefined,
    })
    res.json(result)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function getEvent(req: CompanySessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const item = await eventService.getCompanyEvent(session.companyId, String(req.params.id))
    res.json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

function bearerToken(req: CompanySessionRequest): string | undefined {
  const header = req.headers.authorization
  if (!header || typeof header !== 'string') return undefined
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  return match?.[1]
}

export async function createEvent(req: CompanySessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const item = await eventService.createCompanyEvent(session.companyId, req.body, {
      accessToken: bearerToken(req),
    })
    res.status(201).json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function updateEvent(req: CompanySessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const item = await eventService.updateCompanyEvent(
      session.companyId,
      String(req.params.id),
      req.body,
      { accessToken: bearerToken(req) },
    )
    res.json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function deleteEvent(req: CompanySessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    await eventService.deleteCompanyEvent(session.companyId, String(req.params.id))
    res.status(204).send()
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function listSessionTokens(req: CompanySessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const occurrenceDate = String(req.params.occurrenceDate)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(occurrenceDate)) {
      res.status(400).json({ message: 'Invalid session date', code: 'REQUEST_FAILED' })
      return
    }
    const detail = await eventService.getSessionDetail(
      session.companyId,
      String(req.params.eventId),
      occurrenceDate,
    )
    res.json(detail)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function createSessionToken(req: CompanySessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const occurrenceDate = String(req.params.occurrenceDate)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(occurrenceDate)) {
      res.status(400).json({ message: 'Invalid session date', code: 'REQUEST_FAILED' })
      return
    }
    const item = await eventService.createSessionToken(
      session.companyId,
      String(req.params.eventId),
      occurrenceDate,
      req.body,
    )
    res.status(201).json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

function parseOccurrenceDate(
  req: CompanySessionRequest,
  res: Response,
): string | null {
  const occurrenceDate = String(req.params.occurrenceDate)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(occurrenceDate)) {
    res.status(400).json({ message: 'Invalid session date', code: 'REQUEST_FAILED' })
    return null
  }
  return occurrenceDate
}

export async function getSession(req: CompanySessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  const occurrenceDate = parseOccurrenceDate(req, res)
  if (!occurrenceDate) return
  try {
    const detail = await eventService.getSessionDetail(
      session.companyId,
      String(req.params.eventId),
      occurrenceDate,
    )
    res.json(detail)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function startSession(req: CompanySessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  const occurrenceDate = parseOccurrenceDate(req, res)
  if (!occurrenceDate) return
  try {
    const detail = await eventService.startSession(
      session.companyId,
      String(req.params.eventId),
      occurrenceDate,
      req.user!.id,
    )
    res.json(detail)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function callNextSessionToken(req: CompanySessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  const occurrenceDate = parseOccurrenceDate(req, res)
  if (!occurrenceDate) return
  try {
    const detail = await eventService.callNextSessionToken(
      session.companyId,
      String(req.params.eventId),
      occurrenceDate,
    )
    res.json(detail)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function endSession(req: CompanySessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  const occurrenceDate = parseOccurrenceDate(req, res)
  if (!occurrenceDate) return
  try {
    const detail = await eventService.endSession(
      session.companyId,
      String(req.params.eventId),
      occurrenceDate,
    )
    res.json(detail)
  } catch (err) {
    handleServiceError(err, res)
  }
}
