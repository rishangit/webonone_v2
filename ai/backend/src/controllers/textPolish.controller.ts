import type { NextFunction, Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { TextPolishService } from '../services/textPolish.service.js'
import { polishTextSchema } from '../schemas/textPolish.schema.js'

function contextOrThrow(req: AuthenticatedRequest) {
  if (!req.aiContext) {
    throw new Error('Missing AI request context')
  }
  return req.aiContext
}

export function createTextPolishControllers(service: TextPolishService) {
  return {
    polish: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const body = polishTextSchema.parse(req.body)
        const result = await service.polish(contextOrThrow(req), body)
        res.json({ text: result.text })
      } catch (err) {
        next(err)
      }
    },
  }
}
