import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { HttpError } from '../services/httpError.js'
import {
  getWebsiteSiteSettings,
  updateWebsiteSiteSettings,
} from '../services/websiteSettings.service.js'

function companyIdOrThrow(req: AuthenticatedRequest): string {
  const companyId = req.user?.companyId
  if (!companyId) throw new HttpError(403, 'Company context required', 'COMPANY_REQUIRED')
  return companyId
}

export async function getWebsiteSettingsHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const settings = await getWebsiteSiteSettings({ companyId: companyIdOrThrow(req) })
    res.json({ settings })
  } catch (err) {
    next(err)
  }
}

export async function updateWebsiteSettingsHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const settings = await updateWebsiteSiteSettings({
      companyId: companyIdOrThrow(req),
      body: req.body,
    })
    res.json({ settings })
  } catch (err) {
    next(err)
  }
}
