import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'

export function requireServiceKey(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-identity-service-key']
  if (!env.identityServiceApiKey || key !== env.identityServiceApiKey) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }
  next()
}
