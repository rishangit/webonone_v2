import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export type PlatformRole = 'super_admin' | 'company_admin' | 'member'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    platformRole: PlatformRole
    companyId: string | null
  }
}

type JwtClaims = {
  sub: string
  email: string
  platform_role?: PlatformRole
  company_id?: string | null
}

export function attachJwtUser(req: AuthenticatedRequest, token: string): boolean {
  try {
    const decoded = jwt.verify(token, env.jwtSecret, {
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
    }) as JwtClaims

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      platformRole: decoded.platform_role ?? 'member',
      companyId: decoded.company_id ?? null,
    }
    return true
  } catch {
    return false
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid authorization header', code: 'UNAUTHORIZED' })
    return
  }

  if (!attachJwtUser(req, header.slice(7))) {
    res.status(401).json({ message: 'Invalid or expired token', code: 'UNAUTHORIZED' })
    return
  }
  next()
}

export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }
  if (req.user.platformRole !== 'super_admin') {
    res.status(403).json({ message: 'Super admin access required', code: 'FORBIDDEN' })
    return
  }
  next()
}
