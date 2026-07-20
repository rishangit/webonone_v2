import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { getDashboardStats } from '../services/queue.service.js'

export async function getDashboardStatsHandler(req: AuthenticatedRequest, res: Response) {
  const companyId = req.user?.role === 'company_admin' ? (req.user.companyId ?? undefined) : undefined
  const stats = await getDashboardStats(companyId)
  res.json(stats)
}
