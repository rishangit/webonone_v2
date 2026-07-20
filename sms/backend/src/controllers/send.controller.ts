import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { OtpSendBody, OtpVerifyBody, SendSmsBody, SendTestSmsBody } from '../schemas/send.schema.js'
import { logAudit } from '../services/audit.service.js'
import { sendOtp, verifyOtp } from '../services/otp.service.js'
import { enqueue } from '../services/queue.service.js'

/** Company admins are always scoped to their own company; super admins may target platform or a company. */
function effectiveCompanyId(req: AuthenticatedRequest, requested?: string): string | null {
  const user = req.user!
  if (user.role === 'company_admin') return user.companyId ?? null
  return requested ?? null
}

export async function sendSms(req: AuthenticatedRequest, res: Response) {
  try {
    const body = req.body as SendSmsBody
    const companyId = effectiveCompanyId(req, body.companyId)
    const result = await enqueue({
      toNumber: body.toNumber,
      body: body.body,
      templateSlug: body.templateSlug,
      payload: body.payload,
      companyId,
    })
    await logAudit({
      userId: req.user?.id,
      action: 'manual_send',
      entityType: 'sms_queue',
      entityId: result.queueId,
      metadata: { toNumber: body.toNumber, templateSlug: body.templateSlug ?? null },
    })
    res.status(202).json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Send failed'
    res.status(400).json({ message, code: 'BAD_REQUEST' })
  }
}

export async function sendTestSms(req: AuthenticatedRequest, res: Response) {
  try {
    const body = req.body as SendTestSmsBody
    const companyId = effectiveCompanyId(req, body.companyId)
    const payload = { code: '483921', minutes: '5', body: 'This is a test message', ...body.payload }
    const result = await enqueue({
      toNumber: body.toNumber,
      body: body.body,
      templateSlug: body.templateSlug ?? (body.body ? undefined : 'generic'),
      payload,
      companyId,
    })
    await logAudit({
      userId: req.user?.id,
      action: 'test_send',
      entityType: 'sms_queue',
      entityId: result.queueId,
      metadata: { toNumber: body.toNumber },
    })
    res.status(202).json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Send failed'
    res.status(400).json({ message, code: 'BAD_REQUEST' })
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
