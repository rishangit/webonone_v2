import type { NextFunction, Response } from 'express'
import type { AuthenticatedRequest } from './auth.js'
import {
  companyIdFromClaims,
  parseJwtUserClaims,
  sessionRoleFromClaims,
} from './requireSuperAdmin.js'

export interface CompanyAdminSessionRequest extends AuthenticatedRequest {
  sessionCompanyId?: string
}

/** Requires JWT with platform_role=company_admin and a non-null company_id. */
export function requireCompanyAdminSession(
  req: CompanyAdminSessionRequest,
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
    if (sessionRoleFromClaims(claims) !== 'company_admin') {
      res.status(403).json({ message: 'Company admin session required', code: 'FORBIDDEN' })
      return
    }

    const companyId = companyIdFromClaims(claims)
    if (!companyId) {
      res.status(403).json({ message: 'Active company required', code: 'FORBIDDEN' })
      return
    }

    req.user = { id: claims.sub, email: claims.email }
    req.sessionCompanyId = companyId
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token', code: 'UNAUTHORIZED' })
  }
}
