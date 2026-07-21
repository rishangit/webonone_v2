import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { TemplateScope } from '../models/db.js'
import type {
  CreateTemplateBody,
  PreviewTemplateBody,
  RestoreTemplateBody,
  UpdateTemplateBody,
} from '../schemas/template.schema.js'
import { logAudit } from '../services/audit.service.js'
import {
  canAccessTemplate,
  createTemplate,
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

/** Scope and company_id are derived from the JWT role, never taken from the body. */
export async function postTemplate(req: AuthenticatedRequest, res: Response) {
  const user = req.user!
  const scope: TemplateScope = user.role === 'super_admin' ? 'platform' : 'company'
  const companyId = scope === 'company' ? user.companyId : null
  if (scope === 'company' && !companyId) {
    res.status(400).json({ message: 'Company admin has no company assigned', code: 'BAD_REQUEST' })
    return
  }

  const body = req.body as CreateTemplateBody
  try {
    const created = await createTemplate(
      {
        slug: body.slug,
        name: body.name,
        subject: body.subject,
        htmlBody: body.htmlBody,
        textBody: body.textBody,
        scope,
        companyId,
        requiredKeys: body.requiredKeys,
        isActive: body.isActive,
      },
      user.id,
    )
    await logAudit({
      userId: user.id,
      action: 'template_create',
      entityType: 'email_template',
      entityId: created.id,
    })
    res.status(201).json(created)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Create failed'
    res.status(400).json({ message, code: 'BAD_REQUEST' })
  }
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
