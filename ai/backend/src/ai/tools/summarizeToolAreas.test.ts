import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { summarizeToolAreas } from './summarizeToolAreas.js'
import type { ToolDefinition } from './registry.js'

function tool(partial: Partial<ToolDefinition> & Pick<ToolDefinition, 'name' | 'invoke'>): ToolDefinition {
  return {
    description: 'test',
    jsonSchema: { type: 'object', properties: {} },
    riskLevel: 'read',
    requiredRoles: ['member'],
    requiredPermissions: ['ai:chat'],
    service: 'webonone',
    auth: 'user_jwt',
    capabilityVersion: '1',
    ...partial,
  }
}

describe('summarizeToolAreas', () => {
  it('groups data library tools by resource and collects CRUD operations', () => {
    const tools = [
      tool({
        name: 'list_data_tags',
        service: 'data',
        invoke: { method: 'GET', path: '/api/v1/tags' },
      }),
      tool({
        name: 'create_data_tag',
        service: 'data',
        riskLevel: 'write',
        invoke: { method: 'POST', path: '/api/v1/tags' },
      }),
      tool({
        name: 'delete_data_tag',
        service: 'data',
        riskLevel: 'destructive',
        invoke: { method: 'DELETE', path: '/api/v1/tags/:id' },
      }),
    ]

    const areas = summarizeToolAreas(tools)
    assert.equal(areas.length, 1)
    assert.equal(areas[0]?.id, 'data.tags')
    assert.deepEqual(areas[0]?.operations, ['list', 'create', 'delete'])
  })

  it('marks company-session tools as requiresCompany', () => {
    const tools = [
      tool({
        name: 'search_company_catalog',
        invoke: { method: 'GET', path: '/api/v1/company/me/catalog/:kind' },
      }),
      tool({
        name: 'search_public_catalog',
        invoke: { method: 'GET', path: '/api/v1/internal/catalog/search' },
      }),
    ]

    const areas = summarizeToolAreas(tools)
    const companyCatalog = areas.find((area) => area.id === 'webonone.companyCatalog')
    const publicCatalog = areas.find((area) => area.id === 'webonone.publicCatalog')
    assert.equal(companyCatalog?.requiresCompany, true)
    assert.equal(publicCatalog?.requiresCompany, false)
  })
})
