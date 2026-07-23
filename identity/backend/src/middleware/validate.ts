import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import {
  verifyAccessToken,
  type PlatformRole,
} from '../services/token.service.js'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    platformRole?: PlatformRole
    companyId?: string | null
  }
}

export function validateBody<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: result.error.flatten(),
      })
      return
    }
    req.body = result.data
    next()
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid authorization header', code: 'UNAUTHORIZED' })
    return
  }

  const token = header.slice(7)
  try {
    const payload = verifyAccessToken(token)
    req.user = {
      id: payload.sub,
      email: payload.email,
      platformRole: payload.platform_role,
      companyId: payload.company_id ?? null,
    }
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token', code: 'UNAUTHORIZED' })
  }
}
