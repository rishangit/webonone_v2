import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { SendEmailBody, SendTestEmailBody } from '../schemas/send.schema.js'
import { logAudit } from '../services/audit.service.js'
import { enqueue } from '../services/queue.service.js'
import { canAccessTemplate, resolveTemplate } from '../services/template.service.js'

async function assertSendAccess(
  req: AuthenticatedRequest,
  templateSlug: string,
  companyId?: string,
) {
  const user = req.user!
  if (!['super_admin', 'company_admin'].includes(user.role)) {
    throw new Error('Forbidden')
  }

  const effectiveCompanyId = user.role === 'company_admin' ? (user.companyId ?? companyId) : companyId
  const template = await resolveTemplate(templateSlug, effectiveCompanyId)
  if (!template) {
    throw new Error(`Template not found: ${templateSlug}`)
  }

  const dto = {
    id: template.id,
    slug: template.slug,
    name: template.name,
    subject: template.subject,
    htmlBody: template.html_body,
    textBody: template.text_body,
    scope: template.scope,
    companyId: template.company_id,
    isActive: template.is_active,
    requiredKeys: [],
    createdAt: template.created_at.toISOString(),
    updatedAt: template.updated_at.toISOString(),
  }

  if (!canAccessTemplate(dto, user.role, user.companyId)) {
    throw new Error('Forbidden')
  }

  if (user.role === 'company_admin' && effectiveCompanyId && user.companyId !== effectiveCompanyId) {
    throw new Error('Forbidden')
  }

  return effectiveCompanyId ?? null
}

export async function sendEmail(req: AuthenticatedRequest, res: Response) {
  try {
    const body = req.body as SendEmailBody
    const companyId = await assertSendAccess(req, body.templateSlug, body.companyId)
    const result = await enqueue({
      templateSlug: body.templateSlug,
      toEmail: body.toEmail,
      payload: body.payload,
      companyId,
    })

    await logAudit({
      userId: req.user?.id,
      action: 'manual_send',
      entityType: 'email_queue',
      entityId: result.queueId,
      metadata: { templateSlug: body.templateSlug, toEmail: body.toEmail },
    })

    res.status(202).json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Send failed'
    const status = message === 'Forbidden' ? 403 : 400
    res.status(status).json({ message, code: status === 403 ? 'FORBIDDEN' : 'BAD_REQUEST' })
  }
}

export async function sendTestEmail(req: AuthenticatedRequest, res: Response) {
  try {
    const body = req.body as SendTestEmailBody
    const companyId = await assertSendAccess(req, body.templateSlug, body.companyId)
    const payload = {
      userName: req.user?.email ?? 'Test User',
      companyName: 'Test Company',
      actionUrl: 'https://example.com/test',
      message: 'This is a test message',
      ...body.payload,
    }
    const result = await enqueue({
      templateSlug: body.templateSlug,
      toEmail: body.toEmail,
      payload,
      companyId,
    })

    await logAudit({
      userId: req.user?.id,
      action: 'test_send',
      entityType: 'email_queue',
      entityId: result.queueId,
      metadata: { templateSlug: body.templateSlug, toEmail: body.toEmail },
    })

    res.status(202).json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Send failed'
    const status = message === 'Forbidden' ? 403 : 400
    res.status(status).json({ message, code: status === 403 ? 'FORBIDDEN' : 'BAD_REQUEST' })
  }
}
