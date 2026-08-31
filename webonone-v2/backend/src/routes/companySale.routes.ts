import { Router } from 'express'
import * as companySaleController from '../controllers/companySale.controller.js'
import { requireCompanyAdminSession } from '../middleware/requireCompanyAdminSession.js'
import {
  requireCompanySession,
  requireCompanySessionOrSuperAdmin,
} from '../middleware/requireCompanySession.js'
import { validateBody } from '../middleware/validateBody.js'
import { createSaleBodySchema, completeSaleBodySchema, upsertDraftSaleBodySchema } from '../schemas/companySaleSchemas.js'

const router = Router()

router.get('/company/me/sales', requireCompanySession, companySaleController.listSales)
router.get(
  '/company/me/session-tokens/:tokenId/sale-draft',
  requireCompanySession,
  companySaleController.getSessionTokenSaleDraft,
)
router.get(
  '/company/me/session-tokens/:tokenId/sale-bill',
  requireCompanySession,
  companySaleController.getSessionTokenBill,
)
router.put(
  '/company/me/session-tokens/:tokenId/sale-draft',
  requireCompanySession,
  validateBody(upsertDraftSaleBodySchema),
  companySaleController.upsertSessionTokenSaleDraft,
)
router.post(
  '/company/me/sales',
  requireCompanySession,
  validateBody(createSaleBodySchema),
  companySaleController.createSale,
)
router.post(
  '/company/me/sales/:id/complete',
  requireCompanySession,
  validateBody(completeSaleBodySchema),
  companySaleController.completeSale,
)
router.post(
  '/company/me/sales/:id/void',
  requireCompanyAdminSession,
  companySaleController.voidSale,
)
router.get(
  '/company/me/sales/:id',
  requireCompanySessionOrSuperAdmin,
  companySaleController.getSale,
)

export default router
