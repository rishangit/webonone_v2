import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  CORE_NAV_VARIANT_SUPER_ADMIN,
  getCoreOriginFromReturnUrl,
  parsePlatformNavVariant,
  resolvePlatformNavUrls,
  toCoreNavQueryValue,
} from './coreNav.ts'

describe('coreNav', () => {
  it('parses core origin from return URL', () => {
    assert.equal(getCoreOriginFromReturnUrl('http://localhost:3000/'), 'http://localhost:3000')
    assert.equal(getCoreOriginFromReturnUrl('not-a-url'), null)
  })

  it('resolves main platform nav URLs', () => {
    const nav = resolvePlatformNavUrls('http://localhost:3000', 'main')
    assert.equal(nav[0]?.kind, 'item')
    if (nav[0]?.kind === 'item') {
      assert.equal(nav[0].href, 'http://localhost:3000/')
      assert.equal(nav[0].label, 'Home')
    }
  })

  it('resolves super admin nav with companies', () => {
    const nav = resolvePlatformNavUrls('http://localhost:3000', 'superAdmin')
    const companies = nav.find((item) => item.kind === 'item' && item.label === 'Companies')
    assert.ok(companies)
    if (companies?.kind === 'item') {
      assert.equal(companies.href, 'http://localhost:3000/companies')
    }
  })

  it('round-trips nav variant query values', () => {
    assert.equal(toCoreNavQueryValue('main'), 'main')
    assert.equal(toCoreNavQueryValue('superAdmin'), CORE_NAV_VARIANT_SUPER_ADMIN)
    assert.equal(parsePlatformNavVariant(CORE_NAV_VARIANT_SUPER_ADMIN), 'superAdmin')
    assert.equal(parsePlatformNavVariant(null), 'main')
  })
})
