import type { NextFunction, Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { AiSettingsService } from '../services/aiSettings.service.js'

export function createAiSettingsControllers(service: AiSettingsService) {
  return {
    getMine: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const settings = await service.getUserSettings(req.user!.id!)
        res.json(settings)
      } catch (err) {
        next(err)
      }
    },

    patchMine: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const settings = await service.patchUserSettings(req.user!.id!, req.body)
        res.json(settings)
      } catch (err) {
        next(err)
      }
    },

    getPlatform: async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const settings = await service.getPlatformSettings()
        res.json(settings)
      } catch (err) {
        next(err)
      }
    },

    patchPlatform: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const settings = await service.patchPlatformSettings(req.body)
        res.json(settings)
      } catch (err) {
        next(err)
      }
    },
  }
}
