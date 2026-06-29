import { Router } from 'express'
import * as brandingController from '../controllers/branding.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validateBody } from '../middleware/validateBody.js'
import { upsertBrandingBodySchema } from '../schemas/branding.schema.js'

const router = Router()

router.get(
  '/branding/:companyId',
  requireAuth,
  requireRole('super_admin', 'company_admin'),
  brandingController.getBrandingHandler,
)
router.put(
  '/branding/:companyId',
  requireAuth,
  requireRole('super_admin', 'company_admin'),
  validateBody(upsertBrandingBodySchema),
  brandingController.putBrandingHandler,
)

export default router
