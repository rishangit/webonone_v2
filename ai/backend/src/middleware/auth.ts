import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { AiRole } from '../models/db.js'
import { buildAiRequestContext, type AiRequestContext } from '../ai/requestContext.js'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string | null
    email: string | null
    role: AiRole
    companyId: string | null
    guestId: string | null
  }
  aiContext?: AiRequestContext
}

type IdentityClaims = {
  sub: string
  email?: string
  platform_role?: Exclude<AiRole, 'guest'>
  company_id?: string | null
  token_use?: string
}

type GuestClaims = {
  sub: string
  token_use?: string
  company_id?: string | null
  platform_role?: string
}

export type VerifiedPrincipal = NonNullable<AuthenticatedRequest['user']>

export function verifyBearerToken(token: string, secret = env.jwtSecret): VerifiedPrincipal {
  try {
    const decoded = jwt.verify(token, secret, {
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
    }) as IdentityClaims

    if (decoded.token_use === 'guest') {
      throw new Error('mixed_claims')
    }

    return {
      id: decoded.sub,
      email: decoded.email ?? null,
      role: decoded.platform_role ?? 'member',
      companyId: decoded.company_id ?? null,
      guestId: null,
    }
  } catch {
    const decoded = jwt.verify(token, secret, {
      issuer: env.guestJwtIssuer,
      audience: env.guestJwtAudience,
    }) as GuestClaims

    if (decoded.token_use !== 'guest' || decoded.company_id || decoded.platform_role) {
      throw new Error('invalid_guest')
    }

    return {
      id: null,
      email: null,
      role: 'guest',
      companyId: null,
      guestId: decoded.sub,
    }
  }
}

function attachPrincipal(req: AuthenticatedRequest, user: VerifiedPrincipal, accessToken: string) {
  req.user = user
  req.aiContext = buildAiRequestContext({
    userId: user.id,
    companyId: user.companyId,
    guestId: user.guestId,
    role: user.role,
    accessToken,
  })
}

export async function requireAuthOrGuest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid authorization header', code: 'UNAUTHORIZED' })
    return
  }

  try {
    const token = header.slice(7)
    attachPrincipal(req, verifyBearerToken(token), token)
    next()
  } catch {
    console.error('[ai]', 'auth_failed')
    res.status(401).json({ message: 'Invalid or expired token', code: 'UNAUTHORIZED' })
  }
}

export const requireAuth = requireAuthOrGuest

export function requireIdentityUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user?.id || req.user.role === 'guest') {
    res.status(401).json({ message: 'Identity session required', code: 'UNAUTHORIZED' })
    return
  }
  next()
}
