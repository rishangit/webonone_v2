import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { UpsertBrandingBody } from '../schemas/branding.schema.js'
import { logAudit } from '../services/audit.service.js'
import { getBranding, upsertBranding } from '../services/branding.service.js'

export async function getBrandingHandler(req: AuthenticatedRequest, res: Response) {
  const companyId = String(req.params.companyId)
  if (req.user?.role === 'company_admin' && req.user.companyId !== companyId) {
    res.status(403).json({ message: 'Forbidden', code: 'FORBIDDEN' })
    return
  }

  const branding = await getBranding(companyId)
  res.json(branding ?? { companyId, name: '', logoUrl: null, primaryColor: null, contactEmail: null, footerHtml: null })
}

export async function putBrandingHandler(req: AuthenticatedRequest, res: Response) {
  const companyId = String(req.params.companyId)
  if (req.user?.role === 'company_admin' && req.user.companyId !== companyId) {
    res.status(403).json({ message: 'Forbidden', code: 'FORBIDDEN' })
    return
  }
  if (!['super_admin', 'company_admin'].includes(req.user?.role ?? '')) {
    res.status(403).json({ message: 'Forbidden', code: 'FORBIDDEN' })
    return
  }

  const body = req.body as UpsertBrandingBody
  const branding = await upsertBranding(companyId, body)
  await logAudit({
    userId: req.user?.id,
    action: 'branding_update',
    entityType: 'email_company_branding',
    entityId: companyId,
  })
  res.json(branding)
}
