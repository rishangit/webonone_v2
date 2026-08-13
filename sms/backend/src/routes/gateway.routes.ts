import { Router } from 'express'
import * as gatewayController from '../controllers/gateway.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validateBody } from '../middleware/validateBody.js'
import { testGatewayBodySchema, updateGatewayBodySchema } from '../schemas/gateway.schema.js'

const router = Router()

const adminRoles = ['super_admin', 'company_admin'] as const

router.get('/gateway', requireAuth, requireRole(...adminRoles), gatewayController.getGateway)

router.put(
  '/gateway',
  requireAuth,
  requireRole(...adminRoles),
  validateBody(updateGatewayBodySchema),
  gatewayController.updateGateway,
)

router.post(
  '/gateway/test',
  requireAuth,
  requireRole(...adminRoles),
  validateBody(testGatewayBodySchema),
  gatewayController.testGateway,
)

export default router
