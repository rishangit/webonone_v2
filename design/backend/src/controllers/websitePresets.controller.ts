import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { HttpError } from '../services/httpError.js'
import {
  createWebsitePreset,
  deleteWebsitePreset,
  getWebsitePreset,
  listWebsitePresets,
  updateWebsitePreset,
} from '../services/websitePreset.service.js'
import { createWebsitePresetSchema, updateWebsitePresetSchema } from '../schemas/websitePresets.schema.js'

function companyIdOrThrow(req: AuthenticatedRequest): string {
  const companyId = req.user?.companyId
  if (!companyId) throw new HttpError(403, 'Company context required', 'COMPANY_REQUIRED')
  return companyId
}

export async function listWebsitePresetsHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined
    const q = typeof req.query.q === 'string' ? req.query.q : undefined
    res.json(await listWebsitePresets({ companyId: companyIdOrThrow(req), page, pageSize, q }))
  } catch (err) {
    next(err)
  }
}

export async function getWebsitePresetHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const item = await getWebsitePreset({ companyId: companyIdOrThrow(req), id: String(req.params.id) })
    res.json({ item })
  } catch (err) {
    next(err)
  }
}

export async function createWebsitePresetHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = createWebsitePresetSchema.parse(req.body)
    const item = await createWebsitePreset({
      companyId: companyIdOrThrow(req),
      userId: req.user!.id,
      body,
    })
    res.status(201).json({ item })
  } catch (err) {
    next(err)
  }
}

export async function updateWebsitePresetHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = updateWebsitePresetSchema.parse(req.body)
    const item = await updateWebsitePreset({
      companyId: companyIdOrThrow(req),
      id: String(req.params.id),
      body,
    })
    res.json({ item })
  } catch (err) {
    next(err)
  }
}

export async function deleteWebsitePresetHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await deleteWebsitePreset({ companyId: companyIdOrThrow(req), id: String(req.params.id) })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
