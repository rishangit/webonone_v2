import { nanoid } from 'nanoid'
import { db } from '../models/db.js'
import type { DeviceScope, GatewayMode, SmsGatewayConfigRow } from '../models/db.js'
import { decryptCredential, encryptCredential } from '../utils/credentialCrypto.js'
import { ensureLocalCompany } from './user.service.js'

export interface GatewayConfigDto {
  mode: GatewayMode
  senderId: string | null
  hasApiToken: boolean
  configured: boolean
  updatedAt: string | null
}

export interface GatewayCredentials {
  senderId: string
  apiToken: string
}

function toDto(row: SmsGatewayConfigRow | null | undefined): GatewayConfigDto {
  if (!row) {
    return {
      mode: 'mobile_device',
      senderId: null,
      hasApiToken: false,
      configured: false,
      updatedAt: null,
    }
  }

  const hasApiToken = Boolean(row.api_token_enc)
  const configured =
    row.mode === 'mobile_device'
      ? false // mobile configured-ness is device-based; this DTO is for settings UI
      : Boolean(row.sender_id && hasApiToken)

  return {
    mode: row.mode,
    senderId: row.sender_id,
    hasApiToken,
    configured: row.mode === 'text_lk' ? configured : true,
    updatedAt: row.updated_at.toISOString(),
  }
}

async function findRow(
  scope: DeviceScope,
  companyId: string | null,
): Promise<SmsGatewayConfigRow | undefined> {
  const query = db<SmsGatewayConfigRow>('sms_gateway_config').where({ scope })
  if (scope === 'company' && companyId) {
    query.andWhere({ company_id: companyId })
  } else {
    query.whereNull('company_id')
  }
  return query.first()
}

/** Public config for admin UI — never includes the raw API token. */
export async function getGatewayConfig(
  scope: DeviceScope,
  companyId: string | null,
): Promise<GatewayConfigDto> {
  const row = await findRow(scope, companyId)
  return toDto(row)
}

/** Effective delivery mode for a queue scope (default mobile_device). */
export async function getGatewayMode(
  scope: DeviceScope,
  companyId: string | null,
): Promise<GatewayMode> {
  const row = await findRow(scope, companyId)
  return row?.mode ?? 'mobile_device'
}

/**
 * True when Text.lk is configured with sender + token, or when mode is mobile_device
 * (device readiness is checked separately via approved devices).
 */
export async function isTextLkReady(
  scope: DeviceScope,
  companyId: string | null,
): Promise<boolean> {
  const row = await findRow(scope, companyId)
  if (!row || row.mode !== 'text_lk') return false
  return Boolean(row.sender_id && row.api_token_enc)
}

/** Decrypt credentials for Text.lk send — throws if not ready. */
export async function getTextLkCredentials(
  scope: DeviceScope,
  companyId: string | null,
): Promise<GatewayCredentials> {
  const row = await findRow(scope, companyId)
  if (!row || row.mode !== 'text_lk' || !row.sender_id || !row.api_token_enc) {
    throw new Error('Text.lk gateway is not configured for this scope')
  }
  return {
    senderId: row.sender_id,
    apiToken: decryptCredential(row.api_token_enc),
  }
}

/** All Text.lk-ready scopes for the provider worker. */
export async function listTextLkScopes(): Promise<
  Array<{ scope: DeviceScope; companyId: string | null }>
> {
  const rows = await db<SmsGatewayConfigRow>('sms_gateway_config')
    .where({ mode: 'text_lk' })
    .whereNotNull('sender_id')
    .whereNotNull('api_token_enc')

  return rows.map((row) => ({
    scope: row.scope,
    companyId: row.company_id,
  }))
}

export async function upsertGatewayConfig(input: {
  scope: DeviceScope
  companyId: string | null
  mode: GatewayMode
  senderId?: string
  apiToken?: string
  updatedBy: string
}): Promise<GatewayConfigDto> {
  if (input.scope === 'company') {
    if (!input.companyId) {
      throw new Error('Company ID required for company gateway config')
    }
    await ensureLocalCompany({ companyId: input.companyId })
  }

  const existing = await findRow(input.scope, input.companyId)

  if (input.mode === 'text_lk') {
    const hasToken = Boolean(input.apiToken) || Boolean(existing?.api_token_enc)
    if (!input.senderId) {
      throw new Error('Sender ID is required for Text.lk')
    }
    if (!hasToken) {
      throw new Error('API token is required for Text.lk')
    }
  }

  const tokenEnc =
    input.apiToken !== undefined && input.apiToken.trim()
      ? encryptCredential(input.apiToken.trim())
      : (existing?.api_token_enc ?? null)

  if (existing) {
    await db('sms_gateway_config')
      .where({ id: existing.id })
      .update({
        mode: input.mode,
        sender_id: input.mode === 'text_lk' ? (input.senderId ?? existing.sender_id) : null,
        api_token_enc: input.mode === 'text_lk' ? tokenEnc : null,
        updated_by: input.updatedBy,
        updated_at: db.fn.now(3),
      })
  } else {
    await db('sms_gateway_config').insert({
      id: nanoid(),
      scope: input.scope,
      company_id: input.scope === 'company' ? input.companyId : null,
      mode: input.mode,
      sender_id: input.mode === 'text_lk' ? (input.senderId ?? null) : null,
      api_token_enc: input.mode === 'text_lk' ? tokenEnc : null,
      updated_by: input.updatedBy,
      updated_at: db.fn.now(3),
      created_at: db.fn.now(3),
    })
  }

  return getGatewayConfig(input.scope, input.companyId)
}
