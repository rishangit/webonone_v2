import { Router } from 'express'
import * as dashboardController from '../controllers/dashboard.controller.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/dashboard/stats', requireAuth, dashboardController.getDashboardStatsHandler)

export default router
