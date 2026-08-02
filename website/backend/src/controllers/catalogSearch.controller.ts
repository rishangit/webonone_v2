import type { Request, Response, NextFunction } from 'express'
import * as webononeCatalogClient from '../clients/webononeCatalogClient.js'

function getBearer(req: Request): string | null {
  const header = req.headers.authorization
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null
  return header.slice(7).trim() || null
}

export async function searchCatalog(req: Request, res: Response) {
  const result = await webononeCatalogClient.searchCatalog({
    q: typeof req.query.q === 'string' ? req.query.q : undefined,
    page: typeof req.query.page === 'string' ? req.query.page : undefined,
    pageSize: typeof req.query.pageSize === 'string' ? req.query.pageSize : undefined,
    lat: typeof req.query.lat === 'string' ? req.query.lat : undefined,
    lng: typeof req.query.lng === 'string' ? req.query.lng : undefined,
  })
  res.json(result)
}

export async function getCatalogItem(req: Request, res: Response) {
  const kind = typeof req.params.kind === 'string' ? req.params.kind : ''
  const id = typeof req.params.id === 'string' ? req.params.id : ''
  const item = await webononeCatalogClient.getCatalogItem(kind, id, {
    lat: typeof req.query.lat === 'string' ? req.query.lat : undefined,
    lng: typeof req.query.lng === 'string' ? req.query.lng : undefined,
  })
  res.json(item)
}

export async function listServiceSessions(req: Request, res: Response) {
  const id = typeof req.params.id === 'string' ? req.params.id : ''
  const result = await webononeCatalogClient.listServiceSessions(id, {
    from: typeof req.query.from === 'string' ? req.query.from : undefined,
    to: typeof req.query.to === 'string' ? req.query.to : undefined,
  })
  res.json(result)
}

export async function getNextSessionToken(req: Request, res: Response, next: NextFunction) {
  const accessToken = getBearer(req)
  if (!accessToken) {
    res.status(401).json({ message: 'Missing or invalid authorization header', code: 'UNAUTHORIZED' })
    return
  }
  try {
    const result = await webononeCatalogClient.getNextSessionToken(
      String(req.params.id),
      String(req.params.eventId),
      String(req.params.occurrenceDate),
      accessToken,
    )
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function getMySessionToken(req: Request, res: Response, next: NextFunction) {
  const accessToken = getBearer(req)
  if (!accessToken) {
    res.status(401).json({ message: 'Missing or invalid authorization header', code: 'UNAUTHORIZED' })
    return
  }
  try {
    const item = await webononeCatalogClient.getMySessionToken(
      String(req.params.id),
      String(req.params.eventId),
      String(req.params.occurrenceDate),
      accessToken,
    )
    if (!item) {
      res.status(404).json({ message: 'No token for this session', code: 'NOT_FOUND' })
      return
    }
    res.json(item)
  } catch (err) {
    next(err)
  }
}

export async function bookSessionToken(req: Request, res: Response, next: NextFunction) {
  const accessToken = getBearer(req)
  if (!accessToken) {
    res.status(401).json({ message: 'Missing or invalid authorization header', code: 'UNAUTHORIZED' })
    return
  }
  const body = req.body as { user_display_name?: string; user_email?: string | null }
  if (typeof body.user_display_name !== 'string' || !body.user_display_name.trim()) {
    res.status(400).json({ message: 'user_display_name is required', code: 'BAD_REQUEST' })
    return
  }
  try {
    const item = await webononeCatalogClient.bookSessionToken(
      String(req.params.id),
      String(req.params.eventId),
      String(req.params.occurrenceDate),
      accessToken,
      {
        user_display_name: body.user_display_name.trim(),
        user_email: body.user_email ?? null,
      },
    )
    res.status(201).json(item)
  } catch (err) {
    next(err)
  }
}
