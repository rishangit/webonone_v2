import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { Request } from 'express'
import * as notificationService from '../services/notification.service.js'
import {
  createNotificationBodySchema,
  createNotificationsBatchBodySchema,
} from '../schemas/notificationSchemas.js'

export async function listMyNotifications(req: AuthenticatedRequest, res: Response) {
  const limit = Number(req.query.limit ?? 20)
  const before = typeof req.query.before === 'string' ? req.query.before : undefined
  const result = await notificationService.listNotifications(req.user!.id, { limit, before })
  res.json(result)
}

export async function getMyUnreadCount(req: AuthenticatedRequest, res: Response) {
  const result = await notificationService.getUnreadCount(req.user!.id)
  res.json(result)
}

export async function markMyNotificationRead(req: AuthenticatedRequest, res: Response) {
  const id = String(req.params.id)
  const updated = await notificationService.markNotificationRead(req.user!.id, id)
  if (!updated) {
    res.status(404).json({ message: 'Notification not found', code: 'NOT_FOUND' })
    return
  }
  res.json(updated)
}

export async function markAllMyNotificationsRead(req: AuthenticatedRequest, res: Response) {
  const result = await notificationService.markAllNotificationsRead(req.user!.id)
  res.json(result)
}

export async function createInternalNotification(req: Request, res: Response) {
  const batch = createNotificationsBatchBodySchema.safeParse(req.body)
  if (batch.success) {
    const created = []
    for (const item of batch.data.items) {
      const row = await notificationService.createNotificationFromBody(item)
      if (row) created.push(row)
    }
    res.status(201).json({ items: created, created: created.length })
    return
  }

  const single = createNotificationBodySchema.safeParse(req.body)
  if (!single.success) {
    res.status(400).json({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: single.error.flatten(),
    })
    return
  }

  const row = await notificationService.createNotificationFromBody(single.data)
  res.status(201).json({ item: row, created: row ? 1 : 0 })
}
