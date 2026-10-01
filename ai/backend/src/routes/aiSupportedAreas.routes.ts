import { Router } from 'express'
import { filterToolsForContext } from '../ai/tools/filterTools.js'
import { summarizeToolAreas } from '../ai/tools/summarizeToolAreas.js'
import type { ToolRegistry } from '../ai/tools/registry.js'
import { requireAuthOrGuest, requireIdentityUser, type AuthenticatedRequest } from '../middleware/auth.js'
import type { Response, NextFunction } from 'express'

export function createAiSupportedAreasRoutes(registry: ToolRegistry) {
  const router = Router()

  router.get(
    '/me/ai-supported-areas',
    requireAuthOrGuest,
    requireIdentityUser,
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const ctx = req.aiContext
        if (!ctx) {
          res.status(401).json({ message: 'Missing AI context', code: 'UNAUTHORIZED' })
          return
        }
        const tools = filterToolsForContext(registry.list(), ctx)
        res.json({ areas: summarizeToolAreas(tools) })
      } catch (err) {
        next(err)
      }
    },
  )

  return router
}
