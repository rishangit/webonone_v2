import type { Request, Response } from 'express'
import { invoiceIssuedNotifyBodySchema } from '../schemas/invoiceNotifySchemas.js'
import { notifySubscriptionInvoiceIssued } from '../services/subscriptionInvoiceNotify.service.js'

export async function notifyInvoiceIssued(req: Request, res: Response): Promise<void> {
  const parsed = invoiceIssuedNotifyBodySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    })
    return
  }

  notifySubscriptionInvoiceIssued(parsed.data)
  res.status(202).json({ accepted: true })
}
