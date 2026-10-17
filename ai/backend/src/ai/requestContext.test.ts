import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { permissionsForRole } from './requestContext.js'

describe('permissionsForRole', () => {
  it('does not treat super_admin as a guest', () => {
    const perms = permissionsForRole('super_admin', null)
    assert.equal(perms.includes('ai:data_library:write'), true)
    assert.equal(perms.includes('ai:data_library:admin'), true)
    assert.equal(perms.includes('ai:company:admin'), true)
    assert.equal(perms.includes('ai:catalog:write'), false)
  })

  it('gives company_admin Data create and company write without a company session', () => {
    const perms = permissionsForRole('company_admin', null)
    assert.equal(perms.includes('ai:data_library:write'), true)
    assert.equal(perms.includes('ai:company:write'), true)
    assert.equal(perms.includes('ai:company:read'), true)
    assert.equal(perms.includes('ai:company:register'), true)
    assert.equal(perms.includes('ai:catalog:write'), false)
  })

  it('gives members company read and register without a company session', () => {
    const perms = permissionsForRole('member', null)
    assert.equal(perms.includes('ai:data_library:read'), true)
    assert.equal(perms.includes('ai:company:read'), true)
    assert.equal(perms.includes('ai:company:register'), true)
    assert.equal(perms.includes('ai:data_library:write'), false)
  })

  it('gives design form access only with a company session', () => {
    assert.equal(permissionsForRole('member', null).includes('ai:design:read'), false)
    assert.equal(permissionsForRole('company_admin', null).includes('ai:design:write'), false)
    assert.equal(permissionsForRole('super_admin', null).includes('ai:design:write'), false)
    assert.equal(permissionsForRole('member', 'company00000000000001').includes('ai:design:read'), true)
    assert.equal(permissionsForRole('member', 'company00000000000001').includes('ai:design:write'), false)
    const admin = permissionsForRole('company_admin', 'company00000000000001')
    assert.equal(admin.includes('ai:design:read'), true)
    assert.equal(admin.includes('ai:design:write'), true)
    const superAdmin = permissionsForRole('super_admin', 'company00000000000001')
    assert.equal(superAdmin.includes('ai:design:read'), true)
    assert.equal(superAdmin.includes('ai:design:write'), true)
  })

  it('gives super_admin company register and write', () => {
    const perms = permissionsForRole('super_admin', null)
    assert.equal(perms.includes('ai:company:register'), true)
    assert.equal(perms.includes('ai:company:write'), true)
    assert.equal(perms.includes('ai:company:admin'), true)
  })
})
