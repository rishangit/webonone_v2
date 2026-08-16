import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isAllowedInvokePath } from './invokePath.js'

describe('isAllowedInvokePath', () => {
  it('allows Data library resource paths', () => {
    assert.equal(isAllowedInvokePath('data', '/api/v1/units'), true)
    assert.equal(isAllowedInvokePath('data', '/api/v1/units/:id'), true)
    assert.equal(isAllowedInvokePath('data', '/api/v1/tags'), true)
    assert.equal(isAllowedInvokePath('data', '/api/v1/products/:id'), true)
  })

  it('allows WebOnOne admin company paths', () => {
    assert.equal(isAllowedInvokePath('webonone', '/api/v1/company/admin/:id/approve'), true)
    assert.equal(isAllowedInvokePath('webonone', '/api/v1/company/me/catalog/:kind/link'), true)
  })

  it('rejects unpublished services and nested Data paths', () => {
    assert.equal(isAllowedInvokePath('email', '/api/v1/templates'), false)
    assert.equal(isAllowedInvokePath('data', '/api/v1/products/:id/variants'), false)
    assert.equal(isAllowedInvokePath('webonone', '/api/v1/internal/ai/capabilities'), false)
  })
})
