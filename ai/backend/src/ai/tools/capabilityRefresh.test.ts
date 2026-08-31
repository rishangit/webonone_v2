import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createCapabilityRefresher } from './capabilityRefresh.js'
import type { CapabilityPeer } from './discoverCapabilities.js'
import { ToolRegistry, type ToolDefinition } from './registry.js'

const baseTool = (name: string, service: ToolDefinition['service']): ToolDefinition => ({
  name,
  description: name,
  jsonSchema: { type: 'object', properties: {} },
  riskLevel: 'read',
  requiredRoles: ['member'],
  requiredPermissions: ['ai:chat'],
  service,
  auth: 'user_jwt',
  invoke: { method: 'GET', path: '/api/v1/units' },
  capabilityVersion: '1',
})

const peers: CapabilityPeer[] = [
  { service: 'webonone', apiBaseUrl: 'http://webonone', serviceApiKey: 'key' },
  { service: 'data', apiBaseUrl: 'http://data', serviceApiKey: 'key' },
]

describe('createCapabilityRefresher', () => {
  it('merges peer batches and keeps stale tools when a peer returns empty', async () => {
    const registry = new ToolRegistry([baseTool('register_company', 'webonone')])
    let webononeCalls = 0
    const refresher = createCapabilityRefresher(
      registry,
      () => peers,
      async (peer) => {
        if (peer.service === 'webonone') {
          webononeCalls += 1
          return webononeCalls === 1 ? [baseTool('register_company', 'webonone')] : []
        }
        return [baseTool('list_data_units', 'data')]
      },
    )

    await refresher.refreshCapabilities({ merge: true })
    assert.equal(registry.list().some((tool) => tool.name === 'register_company'), true)
    assert.equal(registry.list().some((tool) => tool.name === 'list_data_units'), true)

    await refresher.refreshCapabilities({ merge: true })
    assert.equal(registry.list().some((tool) => tool.name === 'register_company'), true)
    assert.equal(registry.list().some((tool) => tool.name === 'list_data_units'), true)
  })

  it('ensureReady loads missing configured services', async () => {
    const registry = new ToolRegistry()
    const refresher = createCapabilityRefresher(
      registry,
      () => peers,
      async (peer) =>
        peer.service === 'webonone'
          ? [baseTool('register_company', 'webonone')]
          : [baseTool('list_data_units', 'data')],
    )

    await refresher.ensureReady()
    assert.equal(registry.list().some((tool) => tool.name === 'register_company'), true)
  })
})

describe('ToolRegistry.mergeByService', () => {
  it('replaces only services that returned tools', () => {
    const registry = new ToolRegistry([
      baseTool('register_company', 'webonone'),
      baseTool('list_data_units', 'data'),
    ])
    registry.mergeByService([{ service: 'data', tools: [baseTool('create_data_unit', 'data')] }])
    const names = registry.list().map((tool) => tool.name)
    assert.deepEqual(names, ['register_company', 'create_data_unit'])
  })
})
