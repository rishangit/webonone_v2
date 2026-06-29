import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { queueQuerySchema } from '../schemas/queue.schema.js'
import { logAudit } from '../services/audit.service.js'
import { listQueue, retryQueueItem } from '../services/queue.service.js'

export async function getQueue(req: AuthenticatedRequest, res: Response) {
  const parsed = queueQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() })
    return
  }

  const companyId =
    req.user?.role === 'company_admin' ? (req.user.companyId ?? undefined) : parsed.data.companyId

  const result = await listQueue({ ...parsed.data, companyId })
  res.json(result)
}

export async function retryQueue(req: AuthenticatedRequest, res: Response) {
  if (req.user?.role !== 'super_admin') {
    res.status(403).json({ message: 'Forbidden', code: 'FORBIDDEN' })
    return
  }

  try {
    const item = await retryQueueItem(String(req.params.id))
    await logAudit({
      userId: req.user.id,
      action: 'queue_retry',
      entityType: 'email_queue',
      entityId: item.id,
    })
    res.json(item)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Retry failed'
    res.status(400).json({ message, code: 'BAD_REQUEST' })
  }
}
