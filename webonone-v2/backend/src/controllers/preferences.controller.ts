import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import * as preferenceService from '../services/preferenceService.js'

export async function getPreferences(req: AuthenticatedRequest, res: Response) {
  const preferences = await preferenceService.getPreferences(req.user!.id)
  res.json(preferences)
}

export async function patchPreferences(req: AuthenticatedRequest, res: Response) {
  const result = await preferenceService.patchPreferences(req.user!.id, req.body)
  if (!result.ok) {
    res.status(400).json({ message: 'Active theme not found', code: 'INVALID_THEME' })
    return
  }
  res.json(result.preferences)
}
