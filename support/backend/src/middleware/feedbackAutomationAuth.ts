import { timingSafeEqual } from 'node:crypto'
import type { NextFunction, Response } from 'express'
import { env } from '../config/env.js'
import { attachJwtUser, type AuthenticatedRequest } from './auth.js'

export const FEEDBACK_AUTOMATION_USER_ID = 'feedbackfixautobot01'
export const FEEDBACK_AUTOMATION_EMAIL = 'feedback-automation@webonone.local'

const AUTOMATION_HEADER = 'x-support-feedback-automation-key'

function secureKeyMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/** True when the request presents a valid automation key and `req.user` is set. */
export function attachFeedbackAutomationUser(req: AuthenticatedRequest): boolean {
  const configured = env.feedbackAutomationApiKey
  if (!configured) return false

  const headerKey = req.header(AUTOMATION_HEADER)?.trim()
  if (!headerKey || !secureKeyMatch(headerKey, configured)) {
    return false
  }

  req.user = {
    id: FEEDBACK_AUTOMATION_USER_ID,
    email: FEEDBACK_AUTOMATION_EMAIL,
    platformRole: 'super_admin',
    companyId: null,
  }
  return true
}

/**
 * JWT auth or automation key — only for feedback-fix tooling routes (list/get/status).
 * Does not enable automation on create, comments, or edit.
 */
export function requireFeedbackAutomationOrJwt(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (attachFeedbackAutomationUser(req)) {
    next()
    return
  }

  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid authorization', code: 'UNAUTHORIZED' })
    return
  }

  if (!attachJwtUser(req, header.slice(7))) {
    res.status(401).json({ message: 'Invalid or expired token', code: 'UNAUTHORIZED' })
    return
  }
  next()
}
