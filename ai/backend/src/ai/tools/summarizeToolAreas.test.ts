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

  it('groups design form tools and marks them as company-scoped', () => {
    const tools = [
      tool({
        name: 'list_design_forms',
        service: 'design',
        invoke: { method: 'GET', path: '/api/v1/forms' },
      }),
      tool({
        name: 'create_design_form',
        service: 'design',
        riskLevel: 'write',
        invoke: { method: 'POST', path: '/api/v1/forms' },
      }),
      tool({
        name: 'add_design_form_field',
        service: 'design',
        riskLevel: 'write',
        invoke: { method: 'POST', path: '/api/v1/forms/:id/fields' },
      }),
      tool({
        name: 'update_design_form_field',
        service: 'design',
        riskLevel: 'write',
        invoke: { method: 'PATCH', path: '/api/v1/forms/:id/fields/:fieldId' },
      }),
    ]
    const areas = summarizeToolAreas(tools)
    assert.equal(areas.length, 1)
    assert.equal(areas[0]?.id, 'design.forms')
    assert.equal(areas[0]?.requiresCompany, true)
    assert.deepEqual(areas[0]?.operations, ['list', 'create', 'update'])
  })

  it('groups website font tools separately from company pages', () => {
    const tools = [
      tool({
        name: 'create_design_font',
        service: 'design',
        riskLevel: 'write',
        invoke: { method: 'POST', path: '/api/v1/website/font-library' },
      }),
      tool({
        name: 'create_design_website_page',
        service: 'design',
        riskLevel: 'write',
        invoke: { method: 'POST', path: '/api/v1/website/pages' },
      }),
      tool({
        name: 'list_design_library_themes',
        service: 'design',
        invoke: { method: 'GET', path: '/api/v1/website/library/themes' },
      }),
    ]
    const areas = summarizeToolAreas(tools)
    assert.deepEqual(
      areas.map((area) => area.id),
      ['design.fonts', 'design.libraryThemes', 'design.websitePages'],
    )
    assert.equal(areas.find((area) => area.id === 'design.fonts')?.requiresCompany, false)
    assert.equal(areas.find((area) => area.id === 'design.websitePages')?.requiresCompany, true)
  })

  it('groups button and text library design tools', () => {
    const tools = [
      tool({
        name: 'update_design_button_library',
        service: 'design',
        riskLevel: 'write',
        invoke: { method: 'PATCH', path: '/api/v1/website/button-library/:id' },
      }),
      tool({
        name: 'get_design_text_library',
        service: 'design',
        invoke: { method: 'GET', path: '/api/v1/website/text-library/:id' },
      }),
    ]
    const areas = summarizeToolAreas(tools)
    assert.deepEqual(
      areas.map((area) => area.id),
      ['design.buttonLibrary', 'design.textLibrary'],
    )
    assert.equal(areas.find((area) => area.id === 'design.buttonLibrary')?.requiresCompany, false)
    assert.equal(areas.find((area) => area.id === 'design.textLibrary')?.requiresCompany, false)
  })
})
