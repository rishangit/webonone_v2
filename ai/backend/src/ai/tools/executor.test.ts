import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { HttpToolExecutor } from './executor.js'
import { ToolRegistry, type ToolDefinition } from './registry.js'

const writeTool: ToolDefinition = {
  name: 'create_catalog_item',
  description: 'create',
  jsonSchema: { type: 'object', properties: {} },
  riskLevel: 'write',
  requiredRoles: ['company_admin'],
  requiredPermissions: ['ai:catalog:write'],
  service: 'webonone',
  auth: 'user_jwt',
  invoke: { method: 'POST', path: '/api/v1/company/me/catalog/:kind/custom' },
  capabilityVersion: '1',
}

const readTool: ToolDefinition = {
  ...writeTool,
  name: 'search_company_catalog',
  riskLevel: 'read',
  requiredRoles: ['member', 'company_admin'],
  requiredPermissions: ['ai:catalog:read'],
  invoke: { method: 'GET', path: '/api/v1/company/me/catalog/:kind' },
}

const createUnit: ToolDefinition = {
  ...writeTool,
  name: 'create_data_unit',
  requiredRoles: ['company_admin', 'super_admin'],
  requiredPermissions: ['ai:data_library:write'],
  service: 'data',
  invoke: { method: 'POST', path: '/api/v1/units' },
}

const createItem: ToolDefinition = {
  ...createUnit,
  name: 'create_item',
  jsonSchema: {
    type: 'object',
    required: ['name', 'description', 'color', 'status'],
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      color: { type: 'string', enum: ['#059669', '#3366FF'] },
      status: { type: 'string', enum: ['verified', 'pending'] },
    },
  },
  argCompletion: {
    allowedKeys: ['name', 'description', 'color', 'status'],
    defaults: { status: 'pending' },
    forceByRole: { company_admin: { status: 'pending' } },
  },
  invoke: { method: 'POST', path: '/api/v1/tags' },
}

const webononePeer = {
  apiBaseUrl: 'http://127.0.0.1:4010',
  serviceApiKey: 'key',
}

const dataPeer = {
  apiBaseUrl: 'http://127.0.0.1:4015',
  serviceApiKey: 'data-key',
}

describe('HttpToolExecutor', () => {
  it('parks write tools until confirmed', async () => {
    const registry = new ToolRegistry([writeTool])
    const calls: string[] = []
    const executor = new HttpToolExecutor({
      registry,
      peers: { webonone: webononePeer },
      timeoutMs: 1000,
      fetchImpl: async (url) => {
        calls.push(String(url))
        return new Response(JSON.stringify({ id: 'x' }), { status: 201 })
      },
    })
    const ctx = {
      role: 'company_admin' as const,
      permissions: ['ai:catalog:write' as const],
      companyId: 'company00000000000001',
      accessToken: 'jwt',
    }
    const pending = await executor.execute(
      { id: 'call1', name: 'create_catalog_item', arguments: { kind: 'products', name: 'Rice' } },
      ctx,
    )
    assert.equal(calls.length, 0)
    assert.equal((pending.output as { status: string }).status, 'pending_confirmation')

    const confirmed = await executor.execute(
      { id: 'call1', name: 'create_catalog_item', arguments: { kind: 'products', name: 'Rice' } },
      ctx,
      { confirmed: true },
    )
    assert.equal(calls.length, 1)
    assert.match(calls[0], /\/api\/v1\/company\/me\/catalog\/products\/custom$/)
    assert.equal((confirmed.output as { status: string }).status, 'executed')
  })

  it('runs read tools immediately with the user JWT', async () => {
    const registry = new ToolRegistry([readTool])
    let auth = ''
    const executor = new HttpToolExecutor({
      registry,
      peers: { webonone: webononePeer },
      timeoutMs: 1000,
      fetchImpl: async (url, init) => {
        auth = String((init?.headers as Record<string, string> | undefined)?.Authorization ?? '')
        assert.match(String(url), /kind=products|\/products/)
        return new Response(JSON.stringify({ items: [] }), { status: 200 })
      },
    })
    const result = await executor.execute(
      { id: 'call2', name: 'search_company_catalog', arguments: { kind: 'products', q: 'rice' } },
      {
        role: 'company_admin',
        permissions: ['ai:catalog:read' as const],
        companyId: 'company00000000000001',
        accessToken: 'jwt-token',
      },
    )
    assert.equal(auth, 'Bearer jwt-token')
    assert.equal(result.ok, true)
  })

  it('confirms Data writes against the Data origin', async () => {
    const registry = new ToolRegistry([createUnit])
    const calls: string[] = []
    const executor = new HttpToolExecutor({
      registry,
      peers: { webonone: webononePeer, data: dataPeer },
      timeoutMs: 1000,
      fetchImpl: async (url) => {
        calls.push(String(url))
        return new Response(JSON.stringify({ id: 'unit00000000000000001' }), { status: 201 })
      },
    })
    const ctx = {
      role: 'super_admin' as const,
      permissions: ['ai:data_library:write' as const],
      companyId: null,
      accessToken: 'jwt',
    }
    const pending = await executor.execute(
      { id: 'call3', name: 'create_data_unit', arguments: { name: 'Metre', symbol: 'm' } },
      ctx,
    )
    assert.equal(calls.length, 0)
    assert.equal((pending.output as { status: string }).status, 'pending_confirmation')

    const confirmed = await executor.execute(
      { id: 'call3', name: 'create_data_unit', arguments: { name: 'Metre', symbol: 'm' } },
      ctx,
      { confirmed: true },
    )
    assert.equal(calls.length, 1)
    assert.equal(calls[0], 'http://127.0.0.1:4015/api/v1/units')
    assert.equal((confirmed.output as { status: string }).status, 'executed')
  })

  it('does not call Data when a write is left unconfirmed', async () => {
    const registry = new ToolRegistry([createUnit])
    let called = false
    const executor = new HttpToolExecutor({
      registry,
      peers: { data: dataPeer },
      timeoutMs: 1000,
      fetchImpl: async () => {
        called = true
        return new Response('{}', { status: 201 })
      },
    })
    await executor.execute(
      { id: 'call4', name: 'create_data_unit', arguments: { name: 'Metre', symbol: 'm' } },
      {
        role: 'super_admin',
        permissions: ['ai:data_library:write'],
        companyId: null,
        accessToken: 'jwt',
      },
    )
    assert.equal(called, false)
  })

  it('does not ask to confirm a create when required name is missing', async () => {
    const registry = new ToolRegistry([createItem])
    let called = false
    const executor = new HttpToolExecutor({
      registry,
      peers: { data: dataPeer },
      timeoutMs: 1000,
      fetchImpl: async () => {
        called = true
        return new Response('{}', { status: 201 })
      },
    })
    const pending = await executor.execute(
      { id: 'call-missing-name', name: 'create_item', arguments: {} },
      {
        role: 'company_admin',
        permissions: ['ai:data_library:write'],
        companyId: 'company00000000000001',
        accessToken: 'jwt',
      },
    )
    const output = pending.output as { code: string; missing: string[]; status?: string }
    assert.equal(pending.ok, false)
    assert.equal(output.code, 'MISSING_REQUIRED_ARGS')
    assert.equal(output.status, undefined)
    assert.equal(output.missing.includes('name'), true)
    assert.equal(output.missing.includes('description'), true)
    assert.equal(called, false)
  })

  it('fills missing color with a palette hex before confirm', async () => {
    const registry = new ToolRegistry([createItem])
    const executor = new HttpToolExecutor({
      registry,
      peers: { data: dataPeer },
      timeoutMs: 1000,
      fetchImpl: async () => new Response('{}', { status: 201 }),
    })
    const pending = await executor.execute(
      {
        id: 'call5',
        name: 'create_item',
        arguments: { name: 'Clinic', description: 'Medical facility tags for patient-care catalog items.' },
      },
      {
        role: 'company_admin',
        permissions: ['ai:data_library:write'],
        companyId: 'company00000000000001',
        accessToken: 'jwt',
      },
    )
    const output = pending.output as {
      status: string
      arguments: { name: string; description: string; color: string; status: string }
    }
    assert.equal(output.status, 'pending_confirmation')
    assert.equal(output.arguments.name, 'Clinic')
    assert.equal(['#059669', '#3366FF'].includes(output.arguments.color), true)
    assert.equal(output.arguments.status, 'pending')
  })

  it('forces company-admin status to pending even if the model sent verified', async () => {
    const registry = new ToolRegistry([createItem])
    const executor = new HttpToolExecutor({
      registry,
      peers: { data: dataPeer },
      timeoutMs: 1000,
      fetchImpl: async () => new Response('{}', { status: 201 }),
    })
    const pending = await executor.execute(
      {
        id: 'call6',
        name: 'create_item',
        arguments: {
          name: 'Clinic',
          description: 'Medical facility tags.',
          color: '#059669',
          status: 'verified',
          extra: 'drop-me',
        },
      },
      {
        role: 'company_admin',
        permissions: ['ai:data_library:write'],
        companyId: 'company00000000000001',
        accessToken: 'jwt',
      },
    )
    const args = (pending.output as { arguments: Record<string, unknown> }).arguments
    assert.equal(args.status, 'pending')
    assert.equal(args.color, '#059669')
    assert.equal(args.extra, undefined)
  })

  it('rejects unknown tools', async () => {
    const executor = new HttpToolExecutor({
      registry: new ToolRegistry([]),
      peers: { webonone: webononePeer },
      timeoutMs: 1000,
    })
    const result = await executor.execute(
      { id: 'x', name: 'nope', arguments: {} },
      { role: 'company_admin', permissions: [] as const, companyId: 'c', accessToken: 't' },
    )
    assert.equal(result.ok, false)
    assert.equal((result.output as { code: string }).code, 'UNKNOWN_TOOL')
  })

  it('looks up existing unique names via GET names=', async () => {
    const tool: ToolDefinition = {
      ...createItem,
      name: 'create_data_tag',
      argCompletion: {
        uniqueBy: 'name',
        uniqueLookup: { method: 'GET', path: '/api/v1/tags', queryParam: 'names' },
      },
    }
    const urls: string[] = []
    const executor = new HttpToolExecutor({
      registry: new ToolRegistry([tool]),
      peers: { data: dataPeer },
      timeoutMs: 1000,
      fetchImpl: async (url) => {
        urls.push(String(url))
        return new Response(
          JSON.stringify({ items: [{ name: 'Healthcare' }, { name: 'Medicine' }] }),
          { status: 200 },
        )
      },
    })
    const names = await executor.lookupExistingUniqueValues(
      tool,
      {
        role: 'company_admin',
        permissions: ['ai:data_library:write'],
        companyId: 'company00000000000001',
        accessToken: 'jwt',
      },
      ['Healthcare', 'FirstAid'],
    )
    assert.match(urls[0] ?? '', /\/api\/v1\/tags\?names=/)
    assert.deepEqual(names, ['Healthcare', 'Medicine'])
  })
})
