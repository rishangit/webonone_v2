import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'

export function health(_req: AuthenticatedRequest, res: Response) {
  res.json({ status: 'ok', service: 'webonone-v2' })
}

export function me(req: AuthenticatedRequest, res: Response) {
  res.json({
    user: {
      id: req.user!.id,
      email: req.user!.email,
    },
  })
}
