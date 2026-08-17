import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { describe, it } from 'node:test'
import jwt from 'jsonwebtoken'
import type { AddressInfo } from 'node:net'
import { env } from './config/env.js'
import { createApp } from './app.js'
import { createConversationService } from './services/conversation.service.js'
import { createMemoryConversationRepository } from './services/conversation.repository.js'
import { createMemoryRateLimiter } from './middleware/rateLimit.js'
import type { AiSettingsService } from './services/aiSettings.service.js'

const secret = env.jwtSecret

function identityToken(claims: {
  sub: string
  platform_role?: 'super_admin' | 'company_admin' | 'member'
}) {
  return jwt.sign(claims, secret, {
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
    expiresIn: 3600,
  })
}

function unconfiguredSettings(): AiSettingsService {
  return {
    getUserSettings: async () => ({
      configured: false,
      provider: 'ollama',
      model: 'gpt-oss:120b',
      baseUrl: 'https://ollama.com',
      timeoutMs: 180_000,
      hasApiKey: false,
      apiKeyHint: null,
      apiKey: null,
    }),
    patchUserSettings: async () => ({
      configured: true,
      provider: 'ollama',
      model: 'gpt-oss:120b',
      baseUrl: 'https://ollama.com',
      timeoutMs: 180_000,
      hasApiKey: true,
      apiKeyHint: '15d6dfe098c14477a7a2d7f3d706751e',
      apiKey: '15d6dfe098c14477a7a2d7f3d706751e.exampleSecretSuffix',
    }),
    getPlatformSettings: async () => ({
      configured: false,
      provider: 'ollama',
      model: 'llama3.1',
      baseUrl: 'http://127.0.0.1:11434',
      timeoutMs: 60_000,
      hasApiKey: false,
      apiKeyHint: null,
      apiKey: null,
    }),
    patchPlatformSettings: async () => ({
      configured: true,
      provider: 'ollama',
      model: 'llama3.1',
      baseUrl: 'http://127.0.0.1:11434',
      timeoutMs: 60_000,
      hasApiKey: false,
      apiKeyHint: null,
      apiKey: null,
    }),
    resolveProvider: async () => {
      throw Object.assign(new Error('not configured'), {
        status: 409,
        code: 'PROVIDER_NOT_CONFIGURED',
      })
    },
  }
}

async function withApi(settings: AiSettingsService, fn: (base: string, token: string) => Promise<void>) {
  const app = createApp({
    conversationService: createConversationService({
      repository: createMemoryConversationRepository(),
      resolveProvider: async (ctx) => {
        try {
          return await settings.resolveProvider(ctx)
        } catch (err) {
          if (err && typeof err === 'object' && 'status' in err && 'code' in err) {
            const e = err as { status: number; message?: string; code: string }
            const { HttpError } = await import('./services/httpError.js')
            throw new HttpError(e.status, e.message ?? 'Provider not configured', e.code)
          }
          throw err
        }
      },
      defaultSystemPrompt: 'test-prompt',
    }),
    aiSettingsService: settings,
    rateLimiter: createMemoryRateLimiter({ max: 100, windowMs: 60_000 }),
  })
  const server = createServer(app)
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const { port } = server.address() as AddressInfo
  const token = identityToken({ sub: 'user000000000000001', platform_role: 'member' })
  try {
    await fn(`http://127.0.0.1:${port}/api/v1`, token)
  } finally {
    server.close()
    await once(server, 'close')
  }
}

describe('AI settings API', () => {
  it('returns unconfigured user settings without api key', async () => {
    const settings = unconfiguredSettings()
    const app = createApp({
      conversationService: createConversationService({
        repository: createMemoryConversationRepository(),
        resolveProvider: () => settings.resolveProvider({} as never),
        defaultSystemPrompt: 'test',
      }),
      aiSettingsService: settings,
      rateLimiter: createMemoryRateLimiter({ max: 100, windowMs: 60_000 }),
    })
    const server = createServer(app)
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    const { port } = server.address() as AddressInfo
    const token = identityToken({ sub: 'user000000000000001' })
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/me/ai-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const body = (await res.json()) as Record<string, unknown>
      assert.equal(res.status, 200)
      assert.equal(body.configured, false)
      assert.equal(body.hasApiKey, false)
      assert.equal(body.apiKeyHint, null)
      assert.equal(body.apiKey, null)
    } finally {
      server.close()
      await once(server, 'close')
    }
  })

  it('returns 409 when sending without user provider', async () => {
    await withApi(unconfiguredSettings(), async (base, token) => {
      const created = await fetch(`${base}/conversations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: '{}',
      })
      assert.equal(created.status, 201)
      const { conversation } = (await created.json()) as { conversation: { id: string } }
      const sent = await fetch(`${base}/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'hello' }),
      })
      const body = (await sent.json()) as { code: string }
      assert.equal(sent.status, 409)
      assert.equal(body.code, 'PROVIDER_NOT_CONFIGURED')
    })
  })

  it('blocks guest from ai-settings endpoints', async () => {
    const guestToken = jwt.sign({ sub: 'guest123', token_use: 'guest' }, secret, {
      issuer: env.guestJwtIssuer,
      audience: env.guestJwtAudience,
      expiresIn: 3600,
    })
    const settings = unconfiguredSettings()
    const app = createApp({
      conversationService: createConversationService({
        repository: createMemoryConversationRepository(),
        resolveProvider: () => settings.resolveProvider({} as never),
        defaultSystemPrompt: 'test',
      }),
      aiSettingsService: settings,
      rateLimiter: createMemoryRateLimiter({ max: 100, windowMs: 60_000 }),
    })
    const server = createServer(app)
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    const { port } = server.address() as AddressInfo
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/me/ai-settings`, {
        headers: { Authorization: `Bearer ${guestToken}` },
      })
      assert.equal(res.status, 401)
    } finally {
      server.close()
      await once(server, 'close')
    }
  })
})
