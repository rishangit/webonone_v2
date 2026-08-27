import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  formatEntityContextSupplement,
  getToolNameForDataEntityKind,
  resolveEntityContext,
} from './resolveEntityContext.js'
import { ToolRegistry } from '../tools/registry.js'
import type { ToolCall, ToolExecutor, ToolResult } from '../tools/registry.js'
import type { DataEntityContextRef } from './types.js'

const productTool = {
  name: 'get_data_product',
  description: 'Get product',
  jsonSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  riskLevel: 'read' as const,
  requiredRoles: ['member' as const, 'company_admin' as const, 'super_admin' as const],
  requiredPermissions: ['ai:data_library:read'],
  service: 'data' as const,
  auth: 'user_jwt' as const,
  invoke: { method: 'GET' as const, path: '/api/v1/products/:id' },
  capabilityVersion: '1',
}

class FakeExecutor implements ToolExecutor {
  constructor(private readonly records: Record<string, Record<string, unknown>>) {}

  async execute(call: ToolCall): Promise<ToolResult> {
    const id = String(call.arguments.id ?? '')
    const record = this.records[id]
    if (!record) {
      return { toolCallId: call.id, name: call.name, ok: false, output: { code: 'NOT_FOUND' } }
    }
    return { toolCallId: call.id, name: call.name, ok: true, output: record }
  }
}

describe('getToolNameForDataEntityKind', () => {
  it('maps product to get_data_product', () => {
    assert.equal(getToolNameForDataEntityKind('product'), 'get_data_product')
  })
})

describe('resolveEntityContext', () => {
  const registry = new ToolRegistry([productTool])

  const ctx = {
    role: 'member' as const,
    permissions: ['ai:data_library:read'] as const,
    companyId: null,
    accessToken: 'token',
  }

  it('resolves a product record', async () => {
    const ref: DataEntityContextRef = {
      service: 'data',
      kind: 'product',
      id: 'qWKv4UmMr3SAbecPh1mom',
      label: 'Alveogyl',
    }
    const executor = new FakeExecutor({
      qWKv4UmMr3SAbecPh1mom: { id: 'qWKv4UmMr3SAbecPh1mom', name: 'Alveogyl', description: 'Paste' },
    })
    const resolved = await resolveEntityContext([ref], { registry, executor, ctx })
    assert.equal(resolved.length, 1)
    assert.equal(resolved[0]?.record?.name, 'Alveogyl')
    assert.equal(resolved[0]?.error, undefined)
  })

  it('returns error when lookup fails', async () => {
    const ref: DataEntityContextRef = {
      service: 'data',
      kind: 'product',
      id: 'qWKv4UmMr3SAbecPh1mom',
    }
    const executor = new FakeExecutor({})
    const resolved = await resolveEntityContext([ref], { registry, executor, ctx })
    assert.equal(resolved[0]?.error, 'NOT_FOUND')
    assert.equal(resolved[0]?.record, undefined)
  })
})

describe('formatEntityContextSupplement', () => {
  it('includes attached record json and related summary', () => {
    const text = formatEntityContextSupplement([
      {
        ref: { service: 'data', kind: 'product', id: 'qWKv4UmMr3SAbecPh1mom', label: 'Alveogyl' },
        record: {
          name: 'Alveogyl',
          tags: [{ name: 'Dental' }],
          attributes: [{ name: 'Net Weight' }],
        },
      },
    ])
    assert.match(text, /Attached Data library records/)
    assert.match(text, /Alveogyl/)
    assert.match(text, /"name": "Alveogyl"/)
    assert.match(text, /Current related: tags \(1\): Dental; attributes \(1\): Net Weight/)
    assert.match(text, /Update tool: update_data_product/)
    assert.match(text, /never prose-only suggestions/)
  })

  it('returns empty string for no refs', () => {
    assert.equal(formatEntityContextSupplement([]), '')
  })
})
