import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'

export function requireInternalAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.header('X-Payment-Service-Key')
  if (!env.paymentServiceApiKey) {
    res.status(503).json({ message: 'Internal payment API is not configured', code: 'PAYMENT_API_DISABLED' })
    return
  }
  if (!apiKey || apiKey !== env.paymentServiceApiKey) {
    res.status(401).json({ message: 'Unauthorized', code: 'INVALID_SERVICE_KEY' })
    return
  }
  next()
}
