import { nanoid } from 'nanoid'
import * as notificationRepo from '../repositories/notification.repository.js'
import * as pushDeviceRepo from '../repositories/pushDevice.repository.js'
import type { CreateNotificationBody } from '../schemas/notificationSchemas.js'
import { sendPushForNotification } from './expoPush.service.js'

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
    if (!row) return null
    const dto = toDto(row)
    void sendPushForNotification({
      userId: dto.userId,
      id: dto.id,
      title: dto.title,
      body: dto.body,
      href: dto.href,
    })
    return dto
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

export async function registerPushDevice(
  userId: string,
  input: { token: string; platform: 'android' | 'ios' },
): Promise<void> {
  const existing = await pushDeviceRepo.findPushDeviceByToken(input.token)
  if (existing) {
    await pushDeviceRepo.updatePushDeviceOwner(existing.id, {
      user_id: userId,
      platform: input.platform,
    })
    return
  }
  await pushDeviceRepo.insertPushDevice({
    id: nanoid(),
    user_id: userId,
    expo_push_token: input.token,
    platform: input.platform,
  })
}

export async function unregisterPushDevice(userId: string, token: string): Promise<void> {
  await pushDeviceRepo.deletePushDeviceForUser(userId, token)
}

export type PushTargetStats = {
  deviceCount: number
  userCount: number
}

export async function getPushTargetStats(): Promise<PushTargetStats> {
  const [deviceCount, userIds] = await Promise.all([
    pushDeviceRepo.countPushDevices(),
    pushDeviceRepo.listDistinctUserIdsWithPushDevices(),
  ])
  return { deviceCount, userCount: userIds.length }
}

export type AdminBroadcastPushInput = {
  title: string
  body?: string | null
  href?: string | null
}

export type AdminBroadcastPushResult = {
  broadcastId: string
  deviceCount: number
  userCount: number
  notificationsCreated: number
}

/** Super-admin broadcast: in-app notification + Expo push per user with a registered device. */
export async function broadcastPushToAllDevices(
  input: AdminBroadcastPushInput,
): Promise<AdminBroadcastPushResult> {
  const broadcastId = nanoid()
  const [deviceCount, userIds] = await Promise.all([
    pushDeviceRepo.countPushDevices(),
    pushDeviceRepo.listDistinctUserIdsWithPushDevices(),
  ])

  if (userIds.length === 0) {
    return {
      broadcastId,
      deviceCount: 0,
      userCount: 0,
      notificationsCreated: 0,
    }
  }

  const results = await Promise.all(
    userIds.map((userId) =>
      createNotification({
        userId,
        companyId: null,
        type: 'admin.broadcast',
        title: input.title,
        body: input.body ?? null,
        href: input.href ?? null,
        sourceService: 'webonone',
        sourceEventId: `admin.broadcast:${broadcastId}:${userId}`,
      }),
    ),
  )

  const notificationsCreated = results.filter(Boolean).length

  return {
    broadcastId,
    deviceCount,
    userCount: userIds.length,
    notificationsCreated,
  }
}
