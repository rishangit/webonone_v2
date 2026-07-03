import { Router } from 'express'
import * as internalController from '../controllers/internal.controller.js'
import { requireInternalAuth } from '../middleware/internalAuth.js'
import { validateBody } from '../middleware/validateBody.js'
import { syncUserRoleBodySchema } from '../schemas/internal.schema.js'

const router = Router()

router.post(
  '/internal/sync-user-role',
  requireInternalAuth,
  validateBody(syncUserRoleBodySchema),
  internalController.internalSyncUserRole,
)

export default router
