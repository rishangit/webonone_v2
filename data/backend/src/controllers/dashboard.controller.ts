import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { getDashboardStats } from '../services/dashboard.service.js'

export async function getDashboardStatsHandler(_req: AuthenticatedRequest, res: Response) {
  const stats = await getDashboardStats()
  res.json(stats)
}
