import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'

export function health(_req: AuthenticatedRequest, res: Response) {
  res.json({ status: 'ok', service: 'media' })
}
