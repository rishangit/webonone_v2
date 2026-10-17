import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'

export function requireInternalAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.header('X-Design-Service-Key')
  if (!env.designServiceApiKey) {
    res.status(503).json({ message: 'Internal design API is not configured', code: 'DESIGN_API_DISABLED' })
    return
  }
  if (!apiKey || apiKey !== env.designServiceApiKey) {
    res.status(401).json({ message: 'Unauthorized', code: 'INVALID_SERVICE_KEY' })
    return
  }
  next()
}
