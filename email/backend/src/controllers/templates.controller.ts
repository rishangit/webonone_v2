import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { PreviewTemplateBody, RestoreTemplateBody, UpdateTemplateBody } from '../schemas/template.schema.js'
import { logAudit } from '../services/audit.service.js'
import {
  canAccessTemplate,
  getTemplateById,
  listTemplateVersions,
  listTemplates,
  previewTemplate,
  restoreTemplateVersion,
  updateTemplate,
} from '../services/template.service.js'

function scopeCompanyId(req: AuthenticatedRequest): string | undefined {
  if (req.user?.role === 'company_admin') return req.user.companyId ?? undefined
  return undefined
}

export async function getTemplates(req: AuthenticatedRequest, res: Response) {
  const companyId = scopeCompanyId(req)
  const items = await listTemplates({ companyId, role: req.user?.role })
  res.json({ items })
}

export async function getTemplate(req: AuthenticatedRequest, res: Response) {
  const id = String(req.params.id)
  const template = await getTemplateById(id)
  if (!template) {
    res.status(404).json({ message: 'Template not found', code: 'NOT_FOUND' })
    return
  }
  if (!canAccessTemplate(template, req.user!.role, req.user!.companyId)) {
    res.status(403).json({ message: 'Forbidden', code: 'FORBIDDEN' })
    return
  }
  res.json(template)
}

export async function putTemplate(req: AuthenticatedRequest, res: Response) {
  const id = String(req.params.id)
  const existing = await getTemplateById(id)
  if (!existing) {
    res.status(404).json({ message: 'Template not found', code: 'NOT_FOUND' })
    return
  }
  if (!canAccessTemplate(existing, req.user!.role, req.user!.companyId)) {
    res.status(403).json({ message: 'Forbidden', code: 'FORBIDDEN' })
    return
  }
  if (req.user!.role === 'company_admin' && existing.scope === 'platform') {
    res.status(403).json({ message: 'Company admins cannot edit platform templates', code: 'FORBIDDEN' })
    return
  }

  const body = req.body as UpdateTemplateBody
  const updated = await updateTemplate(id, body, req.user?.id)
  await logAudit({
    userId: req.user?.id,
    action: 'template_update',
    entityType: 'email_template',
    entityId: updated.id,
  })
  res.json(updated)
}

export async function getTemplateVersions(req: AuthenticatedRequest, res: Response) {
  const id = String(req.params.id)
  const template = await getTemplateById(id)
  if (!template) {
    res.status(404).json({ message: 'Template not found', code: 'NOT_FOUND' })
    return
  }
  if (!canAccessTemplate(template, req.user!.role, req.user!.companyId)) {
    res.status(403).json({ message: 'Forbidden', code: 'FORBIDDEN' })
    return
  }
  const items = await listTemplateVersions(id)
  res.json({ items })
}

export async function restoreTemplate(req: AuthenticatedRequest, res: Response) {
  const id = String(req.params.id)
  const template = await getTemplateById(id)
  if (!template) {
    res.status(404).json({ message: 'Template not found', code: 'NOT_FOUND' })
    return
  }
  if (!canAccessTemplate(template, req.user!.role, req.user!.companyId)) {
    res.status(403).json({ message: 'Forbidden', code: 'FORBIDDEN' })
    return
  }

  const body = req.body as RestoreTemplateBody
  const restored = await restoreTemplateVersion(id, body.versionId, req.user?.id)
  await logAudit({
    userId: req.user?.id,
    action: 'template_restore',
    entityType: 'email_template',
    entityId: restored.id,
    metadata: { versionId: body.versionId },
  })
  res.json(restored)
}

export async function postTemplatePreview(req: AuthenticatedRequest, res: Response) {
  const id = String(req.params.id)
  const template = await getTemplateById(id)
  if (!template) {
    res.status(404).json({ message: 'Template not found', code: 'NOT_FOUND' })
    return
  }
  if (!canAccessTemplate(template, req.user!.role, req.user!.companyId)) {
    res.status(403).json({ message: 'Forbidden', code: 'FORBIDDEN' })
    return
  }

  const body = req.body as PreviewTemplateBody
  const rendered = await previewTemplate(id, body.payload, body.companyId ?? template.companyId)
  res.json(rendered)
}
