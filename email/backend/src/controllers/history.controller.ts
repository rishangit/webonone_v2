import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { historyQuerySchema } from '../schemas/history.schema.js'
import { listHistory } from '../services/queue.service.js'

export async function getHistory(req: AuthenticatedRequest, res: Response) {
  const parsed = historyQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() })
    return
  }

  const companyId =
    req.user?.role === 'company_admin' ? (req.user.companyId ?? undefined) : parsed.data.companyId

  const result = await listHistory({ ...parsed.data, companyId })
  res.json(result)
}
