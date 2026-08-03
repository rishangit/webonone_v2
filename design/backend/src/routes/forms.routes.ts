import { Router } from 'express'
import * as formsController from '../controllers/forms.controller.js'
import { requireAuth, requireCompanyContext, requireRole } from '../middleware/auth.js'

const router = Router()

const companyRoles = ['super_admin', 'company_admin', 'member'] as const
const manageRoles = ['super_admin', 'company_admin'] as const

router.get(
  '/forms',
  requireAuth,
  requireCompanyContext,
  requireRole(...companyRoles),
  formsController.listFormsHandler,
)
router.get(
  '/forms/:id',
  requireAuth,
  requireCompanyContext,
  requireRole(...companyRoles),
  formsController.getFormHandler,
)
router.post(
  '/forms',
  requireAuth,
  requireCompanyContext,
  requireRole(...manageRoles),
  formsController.createFormHandler,
)
router.patch(
  '/forms/:id',
  requireAuth,
  requireCompanyContext,
  requireRole(...manageRoles),
  formsController.updateFormHandler,
)
router.delete(
  '/forms/:id',
  requireAuth,
  requireCompanyContext,
  requireRole(...manageRoles),
  formsController.deleteFormHandler,
)

export default router
