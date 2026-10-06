import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  balanceCacheKey,
  resolveBalanceScope,
} from './providerBalance.service.js'

describe('resolveBalanceScope', () => {
  it('maps super_admin to platform scope', () => {
    assert.deepEqual(resolveBalanceScope({ role: 'super_admin', companyId: 'c1' }), {
      ok: true,
      scope: 'platform',
      companyId: null,
    })
  })

  it('maps company_admin to JWT company only', () => {
    assert.deepEqual(resolveBalanceScope({ role: 'company_admin', companyId: 'co_abc' }), {
      ok: true,
      scope: 'company',
      companyId: 'co_abc',
    })
  })

  it('rejects company_admin without company', () => {
    const result = resolveBalanceScope({ role: 'company_admin', companyId: null })
    assert.equal(result.ok, false)
    if (!result.ok) assert.equal(result.status, 400)
  })

  it('forbids members', () => {
    const result = resolveBalanceScope({ role: 'member', companyId: 'co_abc' })
    assert.equal(result.ok, false)
    if (!result.ok) assert.equal(result.status, 403)
  })
})

describe('balanceCacheKey', () => {
  it('isolates company and platform cache keys', () => {
    assert.equal(balanceCacheKey('platform', null), 'platform:platform')
    assert.equal(balanceCacheKey('company', 'co_a'), 'company:co_a')
    assert.notEqual(balanceCacheKey('company', 'co_a'), balanceCacheKey('company', 'co_b'))
    assert.notEqual(balanceCacheKey('company', 'co_a'), balanceCacheKey('platform', null))
  })
})
