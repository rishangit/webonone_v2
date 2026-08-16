import { Router } from 'express'
import type { ConversationService } from '../services/conversation.service.js'
import { createConversationControllers } from '../controllers/conversations.controller.js'
import { requireAuthOrGuest } from '../middleware/auth.js'
import { clientIp, type RateLimiter } from '../middleware/rateLimit.js'
import { HttpError } from '../services/httpError.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { NextFunction, Response } from 'express'

export function createConversationRoutes(service: ConversationService, rateLimiter: RateLimiter) {
  const router = Router()
  const controllers = createConversationControllers(service)

  const guestSendLimit = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (req.user?.role !== 'guest') {
      next()
      return
    }
    if (!rateLimiter.allow(`guest-send:${clientIp(req)}`)) {
      next(new HttpError(429, 'Too many requests', 'RATE_LIMITED'))
      return
    }
    next()
  }

  router.get('/conversations', requireAuthOrGuest, controllers.list)
  router.post('/conversations', requireAuthOrGuest, controllers.create)
  router.get('/conversations/:id', requireAuthOrGuest, controllers.get)
  router.get('/conversations/:id/messages', requireAuthOrGuest, controllers.listMessages)
  router.post('/conversations/:id/messages', requireAuthOrGuest, guestSendLimit, controllers.sendMessage)
  router.post(
    '/conversations/:id/tool-calls/:toolCallId/confirm',
    requireAuthOrGuest,
    guestSendLimit,
    controllers.confirmToolCall,
  )
  router.post(
    '/conversations/:id/tool-calls/:toolCallId/reject',
    requireAuthOrGuest,
    guestSendLimit,
    controllers.rejectToolCall,
  )

  return router
}
