import { Router } from 'express'
import * as internalController from '../controllers/internal.controller.js'
import { requireInternalAuth } from '../middleware/internalAuth.js'
import { validateBody } from '../middleware/validateBody.js'
import { internalSendBodySchema, syncUserRoleBodySchema } from '../schemas/internal.schema.js'

const router = Router()

router.post('/internal/send', requireInternalAuth, validateBody(internalSendBodySchema), internalController.internalSend)
router.post(
  '/internal/sync-user-role',
  requireInternalAuth,
  validateBody(syncUserRoleBodySchema),
  internalController.internalSyncUserRole,
)

export default router
