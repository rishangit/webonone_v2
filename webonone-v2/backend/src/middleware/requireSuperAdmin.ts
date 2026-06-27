import type { NextFunction, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import * as repo from '../repositories/company.repository.js'
import type { AuthenticatedRequest } from './auth.js'

export interface SuperAdminRequest extends AuthenticatedRequest {
  superAdmin?: { id: string; email: string; displayName: string }
}

export async function requireSuperAdmin(
  req: SuperAdminRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid authorization header', code: 'UNAUTHORIZED' })
    return
  }

  const token = header.slice(7)
  let email: string
  let userId: string
  try {
    const decoded = jwt.verify(token, env.jwtSecret, {
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
    }) as { sub: string; email: string }

    userId = decoded.sub
    email = decoded.email
    req.user = { id: userId, email }
  } catch {
    res.status(401).json({ message: 'Invalid or expired token', code: 'UNAUTHORIZED' })
    return
  }

  try {
    const admin = await repo.findSuperAdminByEmail(email)
    if (!admin) {
      res.status(403).json({ message: 'Super admin access required', code: 'FORBIDDEN' })
      return
    }

    req.superAdmin = { id: admin.id, email: admin.email, displayName: admin.display_name }
    next()
  } catch {
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
}
