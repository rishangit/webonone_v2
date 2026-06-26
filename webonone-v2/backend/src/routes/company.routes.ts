import { Router } from 'express'
import * as companyController from '../controllers/company.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validateBody.js'
import {
  registerCompanyBodySchema,
  superAdminLoginBodySchema,
} from '../schemas/companySchemas.js'

const router = Router()

router.get('/company/me', requireAuth, companyController.getMyCompany)
router.post('/company/register', requireAuth, validateBody(registerCompanyBodySchema), companyController.registerCompany)
router.post('/company/super-admin/login', validateBody(superAdminLoginBodySchema), companyController.superAdminLogin)
router.get('/company/admin/pending', companyController.listPendingCompanies)
router.post('/company/admin/:id/approve', companyController.approveCompany)

export default router
