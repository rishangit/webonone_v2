import { Router } from 'express'
import * as historyController from '../controllers/history.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/history', requireAuth, requireRole('super_admin', 'company_admin'), historyController.getHistory)

export default router
