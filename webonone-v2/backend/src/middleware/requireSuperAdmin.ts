import type { NextFunction, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { AuthenticatedRequest } from './auth.js'

export type PlatformRole = 'super_admin' | 'company_admin' | 'member'

export type JwtUserClaims = {
  sub: string
  email: string
  platform_role?: PlatformRole
  company_id?: string | null
}

export function parseJwtUserClaims(token: string): JwtUserClaims {
  return jwt.verify(token, env.jwtSecret, {
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  }) as JwtUserClaims
}

export function sessionRoleFromClaims(claims: JwtUserClaims): PlatformRole {
  return claims.platform_role ?? 'member'
}

export function companyIdFromClaims(claims: JwtUserClaims): string | null {
  return claims.company_id ?? null
}

export interface SuperAdminRequest extends AuthenticatedRequest {
  superAdmin?: { id: string; email: string; displayName: string }
}

export function requireSuperAdmin(
  req: SuperAdminRequest,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid authorization header', code: 'UNAUTHORIZED' })
    return
  }

  const token = header.slice(7)
  try {
    const decoded = parseJwtUserClaims(token)
    if (sessionRoleFromClaims(decoded) !== 'super_admin') {
      res.status(403).json({ message: 'Super admin access required', code: 'FORBIDDEN' })
      return
    }

    req.user = { id: decoded.sub, email: decoded.email }
    req.superAdmin = {
      id: decoded.sub,
      email: decoded.email,
      displayName: env.superAdminDisplayName,
    }
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token', code: 'UNAUTHORIZED' })
  }
}
