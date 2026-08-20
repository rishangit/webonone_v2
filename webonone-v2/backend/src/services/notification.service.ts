import { nanoid } from 'nanoid'
import * as notificationRepo from '../repositories/notification.repository.js'
import type { CreateNotificationBody } from '../schemas/notificationSchemas.js'

export type NotificationDto = {
  id: string
  userId: string
  companyId: string | null
  type: string
  title: string
  body: string | null
  href: string | null
  sourceService: string
  sourceEventId: string | null
  readAt: string | null
  createdAt: string
}

export type CreateNotificationInput = {
  userId: string
  companyId?: string | null
  type: string
  title: string
  body?: string | null
  href?: string | null
  sourceService: string
  sourceEventId?: string | null
}

function toDto(row: notificationRepo.NotificationRow): NotificationDto {
  return {
    id: row.id,
    userId: row.user_id,
    companyId: row.company_id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href,
    sourceService: row.source_service,
    sourceEventId: row.source_event_id,
    readAt: row.read_at ? row.read_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
  }
}

/** Soft-fail insert — never throws to callers. Returns null on duplicate or error. */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<NotificationDto | null> {
  try {
    const row = await notificationRepo.insertNotification({
      id: nanoid(),
      user_id: input.userId,
      company_id: input.companyId ?? null,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      href: input.href ?? null,
      source_service: input.sourceService,
      source_event_id: input.sourceEventId ?? null,
    })
    return row ? toDto(row) : null
  } catch (err) {
    console.error('[notifications] createNotification failed:', err)
    return null
  }
}

/** Fan-out to many users; dedupes ids; never throws. */
export async function createNotificationsForUsers(
  userIds: string[],
  payload: Omit<CreateNotificationInput, 'userId' | 'sourceEventId'> & {
    sourceEventIdPrefix: string
  },
): Promise<void> {
  const unique = [...new Set(userIds.filter(Boolean))]
  await Promise.all(
    unique.map((userId) =>
      createNotification({
        userId,
        companyId: payload.companyId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        href: payload.href,
        sourceService: payload.sourceService,
        sourceEventId: `${payload.sourceEventIdPrefix}:${userId}`,
      }),
    ),
  )
}

export async function createNotificationFromBody(
  body: CreateNotificationBody,
): Promise<NotificationDto | null> {
  return createNotification({
    userId: body.userId,
    companyId: body.companyId,
    type: body.type,
    title: body.title,
    body: body.body,
    href: body.href,
    sourceService: body.sourceService,
    sourceEventId: body.sourceEventId,
  })
}

export async function listNotifications(
  userId: string,
  options: { limit?: number; before?: string },
): Promise<{ items: NotificationDto[] }> {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 50)
  const rows = await notificationRepo.listNotificationsForUser(userId, {
    limit,
    before: options.before,
  })
  return { items: rows.map(toDto) }
}

export async function getUnreadCount(userId: string): Promise<{ count: number }> {
  const count = await notificationRepo.countUnreadForUser(userId)
  return { count }
}

export async function markNotificationRead(
  userId: string,
  id: string,
): Promise<NotificationDto | null> {
  const existing = await notificationRepo.findNotificationForUser(userId, id)
  if (!existing) return null
  const updated = await notificationRepo.markRead(userId, id)
  return updated ? toDto(updated) : toDto(existing)
}

export async function markAllNotificationsRead(userId: string): Promise<{ updated: number }> {
  const updated = await notificationRepo.markAllRead(userId)
  return { updated }
}

export async function getLatestUnreadTitle(userId: string): Promise<string | null> {
  const row = await notificationRepo.findLatestUnread(userId)
  return row?.title ?? null
}
