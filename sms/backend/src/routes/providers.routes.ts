import { Router } from 'express'
import * as providerBalanceController from '../controllers/providerBalance.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

const adminRoles = ['super_admin', 'company_admin'] as const

router.get(
  '/providers/textlk/balance',
  requireAuth,
  requireRole(...adminRoles),
  providerBalanceController.getTextLkBalance,
)

export default router
