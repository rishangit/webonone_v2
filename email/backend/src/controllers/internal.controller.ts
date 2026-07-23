import type { Request, Response } from 'express'
import type { InternalSendBody } from '../schemas/internal.schema.js'
import { enqueue } from '../services/queue.service.js'
import { ensureWelcomeTemplate } from '../services/template.service.js'

export async function internalSend(req: Request, res: Response) {
  const body = req.body as InternalSendBody
  const result = await enqueue({
    templateSlug: body.templateSlug,
    toEmail: body.toEmail,
    payload: body.payload,
    companyId: body.companyId,
  })
  res.status(202).json(result)
}

export async function internalEnsureWelcome(req: Request, res: Response) {
  const companyId = String(req.params.companyId)
  const name = typeof req.body?.name === 'string' ? req.body.name : undefined
  const result = await ensureWelcomeTemplate(companyId, name)
  res.json(result)
}
