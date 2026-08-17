import { nanoid } from 'nanoid'
import type { PatchPlatformAiSettingsBody, PatchUserAiSettingsBody } from '../schemas/aiSettings.schema.js'
import { db, type AiProviderSettingsRow } from '../models/db.js'
import { decryptCredential, encryptCredential } from '../utils/credentialCrypto.js'
import {
  createAiProvider,
  envProviderConfig,
} from '../ai/providers/createAiProvider.js'
import {
  apiKeyHintFromSecret,
  isProviderConfigComplete,
  type AiProviderConfig,
} from '../ai/providers/providerConfig.js'
import type { AiProvider } from '../ai/providers/types.js'
import type { AiRequestContext } from '../ai/requestContext.js'
import { DEFAULT_SYSTEM_PROMPT, env } from '../config/env.js'
import { HttpError } from './httpError.js'

export type AiSettingsDto = {
  configured: boolean
  provider: AiProviderSettingsRow['provider']
  model: string
  baseUrl: string
  timeoutMs: number
  hasApiKey: boolean
  apiKeyHint: string | null
  apiKey: string | null
  extraSystemPrompt?: string | null
}

export type ResolvedProvider = {
  provider: AiProvider
  systemPrompt: string
}

const OLLAMA_CLOUD_DEFAULTS = {
  provider: 'ollama' as const,
  model: 'gpt-oss:120b',
  baseUrl: 'https://ollama.com',
  timeoutMs: 180_000,
}

function rowToConfig(row: AiProviderSettingsRow): AiProviderConfig {
  let apiKey = ''
  if (row.api_key_cipher) {
    apiKey = decryptCredential(row.api_key_cipher)
  }
  return {
    aiProvider: row.provider,
    aiModel: row.model,
    aiProviderBaseUrl: row.base_url.replace(/\/$/, ''),
    aiProviderApiKey: apiKey,
    aiProviderTimeoutMs: row.timeout_ms,
  }
}

function toDto(row: AiProviderSettingsRow | null, defaults?: Partial<AiSettingsDto>): AiSettingsDto {
  if (!row) {
    const envConfig = envProviderConfig()
    return {
      configured: isProviderConfigComplete(envConfig),
      provider: defaults?.provider ?? envConfig.aiProvider,
      model: defaults?.model ?? envConfig.aiModel,
      baseUrl: defaults?.baseUrl ?? envConfig.aiProviderBaseUrl,
      timeoutMs: defaults?.timeoutMs ?? envConfig.aiProviderTimeoutMs,
      hasApiKey: Boolean(envConfig.aiProviderApiKey.trim()),
      apiKeyHint: apiKeyHintFromSecret(envConfig.aiProviderApiKey),
      apiKey: envConfig.aiProviderApiKey.trim() || null,
      extraSystemPrompt: defaults?.extraSystemPrompt ?? null,
    }
  }
  const config = rowToConfig(row)
  return {
    configured: isProviderConfigComplete(config),
    provider: row.provider,
    model: row.model,
    baseUrl: row.base_url.replace(/\/$/, ''),
    timeoutMs: row.timeout_ms,
    hasApiKey: Boolean(row.api_key_cipher),
    apiKeyHint: apiKeyHintFromSecret(config.aiProviderApiKey),
    apiKey: config.aiProviderApiKey.trim() || null,
    extraSystemPrompt: row.extra_system_prompt,
  }
}

function userDefaultsDto(): AiSettingsDto {
  return {
    configured: false,
    ...OLLAMA_CLOUD_DEFAULTS,
    hasApiKey: false,
    apiKeyHint: null,
    apiKey: null,
  }
}

export function createAiSettingsService() {
  const findUserRow = (userId: string) =>
    db<AiProviderSettingsRow>('ai_provider_settings').where({ scope: 'user', user_id: userId }).first()

  const findPlatformRow = () =>
    db<AiProviderSettingsRow>('ai_provider_settings').where({ scope: 'platform' }).first()

  const upsertRow = async (
    scope: 'user' | 'platform',
    userId: string | null,
    body: PatchUserAiSettingsBody | PatchPlatformAiSettingsBody,
    existing: AiProviderSettingsRow | null,
  ) => {
    const now = new Date()
    let apiKeyCipher = existing?.api_key_cipher ?? null
    const apiKey = body.apiKey?.trim()
    if (apiKey) {
      apiKeyCipher = encryptCredential(apiKey)
    } else if (!existing) {
      apiKeyCipher = null
    }

    const extraSystemPrompt =
      'extraSystemPrompt' in body ? (body.extraSystemPrompt?.trim() || null) : (existing?.extra_system_prompt ?? null)

    const payload = {
      scope,
      user_id: userId,
      provider: body.provider,
      model: body.model.trim(),
      base_url: body.baseUrl.replace(/\/$/, ''),
      api_key_cipher: apiKeyCipher,
      timeout_ms: body.timeoutMs,
      extra_system_prompt: extraSystemPrompt,
      updated_at: now,
    }

    if (existing) {
      await db('ai_provider_settings').where({ id: existing.id }).update(payload)
      return { ...(await db<AiProviderSettingsRow>('ai_provider_settings').where({ id: existing.id }).first())! }
    }

    const id = nanoid()
    await db('ai_provider_settings').insert({
      id,
      ...payload,
      created_at: now,
    })
    return (await db<AiProviderSettingsRow>('ai_provider_settings').where({ id }).first())!
  }

  return {
    async getUserSettings(userId: string): Promise<AiSettingsDto> {
      const row = await findUserRow(userId)
      return row ? toDto(row) : userDefaultsDto()
    },

    async patchUserSettings(userId: string, body: PatchUserAiSettingsBody): Promise<AiSettingsDto> {
      const existing = await findUserRow(userId)
      if (!existing && !body.apiKey?.trim()) {
        throw new HttpError(400, 'API key is required for first-time setup', 'VALIDATION_ERROR')
      }
      const row = await upsertRow('user', userId, body, existing ?? null)
      return toDto(row)
    },

    async getPlatformSettings(): Promise<AiSettingsDto> {
      const row = await findPlatformRow()
      return toDto(row ?? null)
    },

    async patchPlatformSettings(body: PatchPlatformAiSettingsBody): Promise<AiSettingsDto> {
      const existing = await findPlatformRow()
      const row = await upsertRow('platform', null, body, existing ?? null)
      return toDto(row)
    },

    async resolveProvider(ctx: AiRequestContext): Promise<ResolvedProvider> {
      const basePrompt = env.aiSystemPrompt || DEFAULT_SYSTEM_PROMPT

      if (ctx.role === 'guest') {
        const platformRow = await findPlatformRow()
        const config = platformRow ? rowToConfig(platformRow) : envProviderConfig()
        if (!isProviderConfigComplete(config)) {
          throw new HttpError(
            503,
            'Guest AI provider is not configured. A super admin must set up the website assistant.',
            'PROVIDER_NOT_CONFIGURED',
          )
        }
        let systemPrompt = basePrompt
        const extra = platformRow?.extra_system_prompt?.trim()
        if (extra) {
          systemPrompt = `${basePrompt}\n\n${extra}`
        }
        return { provider: createAiProvider(config), systemPrompt }
      }

      if (!ctx.userId) {
        throw new HttpError(401, 'Identity session required', 'UNAUTHORIZED')
      }

      const userRow = await findUserRow(ctx.userId)
      if (!userRow) {
        throw new HttpError(
          409,
          'AI provider is not configured. Set up your Ollama Cloud account in Basic Settings.',
          'PROVIDER_NOT_CONFIGURED',
        )
      }

      const config = rowToConfig(userRow)
      if (!isProviderConfigComplete(config)) {
        throw new HttpError(
          409,
          'AI provider is not configured. Set up your Ollama Cloud account in Basic Settings.',
          'PROVIDER_NOT_CONFIGURED',
        )
      }

      return { provider: createAiProvider(config), systemPrompt: basePrompt }
    },
  }
}

export type AiSettingsService = ReturnType<typeof createAiSettingsService>
