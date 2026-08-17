import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { HttpError } from '../services/httpError.js'
import {
  createWebsiteChrome,
  deleteWebsiteChrome,
  getWebsiteChrome,
  listWebsiteChrome,
  setDefaultWebsiteChrome,
  updateWebsiteChrome,
  type WebsiteChromeKind,
} from '../services/websiteChrome.service.js'
import { createWebsiteChromeSchema, updateWebsiteChromeSchema } from '../schemas/websiteChrome.schema.js'

function companyIdOrThrow(req: AuthenticatedRequest): string {
  const companyId = req.user?.companyId
  if (!companyId) throw new HttpError(403, 'Company context required', 'COMPANY_REQUIRED')
  return companyId
}

function kindFromReq(req: AuthenticatedRequest): WebsiteChromeKind {
  const kind = req.params.kind
  if (kind === 'headers' || kind === 'footers') return kind
  throw new HttpError(404, 'Not found', 'NOT_FOUND')
}

export async function listWebsiteChromeHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined
    const q = typeof req.query.q === 'string' ? req.query.q : undefined
    res.json(
      await listWebsiteChrome({
        kind: kindFromReq(req),
        companyId: companyIdOrThrow(req),
        page,
        pageSize,
        q,
      }),
    )
  } catch (err) {
    next(err)
  }
}

export async function getWebsiteChromeHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const item = await getWebsiteChrome({
      kind: kindFromReq(req),
      companyId: companyIdOrThrow(req),
      id: String(req.params.id),
    })
    res.json({ item })
  } catch (err) {
    next(err)
  }
}

export async function createWebsiteChromeHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = createWebsiteChromeSchema.parse(req.body)
    const item = await createWebsiteChrome({
      kind: kindFromReq(req),
      companyId: companyIdOrThrow(req),
      userId: req.user!.id,
      body,
    })
    res.status(201).json({ item })
  } catch (err) {
    next(err)
  }
}

export async function updateWebsiteChromeHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = updateWebsiteChromeSchema.parse(req.body)
    const item = await updateWebsiteChrome({
      kind: kindFromReq(req),
      companyId: companyIdOrThrow(req),
      id: String(req.params.id),
      body,
    })
    res.json({ item })
  } catch (err) {
    next(err)
  }
}

export async function setDefaultWebsiteChromeHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const item = await setDefaultWebsiteChrome({
      kind: kindFromReq(req),
      companyId: companyIdOrThrow(req),
      id: String(req.params.id),
    })
    res.json({ item })
  } catch (err) {
    next(err)
  }
}

export async function deleteWebsiteChromeHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await deleteWebsiteChrome({
      kind: kindFromReq(req),
      companyId: companyIdOrThrow(req),
      id: String(req.params.id),
    })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
