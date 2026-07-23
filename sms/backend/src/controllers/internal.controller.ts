import type { Request, Response } from 'express'
import type {
  InternalOtpSendBody,
  InternalOtpVerifyBody,
  InternalSendBody,
} from '../schemas/internal.schema.js'
import { getGatewayStatus } from '../services/device.service.js'
import { sendOtp, verifyOtp } from '../services/otp.service.js'
import { enqueue } from '../services/queue.service.js'
import { ensureWelcomeTemplate } from '../services/template.service.js'

export async function internalSend(req: Request, res: Response) {
  const body = req.body as InternalSendBody
  const result = await enqueue({
    toNumber: body.toNumber,
    body: body.body,
    templateSlug: body.templateSlug,
    payload: body.payload,
    companyId: body.companyId,
  })
  res.status(202).json(result)
}

export async function internalOtpSend(req: Request, res: Response) {
  const body = req.body as InternalOtpSendBody
  const result = await sendOtp({
    phoneNumber: body.toNumber,
    purpose: body.purpose,
    companyId: body.companyId,
  })
  res.status(202).json(result)
}

export async function internalOtpVerify(req: Request, res: Response) {
  const body = req.body as InternalOtpVerifyBody
  const result = await verifyOtp({
    phoneNumber: body.toNumber,
    purpose: body.purpose,
    code: body.code,
    companyId: body.companyId,
  })
  res.json(result)
}

export async function internalGatewayStatus(req: Request, res: Response) {
  const companyId = String(req.params.companyId)
  const status = await getGatewayStatus(companyId)
  res.json(status)
}

export async function internalEnsureWelcome(req: Request, res: Response) {
  const companyId = String(req.params.companyId)
  const name = typeof req.body?.name === 'string' ? req.body.name : undefined
  const result = await ensureWelcomeTemplate(companyId, name)
  res.json(result)
}
