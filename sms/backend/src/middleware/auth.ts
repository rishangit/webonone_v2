import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { SmsRole } from '../models/db.js'
import { ensureLocalCompany, ensureLocalUser } from '../services/user.service.js'

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; role: SmsRole; companyId: string | null }
}

type JwtClaims = {
  sub: string
  email: string
  platform_role?: SmsRole
  company_id?: string | null
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid authorization header', code: 'UNAUTHORIZED' })
    return
  }

  const token = header.slice(7)
  let user: NonNullable<AuthenticatedRequest['user']>
  try {
    const decoded = jwt.verify(token, env.jwtSecret, {
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
    }) as JwtClaims

    user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.platform_role ?? 'member',
      companyId: decoded.company_id ?? null,
    }
    req.user = user
  } catch {
    res.status(401).json({ message: 'Invalid or expired token', code: 'UNAUTHORIZED' })
    return
  }

  try {
    // Local mirrors for Identity IDs — required by FKs on audit / versions / company-scoped rows.
    await ensureLocalUser({ userId: user.id, email: user.email })
    if (user.companyId) {
      await ensureLocalCompany({ companyId: user.companyId })
    }
    next()
  } catch (err) {
    next(err)
  }
}

export function requireRole(...roles: SmsRole[]) {
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
