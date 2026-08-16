import { Router } from 'express'
import * as healthController from '../controllers/health.controller.js'
import { requireAuthOrGuest } from '../middleware/auth.js'
import type { RateLimiter } from '../middleware/rateLimit.js'

export function createHealthRoutes(rateLimiter: RateLimiter) {
  const router = Router()
  router.get('/health', healthController.health)
  router.post('/guest-sessions', healthController.createGuestSessionHandler(rateLimiter))
  router.get('/me', requireAuthOrGuest, healthController.me)
  return router
}
