import { db } from '../models/db.js'

export interface NotificationRow {
  id: string
  user_id: string
  company_id: string | null
  type: string
  title: string
  body: string | null
  href: string | null
  source_service: string
  source_event_id: string | null
  read_at: Date | null
  created_at: Date
}

export type InsertNotificationRow = {
  id: string
  user_id: string
  company_id: string | null
  type: string
  title: string
  body: string | null
  href: string | null
  source_service: string
  source_event_id: string | null
}

export async function insertNotification(row: InsertNotificationRow): Promise<NotificationRow | null> {
  try {
    await db('notifications').insert({
      ...row,
      read_at: null,
      created_at: db.fn.now(3),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (/ER_DUP_ENTRY|Duplicate/i.test(message)) {
      return null
    }
    throw err
  }
  const created = await db<NotificationRow>('notifications').where({ id: row.id }).first()
  return created ?? null
}

export async function listNotificationsForUser(
  userId: string,
  options: { limit: number; before?: string },
): Promise<NotificationRow[]> {
  const query = db<NotificationRow>('notifications')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc')
    .orderBy('id', 'desc')
    .limit(options.limit)

  if (options.before) {
    const pivot = await db<NotificationRow>('notifications')
      .where({ id: options.before, user_id: userId })
      .first()
    if (pivot) {
      query.andWhere((qb) => {
        qb.where('created_at', '<', pivot.created_at).orWhere((inner) => {
          inner.where('created_at', pivot.created_at).andWhere('id', '<', pivot.id)
        })
      })
    }
  }

  return query
}

export async function countUnreadForUser(userId: string): Promise<number> {
  const row = await db('notifications')
    .where({ user_id: userId })
    .whereNull('read_at')
    .count<{ total: number | string }>('id as total')
    .first()
  return Number(row?.total ?? 0)
}

export async function findNotificationForUser(
  userId: string,
  id: string,
): Promise<NotificationRow | undefined> {
  return db<NotificationRow>('notifications').where({ id, user_id: userId }).first()
}

export async function markRead(userId: string, id: string): Promise<NotificationRow | undefined> {
  await db('notifications')
    .where({ id, user_id: userId })
    .whereNull('read_at')
    .update({ read_at: db.fn.now(3) })
  return findNotificationForUser(userId, id)
}

export async function markAllRead(userId: string): Promise<number> {
  return db('notifications')
    .where({ user_id: userId })
    .whereNull('read_at')
    .update({ read_at: db.fn.now(3) })
}

export async function findLatestUnread(userId: string): Promise<NotificationRow | undefined> {
  return db<NotificationRow>('notifications')
    .where({ user_id: userId })
    .whereNull('read_at')
    .orderBy('created_at', 'desc')
    .first()
}
