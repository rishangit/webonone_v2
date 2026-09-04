import type { Request, Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { HttpError } from '../services/httpError.js'
import { getCompanyFromWebOnOne } from '../services/webononeCompanyClient.js'
import { getPublicWebsiteSite } from '../services/websitePublic.service.js'

export async function getPublicWebsiteSiteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = String(req.params.companyId ?? '')
    const path = typeof req.query.path === 'string' ? req.query.path.replace(/^\/+/, '') : ''
    const site = await getPublicWebsiteSite({ companyId, path })
    res.json(site)
  } catch (err) {
    next(err)
  }
}

export async function getWebsiteLiveUrlHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const companyId = req.user?.companyId
    if (!companyId) throw new HttpError(403, 'Company context required', 'COMPANY_REQUIRED')
    const company = await getCompanyFromWebOnOne(companyId)
    res.json({
      companyId: company.id,
      webSlug: company.webSlug,
      webUrl: company.webUrl,
    })
  } catch (err) {
    next(err)
  }
}
