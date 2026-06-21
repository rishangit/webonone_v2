import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import * as siteMediaRefsService from '../services/siteMediaRefs.service.js'

export async function listRefs(req: AuthenticatedRequest, res: Response) {
  const siteId = String(req.params.siteId)
  const refs = await siteMediaRefsService.listSiteMediaRefs(siteId)
  res.json({ refs })
}

export async function createRefs(req: AuthenticatedRequest, res: Response) {
  const siteId = String(req.params.siteId)
  const refs = await siteMediaRefsService.createSiteMediaRefs(siteId, req.body.items)
  res.status(201).json({ refs })
}

export async function deleteRef(req: AuthenticatedRequest, res: Response) {
  const siteId = String(req.params.siteId)
  const refId = String(req.params.refId)
  const deleted = await siteMediaRefsService.deleteSiteMediaRef(refId, siteId)
  if (!deleted) {
    res.status(404).json({ message: 'Media reference not found', code: 'NOT_FOUND' })
    return
  }
  res.json({ id: refId, deleted: true })
}
