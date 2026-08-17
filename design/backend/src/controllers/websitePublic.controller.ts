import type { Request, Response, NextFunction } from 'express'
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
