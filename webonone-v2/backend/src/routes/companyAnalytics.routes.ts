import { Router } from 'express'
import * as companyAnalyticsController from '../controllers/companyAnalytics.controller.js'
import { requireCompanySession } from '../middleware/requireCompanySession.js'
import { requireSuperAdmin } from '../middleware/requireSuperAdmin.js'

const router = Router()

router.get(
  '/company/me/analytics',
  requireCompanySession,
  companyAnalyticsController.getCompanyAnalytics,
)
router.get(
  '/company/analytics/platform',
  requireSuperAdmin,
  companyAnalyticsController.getPlatformAnalytics,
)

export default router
