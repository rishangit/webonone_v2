import { Router } from 'express'
import * as companySaleController from '../controllers/companySale.controller.js'
import { requireCompanyAdminSession } from '../middleware/requireCompanyAdminSession.js'
import { requireCompanySession } from '../middleware/requireCompanySession.js'
import { validateBody } from '../middleware/validateBody.js'
import { createSaleBodySchema } from '../schemas/companySaleSchemas.js'

const router = Router()

router.get('/company/me/sales', requireCompanySession, companySaleController.listSales)
router.post(
  '/company/me/sales',
  requireCompanyAdminSession,
  validateBody(createSaleBodySchema),
  companySaleController.createSale,
)
router.post(
  '/company/me/sales/:id/void',
  requireCompanyAdminSession,
  companySaleController.voidSale,
)
router.get('/company/me/sales/:id', requireCompanySession, companySaleController.getSale)

export default router
