import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { HttpError } from '../services/httpError.js'
import {
  createWebsiteLayout,
  deleteWebsiteLayout,
  getWebsiteLayout,
  listWebsiteLayouts,
  setDefaultWebsiteLayout,
  updateWebsiteLayout,
} from '../services/websiteLayout.service.js'
import { createWebsiteLayoutSchema, updateWebsiteLayoutSchema } from '../schemas/websiteLayouts.schema.js'

function companyIdOrThrow(req: AuthenticatedRequest): string {
  const companyId = req.user?.companyId
  if (!companyId) throw new HttpError(403, 'Company context required', 'COMPANY_REQUIRED')
  return companyId
}

export async function listWebsiteLayoutsHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined
    const q = typeof req.query.q === 'string' ? req.query.q : undefined
    res.json(
      await listWebsiteLayouts({
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

export async function getWebsiteLayoutHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const item = await getWebsiteLayout({
      companyId: companyIdOrThrow(req),
      id: String(req.params.id),
    })
    res.json({ item })
  } catch (err) {
    next(err)
  }
}

export async function createWebsiteLayoutHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = createWebsiteLayoutSchema.parse(req.body)
    const item = await createWebsiteLayout({
      companyId: companyIdOrThrow(req),
      userId: req.user!.id,
      body,
    })
    res.status(201).json({ item })
  } catch (err) {
    next(err)
  }
}

export async function updateWebsiteLayoutHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = updateWebsiteLayoutSchema.parse(req.body)
    const item = await updateWebsiteLayout({
      companyId: companyIdOrThrow(req),
      id: String(req.params.id),
      body,
    })
    res.json({ item })
  } catch (err) {
    next(err)
  }
}

export async function setDefaultWebsiteLayoutHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const item = await setDefaultWebsiteLayout({
      companyId: companyIdOrThrow(req),
      id: String(req.params.id),
    })
    res.json({ item })
  } catch (err) {
    next(err)
  }
}

export async function deleteWebsiteLayoutHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await deleteWebsiteLayout({
      companyId: companyIdOrThrow(req),
      id: String(req.params.id),
    })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
