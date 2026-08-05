import { Router } from 'express'
import * as internalCompanyController from '../controllers/internalCompany.controller.js'
import * as internalStaffController from '../controllers/internalStaff.controller.js'
import * as userActivityController from '../controllers/userActivity.controller.js'
import { requireInternalAuth } from '../middleware/internalAuth.js'
import { requireCompanySession } from '../middleware/requireCompanySession.js'

const router = Router()

router.get(
  '/internal/companies/:id',
  requireInternalAuth,
  internalCompanyController.getCompanyInternal,
)

router.get(
  '/internal/company-staff/by-user/:userId',
  requireInternalAuth,
  internalStaffController.getStaffByUserInternal,
)

router.get(
  '/company/me/users/:userId/activity',
  requireCompanySession,
  userActivityController.listUserActivity,
)

router.get(
  '/company/me/session-tokens/:tokenId',
  requireCompanySession,
  userActivityController.getSessionTokenDetail,
)

export default router
