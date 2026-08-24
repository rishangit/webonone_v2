import { Router } from 'express'
import * as companyStaffController from '../controllers/companyStaff.controller.js'
import * as companyStaffLeaveController from '../controllers/companyStaffLeave.controller.js'
import { requireCompanyAdminSession } from '../middleware/requireCompanyAdminSession.js'
import { requireCompanySession } from '../middleware/requireCompanySession.js'
import { validateBody } from '../middleware/validateBody.js'
import { createCompanyStaffLeaveBodySchema } from '../schemas/companyStaffLeaveSchemas.js'
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
router.get(
  '/company/staff/:id/leaves',
  requireCompanySession,
  companyStaffLeaveController.listStaffLeaves,
)
router.post(
  '/company/staff/:id/leaves',
  requireCompanySession,
  validateBody(createCompanyStaffLeaveBodySchema),
  companyStaffLeaveController.createStaffLeave,
)
router.post(
  '/company/staff/:id/leaves/:leaveId/approve',
  requireCompanyAdminSession,
  companyStaffLeaveController.approveStaffLeave,
)
router.post(
  '/company/staff/:id/leaves/:leaveId/reject',
  requireCompanyAdminSession,
  companyStaffLeaveController.rejectStaffLeave,
)
router.delete(
  '/company/staff/:id/leaves/:leaveId',
  requireCompanySession,
  companyStaffLeaveController.deleteStaffLeave,
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
