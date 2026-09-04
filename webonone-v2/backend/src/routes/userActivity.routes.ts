import { Router } from 'express'
import * as internalCompanyController from '../controllers/internalCompany.controller.js'
import * as internalStaffController from '../controllers/internalStaff.controller.js'
import * as userActivityController from '../controllers/userActivity.controller.js'
import { requireInternalAuth } from '../middleware/internalAuth.js'
import { requireCompanySessionOrSuperAdmin } from '../middleware/requireCompanySession.js'

const router = Router()

router.get(
  '/internal/companies/by-slug/:slug',
  requireInternalAuth,
  internalCompanyController.getCompanyBySlugInternal,
)

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
  requireCompanySessionOrSuperAdmin,
  userActivityController.listUserActivity,
)

router.get(
  '/company/me/session-tokens/:tokenId',
  requireCompanySessionOrSuperAdmin,
  userActivityController.getSessionTokenDetail,
)

export default router
