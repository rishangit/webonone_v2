import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'

export function requireInternalAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.header('X-Email-Service-Key')
  if (!env.emailServiceApiKey) {
    res.status(503).json({ message: 'Internal email API is not configured', code: 'EMAIL_API_DISABLED' })
    return
  }
  if (!apiKey || apiKey !== env.emailServiceApiKey) {
    res.status(401).json({ message: 'Unauthorized', code: 'INVALID_SERVICE_KEY' })
    return
  }
  next()
}
