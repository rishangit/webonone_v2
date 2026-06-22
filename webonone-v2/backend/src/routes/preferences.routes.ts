import { Router } from 'express'
import * as preferencesController from '../controllers/preferences.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validateBody.js'
import { patchPreferencesBodySchema } from '../schemas/themeSchemas.js'

const router = Router()

router.get('/me/preferences', requireAuth, preferencesController.getPreferences)
router.patch(
  '/me/preferences',
  requireAuth,
  validateBody(patchPreferencesBodySchema),
  preferencesController.patchPreferences,
)

export default router
