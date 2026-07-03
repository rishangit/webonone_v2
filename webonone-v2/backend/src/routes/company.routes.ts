import { Router } from 'express'
import * as companyController from '../controllers/company.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { requireSuperAdmin } from '../middleware/requireSuperAdmin.js'
import { validateBody } from '../middleware/validateBody.js'
import {
  registerCompanyBodySchema,
  syncEmailRoleBodySchema,
  syncDataRoleBodySchema,
  updateCompanyStatusBodySchema,
} from '../schemas/companySchemas.js'

const router = Router()

router.get('/company/me', requireAuth, companyController.getMyCompany)
router.get('/company/me/assumable-roles', requireAuth, companyController.getAssumableRoles)
router.post(
  '/company/me/sync-email-role',
  requireAuth,
  validateBody(syncEmailRoleBodySchema),
  companyController.syncEmailRole,
)
router.post(
  '/company/me/sync-data-role',
  requireAuth,
  validateBody(syncDataRoleBodySchema),
  companyController.syncDataRole,
)
router.post('/company/register', requireAuth, validateBody(registerCompanyBodySchema), companyController.registerCompany)
router.get('/company/admin/me', requireAuth, companyController.getSuperAdminMe)
router.get('/company/admin/companies', requireSuperAdmin, companyController.listAllCompanies)
router.get('/company/admin/pending', requireSuperAdmin, companyController.listPendingCompanies)
router.patch(
  '/company/admin/:id/status',
  requireSuperAdmin,
  validateBody(updateCompanyStatusBodySchema),
  companyController.updateCompanyStatus,
)
router.post('/company/admin/:id/approve', requireSuperAdmin, companyController.approveCompany)

export default router
