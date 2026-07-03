import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { DataRole } from '../models/db.js'
import { loadUserRole } from '../services/user.service.js'

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; role: DataRole; companyId: string | null }
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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
    }) as { sub: string; email: string }

    const { role, companyId } = await loadUserRole(decoded.sub)

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role,
      companyId,
    }
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token', code: 'UNAUTHORIZED' })
  }
}

export function requireRole(...roles: DataRole[]) {
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

export const requireSuperAdmin = requireRole('super_admin')
