import crypto from 'crypto'
import { nanoid } from 'nanoid'
import { env } from '../config/env.js'
import { db } from '../models/db.js'
import type { DeviceScope, SmsDeviceRow } from '../models/db.js'
import { getGatewayMode, isTextLkReady } from './gatewayConfig.service.js'

export interface DeviceDto {
  id: string
  name: string
  ownerUserId: string
  scope: DeviceScope
  companyId: string | null
  status: 'pending' | 'approved' | 'revoked'
  simSlots: unknown[]
  appVersion: string | null
  lastSeenAt: string | null
  online: boolean
  createdAt: string
}

function hashKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex')
}

function parseSimSlots(row: SmsDeviceRow): unknown[] {
  if (!row.sim_slots) return []
  if (Array.isArray(row.sim_slots)) return row.sim_slots
  try {
    const parsed = JSON.parse(row.sim_slots) as unknown
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function deviceRowToDto(row: SmsDeviceRow): DeviceDto {
  const lastSeen = row.last_seen_at ? new Date(row.last_seen_at) : null
  const online = lastSeen ? Date.now() - lastSeen.getTime() < env.deviceStaleMs : false
  return {
    id: row.id,
    name: row.name,
    ownerUserId: row.owner_user_id,
    scope: row.scope,
    companyId: row.company_id,
    status: row.status,
    simSlots: parseSimSlots(row),
    appVersion: row.app_version,
    lastSeenAt: lastSeen?.toISOString() ?? null,
    online,
    createdAt: row.created_at.toISOString(),
  }
}

export async function findDeviceByKey(rawKey: string): Promise<SmsDeviceRow | null> {
  const row = await db<SmsDeviceRow>('sms_devices').where({ device_key_hash: hashKey(rawKey) }).first()
  return row ?? null
}

export async function registerDevice(input: {
  name: string
  ownerUserId: string
  scope: DeviceScope
  companyId: string | null
  simSlots?: unknown[]
  appVersion?: string
}): Promise<{ device: DeviceDto; deviceKey: string }> {
  const id = nanoid()
  const rawKey = `dvk_${nanoid(40)}`

  await db('sms_devices').insert({
    id,
    name: input.name || 'Gateway device',
    owner_user_id: input.ownerUserId,
    scope: input.scope,
    company_id: input.companyId,
    device_key_hash: hashKey(rawKey),
    status: 'pending',
    sim_slots: JSON.stringify(input.simSlots ?? []),
    app_version: input.appVersion ?? null,
    last_seen_at: db.fn.now(3),
    created_at: db.fn.now(3),
    updated_at: db.fn.now(3),
  })

  const row = await db<SmsDeviceRow>('sms_devices').where({ id }).first()
  return { device: deviceRowToDto(row!), deviceKey: rawKey }
}

export async function heartbeat(
  deviceId: string,
  input: { appVersion?: string; simSlots?: unknown[] },
): Promise<DeviceDto> {
  const patch: Record<string, unknown> = {
    last_seen_at: db.fn.now(3),
    updated_at: db.fn.now(3),
  }
  if (input.appVersion !== undefined) patch.app_version = input.appVersion
  if (input.simSlots !== undefined) patch.sim_slots = JSON.stringify(input.simSlots)

  await db('sms_devices').where({ id: deviceId }).update(patch)
  const row = await db<SmsDeviceRow>('sms_devices').where({ id: deviceId }).first()
  return deviceRowToDto(row!)
}

export async function listDevices(filters: { companyId?: string | null; role?: string }): Promise<DeviceDto[]> {
  const query = db<SmsDeviceRow>('sms_devices').orderBy('created_at', 'desc')
  if (filters.role === 'company_admin') {
    if (filters.companyId) query.where({ scope: 'company', company_id: filters.companyId })
    else query.whereRaw('1 = 0')
  }
  const rows = await query
  return rows.map(deviceRowToDto)
}

export async function getDeviceById(id: string): Promise<SmsDeviceRow | null> {
  const row = await db<SmsDeviceRow>('sms_devices').where({ id }).first()
  return row ?? null
}

export async function setDeviceStatus(id: string, status: 'approved' | 'revoked'): Promise<DeviceDto> {
  await db('sms_devices').where({ id }).update({ status, updated_at: db.fn.now(3) })
  const row = await db<SmsDeviceRow>('sms_devices').where({ id }).first()
  if (!row) throw new Error('Device not found')
  return deviceRowToDto(row)
}

/** True when the company has Text.lk configured or at least one approved gateway device. */
export async function getGatewayStatus(companyId: string): Promise<{
  configured: boolean
  mode: 'mobile_device' | 'text_lk' | 'none'
  activeDeviceCount: number
}> {
  const mode = await getGatewayMode('company', companyId)

  if (mode === 'text_lk') {
    const ready = await isTextLkReady('company', companyId)
    return {
      configured: ready,
      mode: ready ? 'text_lk' : 'none',
      activeDeviceCount: 0,
    }
  }

  const row = await db<SmsDeviceRow>('sms_devices')
    .where({
      scope: 'company',
      company_id: companyId,
      status: 'approved',
    })
    .count<{ count: number | string }>({ count: '*' })
    .first()

  const activeDeviceCount = Number(row?.count ?? 0)
  return {
    configured: activeDeviceCount > 0,
    mode: activeDeviceCount > 0 ? 'mobile_device' : 'none',
    activeDeviceCount,
  }
}
