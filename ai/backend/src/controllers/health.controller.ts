import type { NextFunction, Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { issueGuestSession } from '../services/guestSession.service.js'
import { clientIp, type RateLimiter } from '../middleware/rateLimit.js'
import { HttpError } from '../services/httpError.js'

export function health(_req: AuthenticatedRequest, res: Response) {
  res.json({ status: 'ok', service: 'ai' })
}

export function me(req: AuthenticatedRequest, res: Response) {
  const user = req.user!
  res.json({
    user: {
      id: user.id,
      guestId: user.guestId,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    },
  })
}

export function createGuestSessionHandler(rateLimiter: RateLimiter) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const key = `guest-session:${clientIp(req)}`
      if (!rateLimiter.allow(key)) {
        throw new HttpError(429, 'Too many guest sessions', 'RATE_LIMITED')
      }
      const session = issueGuestSession()
      console.error('[ai]', 'guest_session_issued')
      res.status(201).json({
        accessToken: session.accessToken,
        expiresIn: session.expiresIn,
      })
    } catch (err) {
      next(err)
    }
  }
}
