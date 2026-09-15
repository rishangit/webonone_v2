import { Router } from 'express'
import type { NextFunction, Response } from 'express'
import { requireAuthOrGuest, requireIdentityUser, type AuthenticatedRequest } from '../middleware/auth.js'
import { clientIp, type RateLimiter } from '../middleware/rateLimit.js'
import { validateBody } from '../middleware/validateBody.js'
import { polishTextSchema } from '../schemas/textPolish.schema.js'
import { HttpError } from '../services/httpError.js'
import { createTextPolishControllers } from '../controllers/textPolish.controller.js'
import type { TextPolishService } from '../services/textPolish.service.js'

export function createTextPolishRoutes(service: TextPolishService, rateLimiter: RateLimiter) {
  const router = Router()
  const controllers = createTextPolishControllers(service)

  const polishLimit = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const key = req.user?.id ? `polish:${req.user.id}` : `polish-ip:${clientIp(req)}`
    if (!rateLimiter.allow(key)) {
      next(new HttpError(429, 'Too many requests', 'RATE_LIMITED'))
      return
    }
    next()
  }

  router.post(
    '/text/polish',
    requireAuthOrGuest,
    requireIdentityUser,
    polishLimit,
    validateBody(polishTextSchema),
    controllers.polish,
  )

  return router
}
