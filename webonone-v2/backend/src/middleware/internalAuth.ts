import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'

export function requireInternalAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.header('X-WebOnOne-Service-Key')
  if (!env.webononeServiceApiKey) {
    res.status(503).json({
      message: 'Internal WebOnOne API is not configured',
      code: 'WEBONONE_API_DISABLED',
    })
    return
  }
  if (!apiKey || apiKey !== env.webononeServiceApiKey) {
    res.status(401).json({ message: 'Unauthorized', code: 'INVALID_SERVICE_KEY' })
    return
  }
  next()
}
