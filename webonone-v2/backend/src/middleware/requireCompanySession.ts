import type { NextFunction, Response } from 'express'
import type { AuthenticatedRequest } from './auth.js'
import {
  companyIdFromClaims,
  parseJwtUserClaims,
  sessionRoleFromClaims,
  type PlatformRole,
} from './requireSuperAdmin.js'

export interface CompanySessionRequest extends AuthenticatedRequest {
  sessionCompanyId?: string
  sessionRole?: PlatformRole
}

const COMPANY_SESSION_ROLES: ReadonlySet<PlatformRole> = new Set(['company_admin', 'member'])

/**
 * Requires JWT with platform_role company_admin or member (staff) and a non-null company_id.
 */
export function requireCompanySession(
  req: CompanySessionRequest,
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
    const claims = parseJwtUserClaims(token)
    const role = sessionRoleFromClaims(claims)
    if (!COMPANY_SESSION_ROLES.has(role)) {
      res.status(403).json({ message: 'Company session required', code: 'FORBIDDEN' })
      return
    }

    const companyId = companyIdFromClaims(claims)
    if (!companyId) {
      res.status(403).json({ message: 'Active company required', code: 'FORBIDDEN' })
      return
    }

    req.user = { id: claims.sub, email: claims.email }
    req.sessionCompanyId = companyId
    req.sessionRole = role
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token', code: 'UNAUTHORIZED' })
  }
}

/**
 * Company session, or super admin (company_id optional — omit to read across companies).
 */
export function requireCompanySessionOrSuperAdmin(
  req: CompanySessionRequest,
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
    const claims = parseJwtUserClaims(token)
    const role = sessionRoleFromClaims(claims)
    const companyId = companyIdFromClaims(claims)

    if (role === 'super_admin') {
      req.user = { id: claims.sub, email: claims.email }
      req.sessionCompanyId = companyId ?? undefined
      req.sessionRole = role
      next()
      return
    }

    if (!COMPANY_SESSION_ROLES.has(role)) {
      res.status(403).json({ message: 'Company session required', code: 'FORBIDDEN' })
      return
    }

    if (!companyId) {
      res.status(403).json({ message: 'Active company required', code: 'FORBIDDEN' })
      return
    }

    req.user = { id: claims.sub, email: claims.email }
    req.sessionCompanyId = companyId
    req.sessionRole = role
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token', code: 'UNAUTHORIZED' })
  }
}

export function historyReadScope(
  req: CompanySessionRequest,
): { userId: string; companyId: string | null } | null {
  if (!req.user) return null
  if (req.sessionCompanyId) {
    return { userId: req.user.id, companyId: req.sessionCompanyId }
  }
  if (req.sessionRole === 'super_admin') {
    return { userId: req.user.id, companyId: null }
  }
  return null
}
