import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { discoverAllCapabilities, parseTool } from './discoverCapabilities.js'

const webononeTool = {
  name: 'search_public_catalog',
  description: 'search',
  jsonSchema: { type: 'object', properties: {} },
  riskLevel: 'read',
  requiredRoles: ['guest'],
  requiredPermissions: ['ai:public_catalog:read'],
  service: 'webonone',
  auth: 'service_key',
  invoke: { method: 'GET', path: '/api/v1/internal/catalog/search' },
  capabilityVersion: '1',
}

const dataTool = {
  name: 'list_data_units',
  description: 'list units',
  jsonSchema: { type: 'object', properties: {} },
  riskLevel: 'read',
  requiredRoles: ['super_admin'],
  requiredPermissions: ['ai:data_library:read'],
  service: 'data',
  auth: 'user_jwt',
  invoke: { method: 'GET', path: '/api/v1/units' },
  capabilityVersion: '1',
}

describe('discoverAllCapabilities', () => {
  it('merges WebOnOne and Data tools', async () => {
    const tools = await discoverAllCapabilities(
      [
        { service: 'webonone', apiBaseUrl: 'http://127.0.0.1:4010', serviceApiKey: 'w-key' },
        { service: 'data', apiBaseUrl: 'http://127.0.0.1:4015', serviceApiKey: 'd-key' },
      ],
      {
        fetchImpl: async (url, init) => {
          const headers = init?.headers as Record<string, string>
          if (String(url).includes(':4010')) {
            assert.equal(headers['X-WebOnOne-Service-Key'], 'w-key')
            return new Response(JSON.stringify({ service: 'webonone', tools: [webononeTool] }))
          }
          assert.equal(headers['X-Data-Service-Key'], 'd-key')
          return new Response(JSON.stringify({ service: 'data', tools: [dataTool] }))
        },
      },
    )
    assert.deepEqual(
      tools.map((tool) => tool.name),
      ['search_public_catalog', 'list_data_units'],
    )
  })

  it('keeps WebOnOne tools when Data is down', async () => {
    const tools = await discoverAllCapabilities(
      [
        { service: 'webonone', apiBaseUrl: 'http://127.0.0.1:4010', serviceApiKey: 'w-key' },
        { service: 'data', apiBaseUrl: 'http://127.0.0.1:4015', serviceApiKey: 'd-key' },
      ],
      {
        fetchImpl: async (url) => {
          if (String(url).includes(':4015')) {
            throw new Error('down')
          }
          return new Response(JSON.stringify({ service: 'webonone', tools: [webononeTool] }))
        },
      },
    )
    assert.deepEqual(
      tools.map((tool) => tool.name),
      ['search_public_catalog'],
    )
  })

  it('rejects unknown service ids', () => {
    assert.equal(parseTool({ ...dataTool, service: 'media' }), null)
  })

  it('keeps argCompletion from the owning service', () => {
    const parsed = parseTool({
      ...dataTool,
      name: 'create_data_tag',
      riskLevel: 'write',
      invoke: { method: 'POST', path: '/api/v1/tags' },
      argCompletion: {
        allowedKeys: ['name', 'description', 'color', 'status'],
        defaults: { status: 'pending' },
        forceByRole: { company_admin: { status: 'pending' } },
        uniqueBy: 'name',
        uniqueLookup: { method: 'GET', path: '/api/v1/tags', queryParam: 'names' },
        pascalCaseKeys: ['name'],
      },
    })
    assert.deepEqual(parsed?.argCompletion, {
      allowedKeys: ['name', 'description', 'color', 'status'],
      defaults: { status: 'pending' },
      forceByRole: { company_admin: { status: 'pending' } },
      uniqueBy: 'name',
      uniqueLookup: { method: 'GET', path: '/api/v1/tags', queryParam: 'names' },
      pascalCaseKeys: ['name'],
    })
  })

  it('keeps viewPath from the owning service', () => {
    const parsed = parseTool({
      ...dataTool,
      name: 'get_data_service',
      invoke: { method: 'GET', path: '/api/v1/services/:id' },
      viewPath: '/services/{id}',
    })
    assert.equal(parsed?.viewPath, '/services/{id}')
  })
})
