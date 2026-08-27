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

  it('confirms an attribute without posting a name mistaken for unit_id', async () => {
    const createAttribute: ToolDefinition = {
      ...createUnit,
      name: 'create_data_attribute',
      jsonSchema: {
        type: 'object',
        required: ['name', 'value_type', 'description'],
        properties: {
          name: { type: 'string' },
          value_type: { type: 'string', enum: ['number', 'text'] },
          description: { type: 'string' },
          unit_id: { type: 'string' },
          status: { type: 'string' },
        },
      },
      relatedArgs: [
        {
          argKey: 'unit_id',
          displayKey: 'unit',
          getPath: '/api/v1/units/:id',
          listPath: '/api/v1/units',
          createTool: 'create_data_unit',
        },
      ],
      invoke: { method: 'POST', path: '/api/v1/attributes' },
    }
    const bodies: string[] = []
    const executor = new HttpToolExecutor({
      registry: new ToolRegistry([createAttribute, createUnit]),
      peers: { data: dataPeer },
      timeoutMs: 1000,
      fetchImpl: async (url, init) => {
        bodies.push(`${String(init?.method ?? 'GET')} ${String(url)} ${String(init?.body ?? '')}`)
        if (String(url).includes('/api/v1/units')) {
          return new Response(JSON.stringify({ items: [] }), { status: 200 })
        }
        return new Response(JSON.stringify({ id: 'attr000000000000000001', name: 'LabResultGlucose' }), {
          status: 201,
        })
      },
    })
    const confirmed = await executor.execute(
      {
        id: 'call-attr',
        name: 'create_data_attribute',
        arguments: {
          name: 'LabResultGlucose',
          unit_id: 'LabResultGlucose',
          valueType: 'Number',
          description: 'Lab Result Glucose - Blood glucose concentration from laboratory testing.',
        },
      },
      {
        role: 'super_admin',
        permissions: ['ai:data_library:write'],
        companyId: null,
        accessToken: 'jwt',
      },
      { confirmed: true },
    )
    assert.equal(confirmed.ok, true)
    const post = bodies.find((line) => line.startsWith('POST http://127.0.0.1:4015/api/v1/attributes'))
    assert.ok(post)
    assert.match(post ?? '', /"value_type":"number"/)
    assert.equal(/"unit_id"/.test(post ?? ''), false)
  })

  it('creates a related unit and ignores status active', async () => {
    const unitTool: ToolDefinition = {
      ...createUnit,
      jsonSchema: {
        type: 'object',
        required: ['name', 'symbol', 'description'],
        properties: {
          name: { type: 'string' },
          symbol: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['verified', 'pending'] },
        },
      },
      argCompletion: { defaults: { status: 'pending' } },
    }
    const createAttribute: ToolDefinition = {
      ...unitTool,
      name: 'create_data_attribute',
      jsonSchema: {
        type: 'object',
        required: ['name', 'value_type', 'description'],
        properties: {
          name: { type: 'string' },
          value_type: { type: 'string', enum: ['number', 'text'] },
          description: { type: 'string' },
          unit_id: { type: 'string' },
          status: { type: 'string', enum: ['verified', 'pending'] },
        },
      },
      relatedArgs: [
        {
          argKey: 'unit_id',
          displayKey: 'unit',
          getPath: '/api/v1/units/:id',
          listPath: '/api/v1/units',
          createTool: 'create_data_unit',
        },
      ],
      invoke: { method: 'POST', path: '/api/v1/attributes' },
    }
    const unitId = 'unit00000000000000001'
    let unitCreated = false
    const posts: string[] = []
    const executor = new HttpToolExecutor({
      registry: new ToolRegistry([createAttribute, unitTool]),
      peers: { data: dataPeer },
      timeoutMs: 1000,
      fetchImpl: async (url, init) => {
        const method = String(init?.method ?? 'GET')
        const href = String(url)
        if (method === 'POST') {
          posts.push(`${href} ${String(init?.body ?? '')}`)
        }
        if (href.includes('/api/v1/units') && method === 'GET') {
          return new Response(
            JSON.stringify({
              items: unitCreated
                ? [{ id: unitId, name: 'Grams per deciliter', symbol: 'g/dL', status: 'pending' }]
                : [],
            }),
            { status: 200 },
          )
        }
        if (href.includes('/api/v1/units') && method === 'POST') {
          unitCreated = true
          return new Response(JSON.stringify({ id: unitId, name: 'Grams per deciliter', symbol: 'g/dL' }), {
            status: 201,
          })
        }
        return new Response(JSON.stringify({ id: 'attr000000000000000001', name: 'Hemoglobin Level' }), {
          status: 201,
        })
      },
    })
    const confirmed = await executor.execute(
      {
        id: 'call-hemoglobin',
        name: 'create_data_attribute',
        arguments: {
          name: 'Hemoglobin Level',
          value_type: 'number',
          description: 'Concentration of hemoglobin in blood',
          unit: { name: 'Grams per deciliter', symbol: 'g/dL', status: 'active' },
        },
      },
      {
        role: 'super_admin',
        permissions: ['ai:data_library:write'],
        companyId: null,
        accessToken: 'jwt',
      },
      { confirmed: true },
    )
    assert.equal(confirmed.ok, true)
    const unitPost = posts.find((line) => line.startsWith('http://127.0.0.1:4015/api/v1/units '))
    const attrPost = posts.find((line) => line.startsWith('http://127.0.0.1:4015/api/v1/attributes '))
    assert.ok(unitPost)
    assert.ok(attrPost)
    assert.equal(/"active"/.test(unitPost ?? ''), false)
    assert.match(unitPost ?? '', /"status":"pending"/)
    assert.match(attrPost ?? '', /"unit_id":"unit00000000000000001"/)
  })

  it('reuses a tag created by an earlier confirm when the second product still has a stale tree', async () => {
    const createTag: ToolDefinition = {
      ...createItem,
      name: 'create_data_tag',
      invoke: { method: 'POST', path: '/api/v1/tags' },
      argCompletion: {
        allowedKeys: ['name', 'description', 'color', 'status'],
        defaults: { status: 'pending' },
        uniqueBy: 'name',
        uniqueLookup: { method: 'GET', path: '/api/v1/tags', queryParam: 'names' },
      },
    }
    const createProduct: ToolDefinition = {
      ...createUnit,
      name: 'create_data_product',
      requiredPermissions: ['ai:data_catalog:write'],
      jsonSchema: {
        type: 'object',
        required: ['name', 'description'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          tag_ids: { type: 'array', items: { type: 'string' } },
          tags: {
            type: 'array',
            items: {
              type: 'object',
              properties: { name: { type: 'string' }, description: { type: 'string' } },
            },
          },
        },
      },
      relatedArgs: [
        {
          argKey: 'tag_ids',
          displayKey: 'tags',
          cardinality: 'many',
          getPath: '/api/v1/tags/:id',
          listPath: '/api/v1/tags',
          createTool: 'create_data_tag',
        },
      ],
      invoke: { method: 'POST', path: '/api/v1/products' },
      argCompletion: {
        uniqueBy: 'name',
        uniqueLookup: { method: 'GET', path: '/api/v1/products', queryParam: 'names' },
      },
    }
    const tagId = 'tag000000000000000001'
    let tagCreated = false
    const posts: string[] = []
    const staleTagTree = [
      {
        path: 'tags/0',
        displayKey: 'tags',
        exists: false,
        selected: true,
        record: { name: 'PreventiveCare', description: 'Preventive Care' },
        createTool: 'create_data_tag',
        createArgs: {
          name: 'PreventiveCare',
          description: 'Preventive Care - Suggested related record.',
          status: 'pending',
          color: '#3366FF',
        },
      },
    ]
    const executor = new HttpToolExecutor({
      registry: new ToolRegistry([createProduct, createTag]),
      peers: { data: dataPeer },
      timeoutMs: 1000,
      fetchImpl: async (url, init) => {
        const method = String(init?.method ?? 'GET')
        const href = String(url)
        if (method === 'POST') {
          posts.push(`${method} ${href} ${String(init?.body ?? '')}`)
        }
        if (href.includes('/api/v1/tags') && method === 'GET') {
          return new Response(
            JSON.stringify({
              items: tagCreated
                ? [{ id: tagId, name: 'PreventiveCare', description: 'Preventive Care', status: 'pending' }]
                : [],
            }),
            { status: 200 },
          )
        }
        if (href.includes('/api/v1/tags') && method === 'POST') {
          tagCreated = true
          return new Response(JSON.stringify({ id: tagId, name: 'PreventiveCare' }), { status: 201 })
        }
        if (href.includes('/api/v1/products') && method === 'POST') {
          return new Response(JSON.stringify({ id: 'prod00000000000000001', name: 'Product' }), { status: 201 })
        }
        return new Response(JSON.stringify({ items: [] }), { status: 200 })
      },
    })
    const ctx = {
      role: 'super_admin' as const,
      permissions: ['ai:data_library:write', 'ai:data_catalog:write'] as const,
      companyId: null,
      accessToken: 'jwt',
    }
    const first = await executor.execute(
      {
        id: 'call-product-1',
        name: 'create_data_product',
        arguments: {
          name: 'Fluoride Varnish',
          description: 'A high-concentration fluoride used to prevent dental caries.',
          tags: [{ name: 'PreventiveCare' }],
        },
      },
      ctx,
      { confirmed: true, relatedTree: staleTagTree },
    )
    assert.equal(first.ok, true)
    const tagPostsAfterFirst = posts.filter((line) => line.includes('/api/v1/tags') && line.startsWith('POST'))
    assert.equal(tagPostsAfterFirst.length, 1)

    const second = await executor.execute(
      {
        id: 'call-product-2',
        name: 'create_data_product',
        arguments: {
          name: 'Dental Sealant',
          description: 'Protective coating applied to teeth.',
          tags: [{ name: 'PreventiveCare' }],
        },
      },
      ctx,
      { confirmed: true, relatedTree: staleTagTree },
    )
    assert.equal(second.ok, true)
    const tagPostsAfterSecond = posts.filter((line) => line.includes('/api/v1/tags') && line.startsWith('POST'))
    assert.equal(tagPostsAfterSecond.length, 1)
    const productPosts = posts.filter((line) => line.includes('/api/v1/products') && line.startsWith('POST'))
    assert.equal(productPosts.length, 2)
    assert.match(productPosts[1] ?? '', /"tag_ids":\["tag000000000000000001"\]/)
  })

  it('merges existing catalog attributes on confirmed update', async () => {
    const productId = 'qWKv4UmMr3SAbecPh1mom'
    const existingAttrId = 'attrExisting0000000001'
    const newAttrId = 'attrNew00000000000001'
    let patchBody = ''
    const getProduct: ToolDefinition = {
      ...createUnit,
      name: 'get_data_product',
      riskLevel: 'read',
      requiredRoles: ['member', 'company_admin', 'super_admin'],
      requiredPermissions: ['ai:data_library:read'],
      jsonSchema: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
      invoke: { method: 'GET', path: '/api/v1/products/:id' },
    }
    const updateProduct: ToolDefinition = {
      ...createUnit,
      name: 'update_data_product',
      requiredPermissions: ['ai:data_catalog:write'],
      jsonSchema: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
          attributes: {
            type: 'array',
            items: {
              type: 'object',
              properties: { attribute_id: { type: 'string' } },
            },
          },
        },
      },
      invoke: { method: 'PATCH', path: '/api/v1/products/:id' },
    }
    const executor = new HttpToolExecutor({
      registry: new ToolRegistry([getProduct, updateProduct]),
      peers: { data: dataPeer },
      timeoutMs: 1000,
      fetchImpl: async (url, init) => {
        const href = String(url)
        const method = String(init?.method ?? 'GET')
        if (method === 'GET' && href.includes(`/api/v1/products/${productId}`)) {
          return new Response(
            JSON.stringify({
              id: productId,
              name: 'Alveogyl',
              attributes: [{ id: existingAttrId, name: 'Net Weight' }],
            }),
            { status: 200 },
          )
        }
        if (method === 'PATCH' && href.includes(`/api/v1/products/${productId}`)) {
          patchBody = String(init?.body ?? '')
          return new Response(JSON.stringify({ id: productId }), { status: 200 })
        }
        return new Response(JSON.stringify({}), { status: 404 })
      },
    })
    const confirmed = await executor.execute(
      {
        id: 'call-update-product',
        name: 'update_data_product',
        arguments: {
          id: productId,
          attributes: [{ attribute_id: newAttrId }],
        },
      },
      {
        role: 'company_admin',
        permissions: ['ai:data_catalog:write', 'ai:data_library:read'],
        companyId: 'company0000000000001',
        accessToken: 'jwt',
      },
      { confirmed: true },
    )
    assert.equal(confirmed.ok, true)
    assert.match(patchBody, new RegExp(existingAttrId))
    assert.match(patchBody, new RegExp(newAttrId))
  })

  it('rejects id-only update tool calls before confirm', async () => {
    const updateAttribute: ToolDefinition = {
      ...createUnit,
      name: 'update_data_attribute',
      requiredPermissions: ['ai:data_library:write'],
      jsonSchema: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
          unit_id: { type: 'string' },
        },
      },
      invoke: { method: 'PATCH', path: '/api/v1/attributes/:id' },
    }
    const executor = new HttpToolExecutor({
      registry: new ToolRegistry([updateAttribute]),
      peers: { data: dataPeer },
      timeoutMs: 1000,
      fetchImpl: async () => new Response(JSON.stringify({ id: 'x' }), { status: 200 }),
    })
    const result = await executor.execute(
      { id: 'call-update', name: 'update_data_attribute', arguments: { id: 'attr00000000000000001' } },
      {
        role: 'company_admin',
        permissions: ['ai:data_library:write'],
        companyId: 'company0000000000001',
        accessToken: 'jwt',
      },
    )
    assert.equal(result.ok, false)
    assert.equal((result.output as { code?: string }).code, 'MISSING_REQUIRED_ARGS')
  })

  it('confirms update_data_space with existing related tags from the library', async () => {
    const spaceId = 'space00000000000000001'
    const tagId = 'tag000000000000000001'
    let patchBody = ''
    const tagRelatedArgs: ToolDefinition['relatedArgs'] = [
      {
        argKey: 'tag_ids',
        displayKey: 'tags',
        cardinality: 'many',
        getPath: '/api/v1/tags/:id',
        listPath: '/api/v1/tags',
        createTool: 'create_data_tag',
      },
    ]
    const getSpace: ToolDefinition = {
      ...createUnit,
      name: 'get_data_space',
      riskLevel: 'read',
      requiredRoles: ['member', 'company_admin', 'super_admin'],
      requiredPermissions: ['ai:data_library:read'],
      jsonSchema: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
      invoke: { method: 'GET', path: '/api/v1/spaces/:id' },
      relatedArgs: undefined,
    }
    const updateSpace: ToolDefinition = {
      ...createUnit,
      name: 'update_data_space',
      requiredPermissions: ['ai:data_catalog:write'],
      jsonSchema: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
          tag_ids: { type: 'array', items: { type: 'string' } },
          tags: { type: 'array', items: { type: 'object' } },
        },
      },
      invoke: { method: 'PATCH', path: '/api/v1/spaces/:id' },
      relatedArgs: tagRelatedArgs,
    }
    const executor = new HttpToolExecutor({
      registry: new ToolRegistry([getSpace, updateSpace]),
      peers: { data: dataPeer },
      timeoutMs: 1000,
      fetchImpl: async (url, init) => {
        const href = String(url)
        const method = String(init?.method ?? 'GET')
        if (method === 'GET' && href.includes(`/api/v1/spaces/${spaceId}`)) {
          return new Response(
            JSON.stringify({
              id: spaceId,
              name: 'Treatment Room',
              tags: [],
            }),
            { status: 200 },
          )
        }
        if (method === 'GET' && href.includes('/api/v1/tags?names=')) {
          return new Response(
            JSON.stringify({
              items: [{ id: tagId, name: 'DentalCare', description: 'Dental Care - General healthcare services.' }],
            }),
            { status: 200 },
          )
        }
        if (method === 'PATCH' && href.includes(`/api/v1/spaces/${spaceId}`)) {
          patchBody = String(init?.body ?? '')
          return new Response(JSON.stringify({ id: spaceId }), { status: 200 })
        }
        return new Response(JSON.stringify({}), { status: 404 })
      },
    })
    const confirmed = await executor.execute(
      {
        id: 'call-update-space',
        name: 'update_data_space',
        arguments: { id: spaceId },
      },
      {
        role: 'company_admin',
        permissions: ['ai:data_catalog:write', 'ai:data_library:read'],
        companyId: 'company0000000000001',
        accessToken: 'jwt',
      },
      {
        confirmed: true,
        relatedTree: [
          {
            path: 'tags/0',
            displayKey: 'tags',
            exists: false,
            selected: true,
            record: {
              name: 'DentalCare',
              description: 'Dental Care - General healthcare services for maintaining oral hygiene and health.',
              status: 'pending',
              color: '#C026D3',
            },
            createTool: 'create_data_tag',
            createArgs: {
              name: 'DentalCare',
              description: 'Dental Care - General healthcare services for maintaining oral hygiene and health.',
              status: 'pending',
              color: '#C026D3',
            },
          },
        ],
      },
    )
    assert.equal(confirmed.ok, true)
    assert.match(patchBody, new RegExp(tagId))
  })

  it('parks duration services without duration_minutes until confirm validation', async () => {
    const createService: ToolDefinition = {
      ...createUnit,
      name: 'create_data_service',
      requiredPermissions: ['ai:data_catalog:write'],
      jsonSchema: {
        type: 'object',
        required: ['name', 'description', 'time_mode'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          time_mode: { type: 'string', enum: ['duration', 'window'] },
          duration_minutes: { type: 'integer' },
        },
        allOf: [
          {
            if: { properties: { time_mode: { const: 'duration' } } },
            then: { required: ['duration_minutes'] },
          },
        ],
      },
      invoke: { method: 'POST', path: '/api/v1/services' },
    }
    let postedBody = ''
    const executor = new HttpToolExecutor({
      registry: new ToolRegistry([createService]),
      peers: { data: dataPeer },
      timeoutMs: 1000,
      fetchImpl: async (_url, init) => {
        postedBody = String(init?.body ?? '')
        return new Response(JSON.stringify({ id: 'svc00000000000000001' }), { status: 201 })
      },
    })
    const pending = await executor.execute(
      {
        id: 'call-service',
        name: 'create_data_service',
        arguments: {
          name: 'Dental Checkup and Cleaning',
          description: 'Routine dental examination and cleaning.',
          time_mode: 'duration',
        },
      },
      {
        role: 'company_admin',
        permissions: ['ai:data_catalog:write'],
        companyId: 'company0000000000001',
        accessToken: 'jwt',
      },
    )
    assert.equal(pending.ok, true)
    assert.equal((pending.output as { status?: string }).status, 'pending_confirmation')

    const blocked = await executor.execute(
      {
        id: 'call-service',
        name: 'create_data_service',
        arguments: {
          name: 'Dental Checkup and Cleaning',
          description: 'Routine dental examination and cleaning.',
          time_mode: 'duration',
        },
      },
      {
        role: 'company_admin',
        permissions: ['ai:data_catalog:write'],
        companyId: 'company0000000000001',
        accessToken: 'jwt',
      },
      { confirmed: true },
    )
    assert.equal(blocked.ok, false)
    assert.equal((blocked.output as { code?: string }).code, 'MISSING_REQUIRED_ARGS')
    assert.equal((blocked.output as { missing?: string[] }).missing?.includes('duration_minutes'), true)

    const confirmed = await executor.execute(
      {
        id: 'call-service',
        name: 'create_data_service',
        arguments: {
          name: 'Dental Checkup and Cleaning',
          description: 'Routine dental examination and cleaning.',
          time_mode: 'duration',
        },
      },
      {
        role: 'company_admin',
        permissions: ['ai:data_catalog:write'],
        companyId: 'company0000000000001',
        accessToken: 'jwt',
      },
      { confirmed: true, argumentOverrides: { duration_minutes: 60 } },
    )
    assert.equal(confirmed.ok, true)
    assert.equal((confirmed.output as { status?: string }).status, 'executed')
    assert.match(postedBody, /"duration_minutes":60/)
  })
})
