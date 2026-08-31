import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { filterToolsForContext } from './filterTools.js'
import { permissionsForRole } from '../requestContext.js'
import type { ToolDefinition } from './registry.js'

const publicSearch: ToolDefinition = {
  name: 'search_public_catalog',
  description: 'search',
  jsonSchema: { type: 'object', properties: {} },
  riskLevel: 'read',
  requiredRoles: ['guest', 'member', 'company_admin', 'super_admin'],
  requiredPermissions: ['ai:public_catalog:read'],
  service: 'webonone',
  auth: 'service_key',
  invoke: { method: 'GET', path: '/api/v1/internal/catalog/search' },
  capabilityVersion: '1',
}

const readCatalog: ToolDefinition = {
  ...publicSearch,
  name: 'search_company_catalog',
  requiredRoles: ['member', 'company_admin'],
  requiredPermissions: ['ai:catalog:read'],
  auth: 'user_jwt',
  invoke: { method: 'GET', path: '/api/v1/company/me/catalog/:kind' },
}

const writeCatalog: ToolDefinition = {
  ...readCatalog,
  name: 'create_catalog_item',
  riskLevel: 'write',
  requiredRoles: ['company_admin'],
  requiredPermissions: ['ai:catalog:write'],
  invoke: { method: 'POST', path: '/api/v1/company/me/catalog/:kind/custom' },
}

const listUnits: ToolDefinition = {
  ...publicSearch,
  name: 'list_data_units',
  requiredRoles: ['member', 'company_admin', 'super_admin'],
  requiredPermissions: ['ai:data_library:read'],
  service: 'data',
  auth: 'user_jwt',
  invoke: { method: 'GET', path: '/api/v1/units' },
}

const createUnit: ToolDefinition = {
  ...listUnits,
  name: 'create_data_unit',
  riskLevel: 'write',
  requiredRoles: ['company_admin', 'super_admin'],
  requiredPermissions: ['ai:data_library:write'],
  invoke: { method: 'POST', path: '/api/v1/units' },
}

const deleteUnit: ToolDefinition = {
  ...listUnits,
  name: 'delete_data_unit',
  riskLevel: 'destructive',
  requiredRoles: ['super_admin'],
  requiredPermissions: ['ai:data_library:admin'],
  invoke: { method: 'DELETE', path: '/api/v1/units/:id' },
}

const approveCompany: ToolDefinition = {
  ...publicSearch,
  name: 'approve_company',
  riskLevel: 'write',
  requiredRoles: ['super_admin'],
  requiredPermissions: ['ai:company:admin'],
  auth: 'user_jwt',
  invoke: { method: 'POST', path: '/api/v1/company/admin/:id/approve' },
}

const listMyCompanies: ToolDefinition = {
  ...publicSearch,
  name: 'list_my_companies',
  requiredRoles: ['member', 'company_admin', 'super_admin'],
  requiredPermissions: ['ai:company:read'],
  auth: 'user_jwt',
  invoke: { method: 'GET', path: '/api/v1/company/me/companies' },
}

const registerCompany: ToolDefinition = {
  ...listMyCompanies,
  name: 'register_company',
  riskLevel: 'write',
  requiredPermissions: ['ai:company:register'],
  invoke: { method: 'POST', path: '/api/v1/company/register' },
}

const updateCompany: ToolDefinition = {
  ...listMyCompanies,
  name: 'update_company',
  riskLevel: 'write',
  requiredRoles: ['company_admin', 'super_admin'],
  requiredPermissions: ['ai:company:write'],
  invoke: { method: 'PATCH', path: '/api/v1/company/:id' },
}

const getMyCompany: ToolDefinition = {
  ...listMyCompanies,
  name: 'get_my_company',
  requiredRoles: ['member', 'company_admin'],
  invoke: { method: 'GET', path: '/api/v1/company/me' },
}

const allTools = [
  publicSearch,
  readCatalog,
  writeCatalog,
  listUnits,
  createUnit,
  deleteUnit,
  approveCompany,
  listMyCompanies,
  registerCompany,
  updateCompany,
  getMyCompany,
]

function namesFor(
  role: 'guest' | 'member' | 'company_admin' | 'super_admin',
  companyId: string | null,
) {
  return filterToolsForContext(allTools, {
    role,
    permissions: permissionsForRole(role, companyId),
    companyId,
  }).map((tool) => tool.name)
}

describe('filterToolsForContext', () => {
  it('gives guests only public search', () => {
    assert.deepEqual(namesFor('guest', null), ['search_public_catalog'])
  })

  it('lets members read the Data library and company registry tools without a company', () => {
    assert.deepEqual(namesFor('member', null), [
      'search_public_catalog',
      'list_data_units',
      'list_my_companies',
      'register_company',
    ])
  })

  it('hides company catalog writes when there is no company_id', () => {
    assert.deepEqual(namesFor('company_admin', null), [
      'search_public_catalog',
      'list_data_units',
      'create_data_unit',
      'list_my_companies',
      'register_company',
      'update_company',
    ])
  })

  it('lets company_admin write company catalog and create Data units, but not delete units', () => {
    assert.deepEqual(namesFor('company_admin', 'company00000000000001'), [
      'search_public_catalog',
      'search_company_catalog',
      'create_catalog_item',
      'list_data_units',
      'create_data_unit',
      'list_my_companies',
      'register_company',
      'update_company',
      'get_my_company',
    ])
  })

  it('lets super_admin manage Data library and approve companies without a company session', () => {
    assert.deepEqual(namesFor('super_admin', null), [
      'search_public_catalog',
      'list_data_units',
      'create_data_unit',
      'delete_data_unit',
      'approve_company',
      'list_my_companies',
      'register_company',
      'update_company',
    ])
  })

  it('hides get_my_company without an active company session', () => {
    const names = namesFor('company_admin', null)
    assert.equal(names.includes('get_my_company'), false)
    const withSession = namesFor('company_admin', 'company00000000000001')
    assert.equal(withSession.includes('get_my_company'), true)
  })

  it('does not give super_admin company catalog writes', () => {
    const names = namesFor('super_admin', 'company00000000000001')
    assert.equal(names.includes('create_catalog_item'), false)
    assert.equal(names.includes('search_company_catalog'), false)
  })
})
