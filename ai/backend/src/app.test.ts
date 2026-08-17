import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { describe, it } from 'node:test'
import jwt from 'jsonwebtoken'
import { env } from './config/env.js'
import { createApp } from './app.js'
import { createConversationService, withAvailableToolsPrompt } from './services/conversation.service.js'
import { createMemoryConversationRepository } from './services/conversation.repository.js'
import { createMemoryRateLimiter } from './middleware/rateLimit.js'
import { HttpError } from './services/httpError.js'
import { verifyBearerToken } from './middleware/auth.js'
import type { AiProvider, ChatCompletionInput, ChatCompletionResult } from './ai/providers/types.js'
import type { ToolCall, ToolExecutor } from './ai/tools/registry.js'
import { ToolRegistry } from './ai/tools/registry.js'
import { HttpToolExecutor } from './ai/tools/executor.js'
import type { AddressInfo } from 'node:net'

const secret = env.jwtSecret

function identityToken(claims: {
  sub: string
  email?: string
  platform_role?: 'super_admin' | 'company_admin' | 'member'
  company_id?: string | null
}) {
  return jwt.sign(claims, secret, {
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
    expiresIn: 3600,
  })
}

class FakeProvider implements AiProvider {
  readonly id = 'ollama' as const
  fail = false
  lastSystemPrompt = ''
  lastTools: ChatCompletionInput['tools']
  toolOnce: ToolCall | null = null
  toolBatch: ToolCall[] | null = null
  contentOnce: string | null = null
  secondContent: string | null = null
  secondToolBatch: ToolCall[] | null = null
  rounds = 0

  async complete(input: ChatCompletionInput): Promise<ChatCompletionResult> {
    this.lastSystemPrompt = input.systemPrompt
    this.lastTools = input.tools
    if (this.fail) {
      throw new HttpError(502, 'AI provider unavailable', 'PROVIDER_ERROR')
    }
    if (this.toolBatch && this.rounds === 0) {
      this.rounds += 1
      return { content: this.contentOnce ?? '', toolCalls: this.toolBatch }
    }
    if (this.toolOnce && this.rounds === 0) {
      this.rounds += 1
      return { content: this.contentOnce ?? '', toolCalls: [this.toolOnce] }
    }
    if (this.contentOnce && this.rounds === 0) {
      this.rounds += 1
      return { content: this.contentOnce }
    }
    if (this.secondContent && this.rounds === 1) {
      this.rounds += 1
      return { content: this.secondContent }
    }
    if (this.secondToolBatch && this.rounds >= 1) {
      this.rounds += 1
      const batch = this.secondToolBatch
      this.secondToolBatch = null
      return { content: '', toolCalls: batch }
    }
    this.rounds += 1
    return { content: `echo:${input.messages.at(-1)?.content ?? ''}` }
  }
}

import type { AiSettingsService } from './services/aiSettings.service.js'

function testAiSettingsService(provider: FakeProvider, systemPrompt = 'backend-system-prompt'): AiSettingsService {
  return {
    getUserSettings: async () => ({
      configured: true,
      provider: 'ollama',
      model: 'test',
      baseUrl: 'https://ollama.com',
      timeoutMs: 60_000,
      hasApiKey: true,
      apiKeyHint: '15d6dfe098c14477a7a2d7f3d706751e',
      apiKey: '15d6dfe098c14477a7a2d7f3d706751e.exampleSecretSuffix',
    }),
    patchUserSettings: async () => ({
      configured: true,
      provider: 'ollama',
      model: 'test',
      baseUrl: 'https://ollama.com',
      timeoutMs: 60_000,
      hasApiKey: true,
      apiKeyHint: '15d6dfe098c14477a7a2d7f3d706751e',
      apiKey: '15d6dfe098c14477a7a2d7f3d706751e.exampleSecretSuffix',
    }),
    getPlatformSettings: async () => ({
      configured: true,
      provider: 'ollama',
      model: 'test',
      baseUrl: 'https://ollama.com',
      timeoutMs: 60_000,
      hasApiKey: true,
      apiKeyHint: '15d6dfe098c14477a7a2d7f3d706751e',
      apiKey: '15d6dfe098c14477a7a2d7f3d706751e.exampleSecretSuffix',
    }),
    patchPlatformSettings: async () => ({
      configured: true,
      provider: 'ollama',
      model: 'test',
      baseUrl: 'https://ollama.com',
      timeoutMs: 60_000,
      hasApiKey: true,
      apiKeyHint: '15d6dfe098c14477a7a2d7f3d706751e',
      apiKey: '15d6dfe098c14477a7a2d7f3d706751e.exampleSecretSuffix',
    }),
    resolveProvider: async () => ({ provider, systemPrompt }),
  }
}

async function withApi(
  provider: FakeProvider,
  fn: (base: string) => Promise<void>,
  rate?: { max: number; windowMs: number },
  tools?: { registry: ToolRegistry; executor: ToolExecutor },
  settings?: AiSettingsService,
) {
  const limiter = rate ?? { max: 100, windowMs: 60_000 }
  const aiSettingsService = settings ?? testAiSettingsService(provider)
  const app = createApp({
    conversationService: createConversationService({
      repository: createMemoryConversationRepository(),
      resolveProvider: (ctx) => aiSettingsService.resolveProvider(ctx),
      defaultSystemPrompt: 'backend-system-prompt',
      registry: tools?.registry,
      executor: tools?.executor,
    }),
    aiSettingsService,
    rateLimiter: createMemoryRateLimiter(limiter),
  })
  const server = createServer(app)
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const { port } = server.address() as AddressInfo
  try {
    await fn(`http://127.0.0.1:${port}/api/v1`)
  } finally {
    server.close()
    await once(server, 'close')
  }
}

async function json(
  url: string,
  options: RequestInit & { token?: string } = {},
) {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  }
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`
  }
  const res = await fetch(url, { ...options, headers })
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
  return { res, body }
}

describe('AI auth and conversations', () => {
  it('rejects missing token', async () => {
    await withApi(new FakeProvider(), async (base) => {
      const { res, body } = await json(`${base}/conversations`)
      assert.equal(res.status, 401)
      assert.equal(body.code, 'UNAUTHORIZED')
    })
  })

  it('rejects invalid token', async () => {
    await withApi(new FakeProvider(), async (base) => {
      const { res } = await json(`${base}/conversations`, { token: 'not-a-jwt' })
      assert.equal(res.status, 401)
    })
  })

  it('lets super-admin without company create, list, and send', async () => {
    const provider = new FakeProvider()
    const token = identityToken({
      sub: 'superadmin00000000001',
      email: 'admin@example.com',
      platform_role: 'super_admin',
      company_id: null,
    })
    await withApi(provider, async (base) => {
      const created = await json(`${base}/conversations`, { method: 'POST', token, body: '{}' })
      assert.equal(created.res.status, 201)
      const id = (created.body.conversation as { id: string }).id
      const sent = await json(`${base}/conversations/${id}/messages`, {
        method: 'POST',
        token,
        body: JSON.stringify({ content: 'hello admin' }),
      })
      assert.equal(sent.res.status, 201)
      assert.equal(provider.lastSystemPrompt, 'backend-system-prompt')
      const listed = await json(`${base}/conversations`, { token })
      assert.equal((listed.body.items as unknown[]).length, 1)
    })
  })

  it('lets a member with no company chat', async () => {
    const token = identityToken({
      sub: 'member000000000000001',
      email: 'user@example.com',
      platform_role: 'member',
    })
    await withApi(new FakeProvider(), async (base) => {
      const created = await json(`${base}/conversations`, { method: 'POST', token, body: '{}' })
      assert.equal(created.res.status, 201)
    })
  })

  it('isolates company-admin conversations by tenant and user', async () => {
    const adminA = identityToken({
      sub: 'companyadmin0000000001',
      platform_role: 'company_admin',
      company_id: 'company00000000000001',
    })
    const adminB = identityToken({
      sub: 'companyadmin0000000002',
      platform_role: 'company_admin',
      company_id: 'company00000000000002',
    })
    const otherUser = identityToken({
      sub: 'companyadmin0000000003',
      platform_role: 'company_admin',
      company_id: 'company00000000000001',
    })
    const superAdmin = identityToken({
      sub: 'superadmin00000000002',
      platform_role: 'super_admin',
      company_id: null,
    })

    await withApi(new FakeProvider(), async (base) => {
      const created = await json(`${base}/conversations`, { method: 'POST', token: adminA, body: '{}' })
      const id = (created.body.conversation as { id: string }).id

      const otherCompany = await json(`${base}/conversations/${id}`, { token: adminB })
      assert.equal(otherCompany.res.status, 404)

      const otherUserRes = await json(`${base}/conversations/${id}`, { token: otherUser })
      assert.equal(otherUserRes.res.status, 404)

      const superRes = await json(`${base}/conversations/${id}`, { token: superAdmin })
      assert.equal(superRes.res.status, 404)
    })
  })

  it('issues guest sessions and isolates guest threads from identity users', async () => {
    const userToken = identityToken({ sub: 'member000000000000002', platform_role: 'member' })
    await withApi(new FakeProvider(), async (base) => {
      const guest = await json(`${base}/guest-sessions`, { method: 'POST' })
      assert.equal(guest.res.status, 201)
      const guestToken = guest.body.accessToken as string
      const created = await json(`${base}/conversations`, { method: 'POST', token: guestToken, body: '{}' })
      const id = (created.body.conversation as { id: string }).id

      const asUser = await json(`${base}/conversations/${id}`, { token: userToken })
      assert.equal(asUser.res.status, 404)

      const asGuest = await json(`${base}/conversations/${id}`, { token: guestToken })
      assert.equal(asGuest.res.status, 200)
    })
  })

  it('ignores client-supplied companyId and userId', async () => {
    const token = identityToken({
      sub: 'member000000000000003',
      platform_role: 'member',
      company_id: null,
    })
    await withApi(new FakeProvider(), async (base) => {
      const created = await json(`${base}/conversations`, {
        method: 'POST',
        token,
        body: JSON.stringify({ companyId: 'injectedcompany0000001', userId: 'injecteduser0000000001' }),
      })
      const conversation = created.body.conversation as { companyId: string | null; userId: string }
      assert.equal(conversation.companyId, null)
      assert.equal(conversation.userId, 'member000000000000003')
    })
  })

  it('validates message content', async () => {
    const token = identityToken({ sub: 'member000000000000004', platform_role: 'member' })
    await withApi(new FakeProvider(), async (base) => {
      const created = await json(`${base}/conversations`, { method: 'POST', token, body: '{}' })
      const id = (created.body.conversation as { id: string }).id
      const empty = await json(`${base}/conversations/${id}/messages`, {
        method: 'POST',
        token,
        body: JSON.stringify({ content: '   ' }),
      })
      assert.equal(empty.res.status, 400)
    })
  })

  it('returns PROVIDER_ERROR and keeps the user message when the provider fails', async () => {
    const provider = new FakeProvider()
    provider.fail = true
    const token = identityToken({ sub: 'member000000000000005', platform_role: 'member' })
    await withApi(provider, async (base) => {
      const created = await json(`${base}/conversations`, { method: 'POST', token, body: '{}' })
      const id = (created.body.conversation as { id: string }).id
      const sent = await json(`${base}/conversations/${id}/messages`, {
        method: 'POST',
        token,
        body: JSON.stringify({ content: 'will fail' }),
      })
      assert.equal(sent.res.status, 502)
      assert.equal(sent.body.code, 'PROVIDER_ERROR')
      const messages = await json(`${base}/conversations/${id}/messages`, { token })
      assert.equal((messages.body.items as unknown[]).length, 1)
    })
  })

  it('rate-limits guest session creation', async () => {
    await withApi(new FakeProvider(), async (base) => {
      const first = await json(`${base}/guest-sessions`, { method: 'POST' })
      const second = await json(`${base}/guest-sessions`, { method: 'POST' })
      const third = await json(`${base}/guest-sessions`, { method: 'POST' })
      assert.equal(first.res.status, 201)
      assert.equal(second.res.status, 201)
      assert.equal(third.res.status, 429)
    }, { max: 2, windowMs: 60_000 })
  })

  it('does not treat guest tokens as identity users', () => {
    const guest = jwt.sign({ sub: 'guestid000000000000001', token_use: 'guest' }, secret, {
      issuer: env.guestJwtIssuer,
      audience: env.guestJwtAudience,
    })
    const principal = verifyBearerToken(guest)
    assert.equal(principal.role, 'guest')
    assert.equal(principal.id, null)
    assert.equal(principal.guestId, 'guestid000000000000001')
  })

  it('parks a write tool until confirm, then executes', async () => {
    const provider = new FakeProvider()
    provider.toolOnce = {
      id: 'toolcall0000000000001',
      name: 'create_catalog_item',
      arguments: { kind: 'products', name: 'Rice' },
    }
    const writeTool = {
      name: 'create_catalog_item',
      description: 'create',
      jsonSchema: { type: 'object', properties: {} },
      riskLevel: 'write' as const,
      requiredRoles: ['company_admin' as const],
      requiredPermissions: ['ai:catalog:write'],
      service: 'webonone' as const,
      auth: 'user_jwt' as const,
      invoke: { method: 'POST' as const, path: '/api/v1/company/me/catalog/:kind/custom' },
      capabilityVersion: '1',
    }
    const registry = new ToolRegistry([writeTool])
    const fetches: string[] = []
    const executor = new HttpToolExecutor({
      registry,
      peers: {
        webonone: {
          apiBaseUrl: 'http://127.0.0.1:4010',
          serviceApiKey: 'key',
        },
      },
      timeoutMs: 1000,
      fetchImpl: async (url) => {
        fetches.push(String(url))
        return new Response(JSON.stringify({ id: 'prod00000000000000001', name: 'Rice' }), { status: 201 })
      },
    })
    const token = identityToken({
      sub: 'companyadmin0000000009',
      platform_role: 'company_admin',
      company_id: 'company00000000000009',
    })
    await withApi(provider, async (base) => {
      const created = await json(`${base}/conversations`, { method: 'POST', token, body: '{}' })
      const id = (created.body.conversation as { id: string }).id
      const sent = await json(`${base}/conversations/${id}/messages`, {
        method: 'POST',
        token,
        body: JSON.stringify({ content: 'add product Rice' }),
      })
      assert.equal(sent.res.status, 201)
      assert.equal(fetches.length, 0)
      const pending = (sent.body.assistantMessage as { pendingTool?: { toolCallId: string; status: string } })
        .pendingTool
      assert.equal(pending?.status, 'pending_confirmation')
      const confirmed = await json(
        `${base}/conversations/${id}/tool-calls/${pending?.toolCallId}/confirm`,
        { method: 'POST', token, body: '{}' },
      )
      assert.equal(confirmed.res.status, 200)
      assert.equal(fetches.length, 1)
      const again = await json(
        `${base}/conversations/${id}/tool-calls/${pending?.toolCallId}/confirm`,
        { method: 'POST', token, body: '{}' },
      )
      assert.equal(again.res.status, 200)
      assert.equal(fetches.length, 1)
      assert.match(
        String((again.body.assistantMessage as { content?: string }).content),
        /already applied/i,
      )
    }, undefined, { registry, executor })
  })

  it('keeps a confirmed write when the follow-up provider call fails', async () => {
    const provider = new FakeProvider()
    provider.toolOnce = {
      id: 'toolcall0000000000002',
      name: 'create_catalog_item',
      arguments: { kind: 'products', name: 'Rice' },
    }
    const writeTool = {
      name: 'create_catalog_item',
      description: 'create',
      jsonSchema: { type: 'object', properties: {} },
      riskLevel: 'write' as const,
      requiredRoles: ['company_admin' as const],
      requiredPermissions: ['ai:catalog:write'],
      service: 'webonone' as const,
      auth: 'user_jwt' as const,
      invoke: { method: 'POST' as const, path: '/api/v1/company/me/catalog/:kind/custom' },
      capabilityVersion: '1',
    }
    const registry = new ToolRegistry([writeTool])
    const fetches: string[] = []
    const executor = new HttpToolExecutor({
      registry,
      peers: {
        webonone: {
          apiBaseUrl: 'http://127.0.0.1:4010',
          serviceApiKey: 'key',
        },
      },
      timeoutMs: 1000,
      fetchImpl: async (url) => {
        fetches.push(String(url))
        return new Response(JSON.stringify({ id: 'prod00000000000000002', name: 'Rice' }), { status: 201 })
      },
    })
    const token = identityToken({
      sub: 'companyadmin0000000010',
      platform_role: 'company_admin',
      company_id: 'company00000000000010',
    })
    await withApi(provider, async (base) => {
      const created = await json(`${base}/conversations`, { method: 'POST', token, body: '{}' })
      const id = (created.body.conversation as { id: string }).id
      const sent = await json(`${base}/conversations/${id}/messages`, {
        method: 'POST',
        token,
        body: JSON.stringify({ content: 'add product Rice' }),
      })
      const pending = (sent.body.assistantMessage as { pendingTool?: { toolCallId: string } }).pendingTool
      provider.fail = true
      const confirmed = await json(
        `${base}/conversations/${id}/tool-calls/${pending?.toolCallId}/confirm`,
        { method: 'POST', token, body: '{}' },
      )
      assert.equal(confirmed.res.status, 200)
      assert.equal(fetches.length, 1)
      const confirmedCalls = (confirmed.body.assistantMessage as {
        pendingTool?: { calls?: { status?: string }[] }
      }).pendingTool?.calls ?? []
      assert.equal(confirmedCalls.some((call) => call.status === 'confirmed'), true)
    }, undefined, { registry, executor })
  })

  it('parks multiple write tools from one turn and confirms them one at a time', async () => {
    const provider = new FakeProvider()
    provider.toolBatch = [
      {
        id: 'toolcall0000000000011',
        name: 'create_catalog_item',
        arguments: { kind: 'products', name: 'Rice' },
      },
      {
        id: 'toolcall0000000000012',
        name: 'create_catalog_item',
        arguments: { kind: 'products', name: 'Tea' },
      },
    ]
    const writeTool = {
      name: 'create_catalog_item',
      description: 'create',
      jsonSchema: { type: 'object', properties: {} },
      riskLevel: 'write' as const,
      requiredRoles: ['company_admin' as const],
      requiredPermissions: ['ai:catalog:write'],
      service: 'webonone' as const,
      auth: 'user_jwt' as const,
      invoke: { method: 'POST' as const, path: '/api/v1/company/me/catalog/:kind/custom' },
      capabilityVersion: '1',
    }
    const registry = new ToolRegistry([writeTool])
    const fetches: string[] = []
    const executor = new HttpToolExecutor({
      registry,
      peers: {
        webonone: {
          apiBaseUrl: 'http://127.0.0.1:4010',
          serviceApiKey: 'key',
        },
      },
      timeoutMs: 1000,
      fetchImpl: async (url, init) => {
        fetches.push(String(init?.body ?? url))
        return new Response(JSON.stringify({ id: `prod${fetches.length}` }), { status: 201 })
      },
    })
    const token = identityToken({
      sub: 'companyadmin0000000011',
      platform_role: 'company_admin',
      company_id: 'company00000000000011',
    })
    await withApi(provider, async (base) => {
      const created = await json(`${base}/conversations`, { method: 'POST', token, body: '{}' })
      const id = (created.body.conversation as { id: string }).id
      const sent = await json(`${base}/conversations/${id}/messages`, {
        method: 'POST',
        token,
        body: JSON.stringify({ content: 'add products Rice and Tea' }),
      })
      assert.equal(sent.res.status, 201)
      assert.equal(fetches.length, 0)
      const pending = (sent.body.assistantMessage as {
        id: string
        pendingTool?: {
          toolCallId: string
          summary: string
          calls?: { toolCallId: string; arguments: { name?: string } }[]
        }
      })
      assert.match(String(pending.pendingTool?.summary), /Rice/)
      assert.match(String(pending.pendingTool?.summary), /Tea/)
      const calls = pending.pendingTool?.calls ?? []
      assert.equal(calls.length, 2)
      const first = await json(
        `${base}/conversations/${id}/tool-calls/${calls[0]?.toolCallId}/confirm`,
        { method: 'POST', token, body: '{}' },
      )
      assert.equal(first.res.status, 200)
      assert.equal(fetches.length, 1)
      const remaining = (first.body.assistantMessage as {
        id: string
        pendingTool?: { calls?: { toolCallId: string; status?: string }[]; status?: string }
      })
      assert.equal(remaining.id, pending.id)
      assert.equal(remaining.pendingTool?.status, 'pending_confirmation')
      assert.equal(remaining.pendingTool?.calls?.length, 2)
      assert.equal(
        remaining.pendingTool?.calls?.filter((call) => call.status === 'pending_confirmation').length,
        1,
      )
      const second = await json(
        `${base}/conversations/${id}/tool-calls/${calls[1]?.toolCallId}/confirm`,
        { method: 'POST', token, body: '{}' },
      )
      assert.equal(second.res.status, 200)
      assert.equal(fetches.length, 2)
      assert.equal((second.body.assistantMessage as { id: string }).id, pending.id)
      assert.equal(
        (second.body.assistantMessage as { pendingTool?: { status?: string } }).pendingTool?.status,
        'confirmed',
      )
    }, undefined, { registry, executor })
  })

  it('skips unique names that already exist before showing confirm rows', async () => {
    const provider = new FakeProvider()
    provider.toolBatch = [
      {
        id: 'toolcall0000000000021',
        name: 'create_data_tag',
        arguments: { name: 'Healthcare', description: 'Healthcare services.', status: 'pending' },
      },
      {
        id: 'toolcall0000000000022',
        name: 'create_data_tag',
        arguments: { name: 'FirstAid', description: 'First aid care.', status: 'pending' },
      },
      {
        id: 'toolcall0000000000023',
        name: 'create_data_tag',
        arguments: { name: 'healthcare', description: 'Duplicate.', status: 'pending' },
      },
    ]
    const writeTool = {
      name: 'create_data_tag',
      description: 'create',
      jsonSchema: {
        type: 'object',
        required: ['name', 'description', 'status'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string' },
        },
      },
      riskLevel: 'write' as const,
      requiredRoles: ['company_admin' as const],
      requiredPermissions: ['ai:data_library:write'],
      service: 'data' as const,
      auth: 'user_jwt' as const,
      invoke: { method: 'POST' as const, path: '/api/v1/tags' },
      capabilityVersion: '1',
      argCompletion: {
        uniqueBy: 'name',
        uniqueLookup: { method: 'GET' as const, path: '/api/v1/tags', queryParam: 'names' as const },
      },
    }
    const registry = new ToolRegistry([writeTool])
    const fetches: string[] = []
    const executor = new HttpToolExecutor({
      registry,
      peers: {
        data: {
          apiBaseUrl: 'http://127.0.0.1:4015',
          serviceApiKey: 'key',
        },
      },
      timeoutMs: 1000,
      fetchImpl: async (url, init) => {
        fetches.push(`${init?.method ?? 'GET'} ${String(url)}`)
        if (String(url).includes('names=')) {
          return new Response(JSON.stringify({ items: [{ name: 'Healthcare' }] }), { status: 200 })
        }
        return new Response(JSON.stringify({ id: 'tag000000000000000001' }), { status: 201 })
      },
    })
    const token = identityToken({
      sub: 'companyadmin0000000012',
      platform_role: 'company_admin',
      company_id: 'company00000000000012',
    })
    await withApi(provider, async (base) => {
      const created = await json(`${base}/conversations`, { method: 'POST', token, body: '{}' })
      const id = (created.body.conversation as { id: string }).id
      const sent = await json(`${base}/conversations/${id}/messages`, {
        method: 'POST',
        token,
        body: JSON.stringify({ content: 'create tags Healthcare FirstAid' }),
      })
      assert.equal(sent.res.status, 201)
      const pending = (sent.body.assistantMessage as {
        content: string
        pendingTool?: { calls?: { arguments: { name?: string } }[]; summary: string }
      })
      assert.match(pending.content, /Healthcare/)
      assert.equal(pending.pendingTool?.calls?.length, 1)
      assert.equal(pending.pendingTool?.calls?.[0]?.arguments.name, 'FirstAid')
      assert.equal(
        fetches.filter((entry) => entry.startsWith('GET')).length,
        1,
      )
    }, undefined, { registry, executor })
  })

  it('skips one pending write without calling the peer', async () => {
    const provider = new FakeProvider()
    provider.toolBatch = [
      {
        id: 'toolcall0000000000031',
        name: 'create_catalog_item',
        arguments: { kind: 'products', name: 'Rice' },
      },
      {
        id: 'toolcall0000000000032',
        name: 'create_catalog_item',
        arguments: { kind: 'products', name: 'Tea' },
      },
    ]
    const writeTool = {
      name: 'create_catalog_item',
      description: 'create',
      jsonSchema: { type: 'object', properties: {} },
      riskLevel: 'write' as const,
      requiredRoles: ['company_admin' as const],
      requiredPermissions: ['ai:catalog:write'],
      service: 'webonone' as const,
      auth: 'user_jwt' as const,
      invoke: { method: 'POST' as const, path: '/api/v1/company/me/catalog/:kind/custom' },
      capabilityVersion: '1',
    }
    const registry = new ToolRegistry([writeTool])
    const fetches: string[] = []
    const executor = new HttpToolExecutor({
      registry,
      peers: {
        webonone: {
          apiBaseUrl: 'http://127.0.0.1:4010',
          serviceApiKey: 'key',
        },
      },
      timeoutMs: 1000,
      fetchImpl: async (url, init) => {
        fetches.push(String(init?.body ?? url))
        return new Response(JSON.stringify({ id: 'prod1' }), { status: 201 })
      },
    })
    const token = identityToken({
      sub: 'companyadmin0000000013',
      platform_role: 'company_admin',
      company_id: 'company00000000000013',
    })
    await withApi(provider, async (base) => {
      const created = await json(`${base}/conversations`, { method: 'POST', token, body: '{}' })
      const id = (created.body.conversation as { id: string }).id
      const sent = await json(`${base}/conversations/${id}/messages`, {
        method: 'POST',
        token,
        body: JSON.stringify({ content: 'add products Rice and Tea' }),
      })
      const calls = (sent.body.assistantMessage as {
        pendingTool?: { calls?: { toolCallId: string }[] }
      }).pendingTool?.calls ?? []
      const skipped = await json(
        `${base}/conversations/${id}/tool-calls/${calls[0]?.toolCallId}/reject`,
        { method: 'POST', token, body: '{}' },
      )
      assert.equal(skipped.res.status, 200)
      assert.equal(fetches.length, 0)
      const skippedCalls = (skipped.body.assistantMessage as {
        pendingTool?: { calls?: { status?: string }[] }
      }).pendingTool?.calls ?? []
      assert.equal(skippedCalls.length, 2)
      assert.equal(skippedCalls.filter((call) => call.status === 'pending_confirmation').length, 1)
      assert.equal(skippedCalls.filter((call) => call.status === 'rejected').length, 1)
    }, undefined, { registry, executor })
  })

  it('parks create-ready markdown tables as confirm rows', async () => {
    const provider = new FakeProvider()
    provider.contentOnce = `| Tag Name (camelCase) | Description |
|---|---|
| **GeneralPractice** | General Practice – Primary-care services. |
| **Pediatrics** | Pediatrics – Child health services. |`
    const writeTool = {
      name: 'create_data_tag',
      description: 'Create a Data library tag.',
      jsonSchema: {
        type: 'object',
        required: ['name', 'description', 'status'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string' },
        },
      },
      riskLevel: 'write' as const,
      requiredRoles: ['company_admin' as const, 'super_admin' as const],
      requiredPermissions: ['ai:data_library:write'],
      service: 'data' as const,
      auth: 'user_jwt' as const,
      invoke: { method: 'POST' as const, path: '/api/v1/tags' },
      capabilityVersion: '1',
      argCompletion: {
        allowedKeys: ['name', 'description', 'color', 'status'],
        defaults: { status: 'pending' },
      },
    }
    const registry = new ToolRegistry([writeTool])
    const fetches: string[] = []
    const executor = new HttpToolExecutor({
      registry,
      peers: {
        data: {
          apiBaseUrl: 'http://127.0.0.1:4015',
          serviceApiKey: 'key',
        },
      },
      timeoutMs: 1000,
      fetchImpl: async (url, init) => {
        fetches.push(String(init?.body ?? url))
        return new Response(JSON.stringify({ id: `tag${fetches.length}` }), { status: 201 })
      },
    })
    const token = identityToken({
      sub: 'companyadmin0000000014',
      platform_role: 'company_admin',
      company_id: 'company00000000000014',
    })
    await withApi(provider, async (base) => {
      const created = await json(`${base}/conversations`, { method: 'POST', token, body: '{}' })
      const id = (created.body.conversation as { id: string }).id
      const sent = await json(`${base}/conversations/${id}/messages`, {
        method: 'POST',
        token,
        body: JSON.stringify({ content: 'Add Data library tags for a medical-center catalog' }),
      })
      assert.equal(sent.res.status, 201)
      const pending = sent.body.assistantMessage as {
        content: string
        pendingTool?: { calls?: { arguments: { name?: string } }[] }
      }
      assert.equal(pending.content.includes('GeneralPractice'), false)
      assert.equal(pending.pendingTool?.calls?.length, 2)
      assert.equal(pending.pendingTool?.calls?.[0]?.arguments.name, 'GeneralPractice')
      assert.equal(pending.pendingTool?.calls?.[1]?.arguments.name, 'Pediatrics')
      assert.equal(fetches.length, 0)
    }, undefined, { registry, executor })
  })

  it('retries until the requested number of create items are parked', async () => {
    const provider = new FakeProvider()
    provider.toolOnce = {
      id: 'toolcall0000000000041',
      name: 'create_data_tag',
      arguments: {
        name: 'ClinicHours',
        description: 'Clinic Hours - Opening times of the medical clinic.',
        status: 'pending',
      },
    }
    provider.secondContent = `| name | description |
|---|---|
| Pediatrics | Pediatrics - Child health services. |
| Radiology | Radiology - Diagnostic imaging. |`
    const writeTool = {
      name: 'create_data_tag',
      description: 'Create a Data library tag.',
      jsonSchema: {
        type: 'object',
        required: ['name', 'description', 'status'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string' },
        },
      },
      riskLevel: 'write' as const,
      requiredRoles: ['company_admin' as const, 'super_admin' as const],
      requiredPermissions: ['ai:data_library:write'],
      service: 'data' as const,
      auth: 'user_jwt' as const,
      invoke: { method: 'POST' as const, path: '/api/v1/tags' },
      capabilityVersion: '1',
      argCompletion: {
        allowedKeys: ['name', 'description', 'color', 'status'],
        defaults: { status: 'pending' },
      },
    }
    const registry = new ToolRegistry([writeTool])
    const executor = new HttpToolExecutor({
      registry,
      peers: { data: { apiBaseUrl: 'http://127.0.0.1:4015', serviceApiKey: 'key' } },
      timeoutMs: 1000,
      fetchImpl: async () => new Response(JSON.stringify({ id: 'tag1' }), { status: 201 }),
    })
    const token = identityToken({
      sub: 'companyadmin0000000017',
      platform_role: 'company_admin',
      company_id: 'company00000000000017',
    })
    await withApi(provider, async (base) => {
      const created = await json(`${base}/conversations`, { method: 'POST', token, body: '{}' })
      const id = (created.body.conversation as { id: string }).id
      const sent = await json(`${base}/conversations/${id}/messages`, {
        method: 'POST',
        token,
        body: JSON.stringify({ content: 'need to add 3 tag to the data library related to medical clinic' }),
      })
      assert.equal(sent.res.status, 201)
      const pending = sent.body.assistantMessage as {
        pendingTool?: { calls?: { arguments: { name?: string } }[] }
      }
      const names = pending.pendingTool?.calls?.map((call) => call.arguments.name) ?? []
      assert.deepEqual(names, ['ClinicHours', 'Pediatrics', 'Radiology'])
      assert.equal(provider.rounds, 2)
    }, undefined, { registry, executor })
  })

  it('leaves a markdown table as text when no create tool is available', async () => {
    const provider = new FakeProvider()
    provider.contentOnce = `| Tag Name | Description |
|---|---|
| **GeneralPractice** | General Practice – Primary-care services. |`
    const registry = new ToolRegistry([])
    const executor = new HttpToolExecutor({
      registry,
      peers: {},
      timeoutMs: 1000,
      fetchImpl: async () => new Response('{}', { status: 404 }),
    })
    const token = identityToken({
      sub: 'companyadmin0000000016',
      platform_role: 'company_admin',
      company_id: 'company00000000000016',
    })
    await withApi(provider, async (base) => {
      const created = await json(`${base}/conversations`, { method: 'POST', token, body: '{}' })
      const id = (created.body.conversation as { id: string }).id
      const sent = await json(`${base}/conversations/${id}/messages`, {
        method: 'POST',
        token,
        body: JSON.stringify({ content: 'Add Data library tags' }),
      })
      assert.equal(sent.res.status, 201)
      const message = sent.body.assistantMessage as { content: string; pendingTool?: unknown }
      assert.match(message.content, /GeneralPractice/)
      assert.equal(message.pendingTool ?? null, null)
    }, undefined, { registry, executor })
  })

  it('does not park when two create tools could consume the same records', async () => {
    const provider = new FakeProvider()
    provider.contentOnce = `| Name | Description |
|---|---|
| Clinic | A clinic label. |`
    const tagTool = {
      name: 'create_data_tag',
      description: 'Create a Data library tag.',
      jsonSchema: {
        type: 'object',
        required: ['name', 'description'],
        properties: { name: { type: 'string' }, description: { type: 'string' } },
      },
      riskLevel: 'write' as const,
      requiredRoles: ['company_admin' as const],
      requiredPermissions: ['ai:data_library:write'],
      service: 'data' as const,
      auth: 'user_jwt' as const,
      invoke: { method: 'POST' as const, path: '/api/v1/tags' },
      capabilityVersion: '1',
    }
    const catalogTool = {
      name: 'create_catalog_item',
      description: 'Create a company catalog item.',
      jsonSchema: {
        type: 'object',
        required: ['name', 'description'],
        properties: { name: { type: 'string' }, description: { type: 'string' } },
      },
      riskLevel: 'write' as const,
      requiredRoles: ['company_admin' as const],
      requiredPermissions: ['ai:catalog:write'],
      service: 'webonone' as const,
      auth: 'user_jwt' as const,
      invoke: { method: 'POST' as const, path: '/api/v1/company/me/catalog/:kind/custom' },
      capabilityVersion: '1',
    }
    const registry = new ToolRegistry([tagTool, catalogTool])
    const executor = new HttpToolExecutor({
      registry,
      peers: {
        data: { apiBaseUrl: 'http://127.0.0.1:4015', serviceApiKey: 'key' },
        webonone: { apiBaseUrl: 'http://127.0.0.1:4010', serviceApiKey: 'key' },
      },
      timeoutMs: 1000,
      fetchImpl: async () => new Response(JSON.stringify({ id: 'x' }), { status: 201 }),
    })
    const token = identityToken({
      sub: 'companyadmin0000000015',
      platform_role: 'company_admin',
      company_id: 'company00000000000015',
    })
    await withApi(provider, async (base) => {
      const created = await json(`${base}/conversations`, { method: 'POST', token, body: '{}' })
      const id = (created.body.conversation as { id: string }).id
      const sent = await json(`${base}/conversations/${id}/messages`, {
        method: 'POST',
        token,
        body: JSON.stringify({ content: 'please handle these' }),
      })
      assert.equal(sent.res.status, 201)
      const message = sent.body.assistantMessage as { content: string; pendingTool?: unknown }
      assert.match(message.content, /Clinic/)
      assert.equal(message.pendingTool, null)
    }, undefined, { registry, executor })
  })
})

describe('withAvailableToolsPrompt', () => {
  it('appends create-field guidance when tools are listed', () => {
    const prompt = withAvailableToolsPrompt('base prompt.', [
      {
        name: 'create_data_tag',
        description: 'create',
        jsonSchema: { type: 'object', properties: {} },
        riskLevel: 'write',
        requiredRoles: ['company_admin'],
        requiredPermissions: ['ai:data_library:write'],
        service: 'data',
        auth: 'user_jwt',
        invoke: { method: 'POST', path: '/api/v1/tags' },
        capabilityVersion: '1',
      },
    ])
    assert.match(prompt, /create_data_tag/)
    assert.match(prompt, /include every required schema property/)
    assert.match(prompt, /Copy name from the user message/)
    assert.match(prompt, /Do not invent IDs/)
    assert.match(prompt, /Do not call a write tool until entity, action, and target are known/)
    assert.match(prompt, /numbered list of options/)
    assert.match(prompt, /Do not ask which items to create in text/)
    assert.match(prompt, /once per item in the same turn/)
    assert.match(prompt, /10 tags/)
  })

  it('leaves the base prompt unchanged when no tools are listed', () => {
    assert.equal(withAvailableToolsPrompt('base prompt.', []), 'base prompt.')
  })
})
