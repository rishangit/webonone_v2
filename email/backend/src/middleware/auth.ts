import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { EmailRole } from '../models/db.js'

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; role: EmailRole; companyId: string | null }
}

type JwtClaims = {
  sub: string
  email: string
  platform_role?: EmailRole
  company_id?: string | null
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid authorization header', code: 'UNAUTHORIZED' })
    return
  }

  const token = header.slice(7)
  try {
    const decoded = jwt.verify(token, env.jwtSecret, {
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
    }) as JwtClaims

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.platform_role ?? 'member',
      companyId: decoded.company_id ?? null,
    }
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token', code: 'UNAUTHORIZED' })
  }
}

export function requireRole(...roles: EmailRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
      return
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden', code: 'FORBIDDEN' })
      return
    }
    next()
  }
}
