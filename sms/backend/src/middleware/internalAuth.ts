import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'

export function requireInternalAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.header('X-Sms-Service-Key')
  if (!env.smsServiceApiKey) {
    res.status(503).json({ message: 'Internal SMS API is not configured', code: 'SMS_API_DISABLED' })
    return
  }
  if (!apiKey || apiKey !== env.smsServiceApiKey) {
    res.status(401).json({ message: 'Unauthorized', code: 'INVALID_SERVICE_KEY' })
    return
  }
  next()
}
