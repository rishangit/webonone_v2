import { Router } from 'express'
import * as queueController from '../controllers/queue.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/queue', requireAuth, requireRole('super_admin', 'company_admin'), queueController.getQueue)
router.post('/queue/:id/retry', requireAuth, requireRole('super_admin'), queueController.retryQueue)

export default router
