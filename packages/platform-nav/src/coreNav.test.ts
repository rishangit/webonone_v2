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
    assert.equal(getCoreOriginFromReturnUrl('http://localhost:3010/'), 'http://localhost:3010')
    assert.equal(getCoreOriginFromReturnUrl('not-a-url'), null)
  })

  it('resolves main platform nav URLs', () => {
    const nav = resolvePlatformNavUrls('http://localhost:3010', 'main')
    assert.equal(nav[0]?.kind, 'item')
    if (nav[0]?.kind === 'item') {
      assert.equal(nav[0].href, 'http://localhost:3010/')
      assert.equal(nav[0].label, 'Home')
    }
  })

  it('resolves super admin nav with companies', () => {
    const nav = resolvePlatformNavUrls('http://localhost:3010', 'superAdmin')
    const companies = nav.find((item) => item.kind === 'item' && item.label === 'Companies')
    assert.ok(companies)
    if (companies?.kind === 'item') {
      assert.equal(companies.href, 'http://localhost:3010/companies')
    }
  })

  it('resolves email sub-nav URLs with external paths', () => {
    const nav = resolvePlatformNavUrls('http://localhost:3010', 'main', {
      email: 'http://localhost:3014',
    })
    const emailGroup = nav.find((item) => item.kind === 'group' && item.label === 'Email')
    assert.ok(emailGroup?.kind === 'group')
    if (emailGroup?.kind === 'group') {
      assert.equal(emailGroup.children.length, 2)
      assert.equal(emailGroup.children[0]?.href, 'http://localhost:3014/history')
      assert.equal(emailGroup.children[1]?.href, 'http://localhost:3014/templates')
    }
  })

  it('round-trips nav variant query values', () => {
    assert.equal(toCoreNavQueryValue('main'), 'company_admin')
    assert.equal(toCoreNavQueryValue('member'), 'member')
    assert.equal(toCoreNavQueryValue('superAdmin'), CORE_NAV_VARIANT_SUPER_ADMIN)
    assert.equal(parsePlatformNavVariant(CORE_NAV_VARIANT_SUPER_ADMIN), 'superAdmin')
    assert.equal(parsePlatformNavVariant('member'), 'member')
    assert.equal(parsePlatformNavVariant(null), 'main')
  })

  it('member nav omits Email group', () => {
    const nav = resolvePlatformNavUrls('http://localhost:3010', 'member')
    const emailGroup = nav.find((item) => item.kind === 'group' && item.label === 'Email')
    assert.equal(emailGroup, undefined)
  })
})
