import { Router } from 'express'
import * as healthController from '../controllers/health.controller.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/health', healthController.health)
router.get('/me', requireAuth, healthController.me)

export default router
