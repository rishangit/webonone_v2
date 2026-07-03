import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'

export function requireInternalAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.header('X-Data-Service-Key')
  if (!env.dataServiceApiKey) {
    res.status(503).json({ message: 'Internal Data API is not configured', code: 'DATA_API_DISABLED' })
    return
  }
  if (!apiKey || apiKey !== env.dataServiceApiKey) {
    res.status(401).json({ message: 'Unauthorized', code: 'INVALID_SERVICE_KEY' })
    return
  }
  next()
}
