import { Router } from 'express'
import * as submissionsController from '../controllers/submissions.controller.js'
import { requireAuth, requireCompanyContext, requireRole } from '../middleware/auth.js'

const router = Router()

const companyRoles = ['super_admin', 'company_admin', 'member'] as const

router.get(
  '/submissions',
  requireAuth,
  requireRole(...companyRoles),
  submissionsController.listSubmissionsHandler,
)
router.get(
  '/submissions/:id',
  requireAuth,
  requireRole(...companyRoles),
  submissionsController.getSubmissionHandler,
)
router.post(
  '/submissions',
  requireAuth,
  requireCompanyContext,
  requireRole(...companyRoles),
  submissionsController.createSubmissionHandler,
)

export default router
