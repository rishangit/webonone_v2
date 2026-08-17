import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { HttpError } from '../services/httpError.js'
import {
  createWebsiteTheme,
  deleteWebsiteTheme,
  getWebsiteTheme,
  listWebsiteThemes,
  setDefaultWebsiteTheme,
  updateWebsiteTheme,
} from '../services/websiteTheme.service.js'
import { createWebsiteThemeSchema, updateWebsiteThemeSchema } from '../schemas/websiteThemes.schema.js'

function companyIdOrThrow(req: AuthenticatedRequest): string {
  const companyId = req.user?.companyId
  if (!companyId) throw new HttpError(403, 'Company context required', 'COMPANY_REQUIRED')
  return companyId
}

export async function listWebsiteThemesHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined
    const q = typeof req.query.q === 'string' ? req.query.q : undefined
    res.json(await listWebsiteThemes({ companyId: companyIdOrThrow(req), page, pageSize, q }))
  } catch (err) {
    next(err)
  }
}

export async function getWebsiteThemeHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const theme = await getWebsiteTheme({ companyId: companyIdOrThrow(req), id: String(req.params.id) })
    res.json({ theme })
  } catch (err) {
    next(err)
  }
}

export async function createWebsiteThemeHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = createWebsiteThemeSchema.parse(req.body)
    const theme = await createWebsiteTheme({
      companyId: companyIdOrThrow(req),
      userId: req.user!.id,
      body,
    })
    res.status(201).json({ theme })
  } catch (err) {
    next(err)
  }
}

export async function updateWebsiteThemeHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = updateWebsiteThemeSchema.parse(req.body)
    const theme = await updateWebsiteTheme({
      companyId: companyIdOrThrow(req),
      id: String(req.params.id),
      body,
    })
    res.json({ theme })
  } catch (err) {
    next(err)
  }
}

export async function setDefaultWebsiteThemeHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const theme = await setDefaultWebsiteTheme({
      companyId: companyIdOrThrow(req),
      id: String(req.params.id),
    })
    res.json({ theme })
  } catch (err) {
    next(err)
  }
}

export async function deleteWebsiteThemeHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await deleteWebsiteTheme({ companyId: companyIdOrThrow(req), id: String(req.params.id) })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
