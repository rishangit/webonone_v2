import { Router } from 'express'
import * as companyStaffController from '../controllers/companyStaff.controller.js'
import { requireCompanyAdminSession } from '../middleware/requireCompanyAdminSession.js'
import { requireCompanySession } from '../middleware/requireCompanySession.js'
import { validateBody } from '../middleware/validateBody.js'
import {
  createCompanyStaffBodySchema,
  updateCompanyStaffBodySchema,
} from '../schemas/companyStaffSchemas.js'

const router = Router()

router.get('/company/staff', requireCompanySession, companyStaffController.listStaff)
router.post(
  '/company/staff',
  requireCompanyAdminSession,
  validateBody(createCompanyStaffBodySchema),
  companyStaffController.createStaff,
)
router.get('/company/staff/:id', requireCompanySession, companyStaffController.getStaff)
router.patch(
  '/company/staff/:id',
  requireCompanyAdminSession,
  validateBody(updateCompanyStaffBodySchema),
  companyStaffController.updateStaff,
)
router.delete('/company/staff/:id', requireCompanyAdminSession, companyStaffController.deleteStaff)

export default router
