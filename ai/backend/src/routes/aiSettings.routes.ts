import { Router } from 'express'
import { createAiSettingsControllers } from '../controllers/aiSettings.controller.js'
import { requireAuthOrGuest, requireIdentityUser, type AuthenticatedRequest } from '../middleware/auth.js'
import { validateBody } from '../middleware/validateBody.js'
import {
  patchPlatformAiSettingsSchema,
  patchUserAiSettingsSchema,
} from '../schemas/aiSettings.schema.js'
import type { AiSettingsService } from '../services/aiSettings.service.js'
import type { NextFunction, Response } from 'express'

function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'super_admin') {
    res.status(403).json({ message: 'Super admin required', code: 'FORBIDDEN' })
    return
  }
  next()
}

export function createAiSettingsRoutes(service: AiSettingsService) {
  const router = Router()
  const controllers = createAiSettingsControllers(service)

  router.get('/me/ai-settings', requireAuthOrGuest, requireIdentityUser, controllers.getMine)
  router.patch(
    '/me/ai-settings',
    requireAuthOrGuest,
    requireIdentityUser,
    validateBody(patchUserAiSettingsSchema),
    controllers.patchMine,
  )

  router.get('/admin/ai-settings', requireAuthOrGuest, requireIdentityUser, requireSuperAdmin, controllers.getPlatform)
  router.patch(
    '/admin/ai-settings',
    requireAuthOrGuest,
    requireIdentityUser,
    requireSuperAdmin,
    validateBody(patchPlatformAiSettingsSchema),
    controllers.patchPlatform,
  )

  return router
}
