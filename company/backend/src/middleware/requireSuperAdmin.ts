import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export interface SuperAdminRequest extends Request {
  superAdmin?: { id: string; email: string }
}

export function requireSuperAdmin(req: SuperAdminRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid authorization header', code: 'UNAUTHORIZED' })
    return
  }

  const token = header.slice(7)
  try {
    const decoded = jwt.verify(token, env.superAdminJwtSecret, {
      issuer: env.superAdminJwtIssuer,
      audience: env.superAdminJwtAudience,
    }) as { sub: string; email: string }

    req.superAdmin = { id: decoded.sub, email: decoded.email }
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired super admin token', code: 'UNAUTHORIZED' })
  }
}
