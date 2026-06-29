import { Router } from 'express'
import * as providersController from '../controllers/providers.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validateBody } from '../middleware/validateBody.js'
import { providerTestBodySchema } from '../schemas/providers.schema.js'

const router = Router()

router.get('/providers', requireAuth, requireRole('super_admin'), providersController.getProviders)
router.post(
  '/providers/test',
  requireAuth,
  requireRole('super_admin'),
  validateBody(providerTestBodySchema),
  providersController.testProvider,
)

export default router
