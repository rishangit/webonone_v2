import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string }
}

export function requireIdentityJwt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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

    req.user = { id: decoded.sub, email: decoded.email }
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token', code: 'UNAUTHORIZED' })
  }
}
