import { db } from '../models/db.js'

export interface PushDeviceRow {
  id: string
  user_id: string
  expo_push_token: string
  platform: string
  created_at: Date
  updated_at: Date
}

export async function findPushDeviceByToken(token: string): Promise<PushDeviceRow | undefined> {
  return db<PushDeviceRow>('push_devices').where({ expo_push_token: token }).first()
}

export async function insertPushDevice(row: {
  id: string
  user_id: string
  expo_push_token: string
  platform: string
}): Promise<void> {
  await db('push_devices').insert({
    ...row,
    created_at: db.fn.now(3),
    updated_at: db.fn.now(3),
  })
}

export async function updatePushDeviceOwner(
  id: string,
  input: { user_id: string; platform: string },
): Promise<void> {
  await db('push_devices').where({ id }).update({
    user_id: input.user_id,
    platform: input.platform,
    updated_at: db.fn.now(3),
  })
}

export async function listTokensForUser(userId: string): Promise<string[]> {
  const rows = await db<PushDeviceRow>('push_devices')
    .where({ user_id: userId })
    .select('expo_push_token')
  return rows.map((row) => row.expo_push_token)
}

export async function deletePushDeviceForUser(userId: string, token: string): Promise<number> {
  return db('push_devices').where({ user_id: userId, expo_push_token: token }).delete()
}

export async function deletePushDevicesByTokens(tokens: string[]): Promise<void> {
  if (tokens.length === 0) return
  await db('push_devices').whereIn('expo_push_token', tokens).delete()
}

export async function countPushDevices(): Promise<number> {
  const row = await db('push_devices').count({ count: '*' }).first()
  const count = row && typeof row === 'object' && 'count' in row ? row.count : 0
  return Number(count ?? 0)
}

export async function listDistinctUserIdsWithPushDevices(): Promise<string[]> {
  const rows = await db('push_devices').groupBy('user_id').select('user_id')
  return rows.map((row) => String(row.user_id)).filter(Boolean)
}
