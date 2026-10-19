import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { ApplyDesignCanvasBody } from '../schemas/websiteCanvas.schema.js'

/** Validates a designer canvas change. The open designer applies it locally; Save persists it. */
export function applyDesignCanvasHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = req.body as ApplyDesignCanvasBody
    res.json({ ok: true, name: body.name, operations: body.operations })
  } catch (err) {
    next(err)
  }
}
