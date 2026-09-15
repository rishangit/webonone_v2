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
import { createTextPolishService, stripPolishedText } from './services/textPolish.service.js'
import type { AiSettingsService } from './services/aiSettings.service.js'
import type { AiProvider, ChatCompletionInput, ChatCompletionResult } from './ai/providers/types.js'

const secret = env.jwtSecret

function identityToken(sub = 'user000000000000001') {
  return jwt.sign({ sub, platform_role: 'member' }, secret, {
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
    expiresIn: 3600,
  })
}

class RecordingProvider implements AiProvider {
  readonly id = 'ollama' as const
  lastInput: ChatCompletionInput | null = null
  content = 'Fixed spelling.'

  async complete(input: ChatCompletionInput): Promise<ChatCompletionResult> {
    this.lastInput = input
    return { content: this.content }
  }
}

function unconfiguredSettings(): AiSettingsService {
  return {
    getUserSettings: async () => ({
      configured: false,
      provider: 'ollama',
      model: 'llama3.1',
      baseUrl: 'http://127.0.0.1:11434',
      timeoutMs: 60_000,
      hasApiKey: false,
      apiKeyHint: null,
      apiKey: null,
    }),
    patchUserSettings: async () => {
      throw new Error('unused')
    },
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
    patchPlatformSettings: async () => {
      throw new Error('unused')
    },
    resolveProvider: async () => {
      throw Object.assign(new Error('not configured'), {
        status: 409,
        code: 'PROVIDER_NOT_CONFIGURED',
      })
    },
  }
}

describe('stripPolishedText', () => {
  it('removes markdown fences and quotes', () => {
    assert.equal(stripPolishedText('```\nHello\n```'), 'Hello')
    assert.equal(stripPolishedText('"Hello"'), 'Hello')
  })
})

describe('POST /text/polish', () => {
  it('returns 409 when the user provider is not configured', async () => {
    const settings = unconfiguredSettings()
    const app = createApp({
      conversationService: createConversationService({
        repository: createMemoryConversationRepository(),
        resolveProvider: async (ctx) => settings.resolveProvider(ctx),
        defaultSystemPrompt: 'test',
      }),
      aiSettingsService: settings,
      textPolishService: createTextPolishService({
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
      }),
      rateLimiter: createMemoryRateLimiter({ max: 100, windowMs: 60_000 }),
    })
    const server = createServer(app)
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    const { port } = server.address() as AddressInfo
    const token = identityToken()
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/text/polish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'helo world' }),
      })
      const body = (await res.json()) as { code: string }
      assert.equal(res.status, 409)
      assert.equal(body.code, 'PROVIDER_NOT_CONFIGURED')
    } finally {
      server.close()
      await once(server, 'close')
    }
  })

  it('returns only the polished field text and ignores other form values', async () => {
    const provider = new RecordingProvider()
    provider.content = 'Corrected name'
    const settings = unconfiguredSettings()
    const app = createApp({
      conversationService: createConversationService({
        repository: createMemoryConversationRepository(),
        resolveProvider: async () => ({ provider, systemPrompt: 'chat' }),
        defaultSystemPrompt: 'test',
      }),
      aiSettingsService: settings,
      textPolishService: createTextPolishService({
        resolveProvider: async () => ({ provider, systemPrompt: 'chat' }),
      }),
      rateLimiter: createMemoryRateLimiter({ max: 100, windowMs: 60_000 }),
    })
    const server = createServer(app)
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    const { port } = server.address() as AddressInfo
    const token = identityToken()
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/text/polish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Acme nme',
          field: { name: 'displayName', label: 'Display name', control: 'input' },
          form: {
            fields: [
              { label: 'Display name', name: 'displayName', value: 'Acme nme' },
              { label: 'Username', name: 'username', value: 'admin' },
            ],
          },
        }),
      })
      const body = (await res.json()) as Record<string, unknown>
      assert.equal(res.status, 200)
      assert.deepEqual(Object.keys(body), ['text'])
      assert.equal(body.text, 'Corrected name')
      assert.equal(provider.lastInput?.systemPrompt.includes('Never return or change any other field'), true)
      assert.equal(provider.lastInput?.tools, undefined)
      const userContent = provider.lastInput?.messages[0]?.content ?? ''
      assert.match(userContent, /Rewrite this field value/)
      assert.match(userContent, /Username \(username\): admin/)
    } finally {
      server.close()
      await once(server, 'close')
    }
  })

  it('rejects guest tokens', async () => {
    const guestToken = jwt.sign({ sub: 'guest123', token_use: 'guest' }, secret, {
      issuer: env.guestJwtIssuer,
      audience: env.guestJwtAudience,
      expiresIn: 3600,
    })
    const settings = unconfiguredSettings()
    const app = createApp({
      conversationService: createConversationService({
        repository: createMemoryConversationRepository(),
        resolveProvider: async () => {
          throw new Error('unused')
        },
        defaultSystemPrompt: 'test',
      }),
      aiSettingsService: settings,
      textPolishService: createTextPolishService({
        resolveProvider: async () => {
          throw new Error('unused')
        },
      }),
      rateLimiter: createMemoryRateLimiter({ max: 100, windowMs: 60_000 }),
    })
    const server = createServer(app)
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    const { port } = server.address() as AddressInfo
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/text/polish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${guestToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'hello' }),
      })
      assert.equal(res.status, 401)
    } finally {
      server.close()
      await once(server, 'close')
    }
  })
})
