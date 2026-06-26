import { Router } from 'express'
import * as companyController from '../controllers/company.controller.js'
import { requireIdentityJwt } from '../middleware/requireIdentityJwt.js'
import { requireSuperAdmin } from '../middleware/requireSuperAdmin.js'
import { validateBody } from '../middleware/validateBody.js'
import {
  registerCompanyBodySchema,
  superAdminLoginBodySchema,
} from '../schemas/companySchemas.js'

const router = Router()

router.get('/health', companyController.health)
router.post('/auth/super-admin/login', validateBody(superAdminLoginBodySchema), companyController.superAdminLogin)
router.get('/me/company', requireIdentityJwt, companyController.getMyCompany)
router.post('/companies', requireIdentityJwt, validateBody(registerCompanyBodySchema), companyController.registerCompany)
router.get('/admin/companies/pending', requireSuperAdmin, companyController.listPendingCompanies)
router.post('/admin/companies/:id/approve', requireSuperAdmin, companyController.approveCompany)

export default router
