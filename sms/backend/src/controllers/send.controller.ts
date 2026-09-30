import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { OtpSendBody, OtpVerifyBody, SendSmsBody, SendTestSmsBody } from '../schemas/send.schema.js'
import { logAudit } from '../services/audit.service.js'
import { sendOtp, verifyOtp } from '../services/otp.service.js'
import { enqueue } from '../services/queue.service.js'
import {
  canAccessTemplate,
  getTemplateById,
  resolveTemplateForDelivery,
} from '../services/template.service.js'

/** Company admins are always scoped to their own company; super admins may target platform or a company. */
function effectiveCompanyId(req: AuthenticatedRequest, requested?: string): string | null {
  const user = req.user!
  if (user.role === 'company_admin') return user.companyId ?? null
  return requested ?? null
}

async function assertTemplateSendAccess(
  req: AuthenticatedRequest,
  templateSlug: string,
  companyId: string | null,
): Promise<void> {
  const user = req.user!
  if (!['super_admin', 'company_admin'].includes(user.role)) {
    throw new Error('Forbidden')
  }

  const resolved = await resolveTemplateForDelivery(templateSlug, companyId)
  if (resolved.outcome === 'inactive') {
    throw new Error('TEMPLATE_INACTIVE')
  }
  if (resolved.outcome === 'missing') {
    throw new Error(`Template not found: ${templateSlug}`)
  }

  const dto = await getTemplateById(resolved.template.id)
  if (!dto || !canAccessTemplate(dto, user.role, user.companyId)) {
    throw new Error('Forbidden')
  }
}

function handleSendError(err: unknown, res: Response, fallbackMessage: string) {
  const message = err instanceof Error ? err.message : fallbackMessage
  if (message === 'TEMPLATE_INACTIVE') {
    res.status(400).json({ message: 'Template is inactive', code: 'TEMPLATE_INACTIVE' })
    return
  }
  if (message === 'Forbidden') {
    res.status(403).json({ message: 'Forbidden', code: 'FORBIDDEN' })
    return
  }
  res.status(400).json({ message, code: 'BAD_REQUEST' })
}

export async function sendSms(req: AuthenticatedRequest, res: Response) {
  try {
    const body = req.body as SendSmsBody
    const companyId = effectiveCompanyId(req, body.companyId)
    if (body.templateSlug) {
      await assertTemplateSendAccess(req, body.templateSlug, companyId)
    }
    const result = await enqueue({
      toNumber: body.toNumber,
      body: body.body,
      templateSlug: body.templateSlug,
      payload: body.payload,
      companyId,
    })
    if (result.status === 'skipped') {
      res.status(400).json({ message: 'Template is inactive', code: 'TEMPLATE_INACTIVE' })
      return
    }

    await logAudit({
      userId: req.user?.id,
      action: 'manual_send',
      entityType: 'sms_queue',
      entityId: result.queueId,
      metadata: { toNumber: body.toNumber, templateSlug: body.templateSlug ?? null },
    })
    res.status(202).json(result)
  } catch (err) {
    handleSendError(err, res, 'Send failed')
  }
}

export async function sendTestSms(req: AuthenticatedRequest, res: Response) {
  try {
    const body = req.body as SendTestSmsBody
    const companyId = effectiveCompanyId(req, body.companyId)
    const templateSlug = body.templateSlug ?? (body.body ? undefined : 'generic')
    if (templateSlug) {
      await assertTemplateSendAccess(req, templateSlug, companyId)
    }
    const payload = { code: '483921', minutes: '5', body: 'This is a test message', ...body.payload }
    const result = await enqueue({
      toNumber: body.toNumber,
      body: body.body,
      templateSlug,
      payload,
      companyId,
    })
    if (result.status === 'skipped') {
      res.status(400).json({ message: 'Template is inactive', code: 'TEMPLATE_INACTIVE' })
      return
    }

    await logAudit({
      userId: req.user?.id,
      action: 'test_send',
      entityType: 'sms_queue',
      entityId: result.queueId,
      metadata: { toNumber: body.toNumber },
    })
    res.status(202).json(result)
  } catch (err) {
    handleSendError(err, res, 'Send failed')
  }
}

export async function otpSend(req: AuthenticatedRequest, res: Response) {
  try {
    const body = req.body as OtpSendBody
    const companyId = effectiveCompanyId(req, body.companyId)
    const result = await sendOtp({ phoneNumber: body.toNumber, purpose: body.purpose, companyId })
    res.status(202).json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OTP send failed'
    res.status(400).json({ message, code: 'BAD_REQUEST' })
  }
}

export async function otpVerify(req: AuthenticatedRequest, res: Response) {
  const body = req.body as OtpVerifyBody
  const companyId = effectiveCompanyId(req, body.companyId)
  const result = await verifyOtp({
    phoneNumber: body.toNumber,
    purpose: body.purpose,
    code: body.code,
    companyId,
  })
  res.json(result)
}
