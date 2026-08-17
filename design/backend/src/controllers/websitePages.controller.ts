import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { HttpError } from '../services/httpError.js'
import {
  createWebsitePage,
  deleteWebsitePage,
  getWebsitePage,
  listWebsitePages,
  updateWebsitePage,
} from '../services/websitePage.service.js'
import { createWebsitePageSchema, updateWebsitePageSchema } from '../schemas/websitePages.schema.js'
import type { WebsitePageStatus } from '../models/db.js'

function companyIdOrThrow(req: AuthenticatedRequest): string {
  const companyId = req.user?.companyId
  if (!companyId) throw new HttpError(403, 'Company context required', 'COMPANY_REQUIRED')
  return companyId
}

export async function listWebsitePagesHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const companyId = companyIdOrThrow(req)
    const page = req.query.page ? Number(req.query.page) : undefined
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined
    const q = typeof req.query.q === 'string' ? req.query.q : undefined
    const status =
      typeof req.query.status === 'string' && (req.query.status === 'active' || req.query.status === 'inactive')
        ? (req.query.status as WebsitePageStatus)
        : undefined
    res.json(await listWebsitePages({ companyId, page, pageSize, q, status }))
  } catch (err) {
    next(err)
  }
}

export async function getWebsitePageHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const page = await getWebsitePage({ companyId: companyIdOrThrow(req), id: String(req.params.id) })
    res.json({ page })
  } catch (err) {
    next(err)
  }
}

export async function createWebsitePageHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = createWebsitePageSchema.parse(req.body)
    const page = await createWebsitePage({
      companyId: companyIdOrThrow(req),
      userId: req.user!.id,
      body,
    })
    res.status(201).json({ page })
  } catch (err) {
    next(err)
  }
}

export async function updateWebsitePageHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = updateWebsitePageSchema.parse(req.body)
    const page = await updateWebsitePage({
      companyId: companyIdOrThrow(req),
      id: String(req.params.id),
      body,
    })
    res.json({ page })
  } catch (err) {
    next(err)
  }
}

export async function deleteWebsitePageHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await deleteWebsitePage({ companyId: companyIdOrThrow(req), id: String(req.params.id) })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
