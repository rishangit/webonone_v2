import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  CORE_NAV_VARIANT_SUPER_ADMIN,
  DATA_NAV_SENTINELS,
  dataEntityKeyFromSentinel,
  dataSentinelToExternalPath,
  EMAIL_NAV_SENTINELS,
  emailSentinelToExternalPath,
  filterCompanyDataEntities,
  filterPlatformNavDataEntities,
  getCoreOriginFromReturnUrl,
  getPlatformNavDefs,
  IDENTITY_NAV_SENTINELS,
  identitySentinelToExternalPath,
  isIdentityNavSentinel,
  isDataNavSentinel,
  isEmailNavSentinel,
  isSmsNavSentinel,
  parsePlatformNavVariant,
  resolvePlatformNavUrls,
  SMS_NAV_SENTINELS,
  smsSentinelToExternalPath,
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

  it('includes Calendar group with Schedule and Events on main and member nav', () => {
    for (const variant of ['main', 'member'] as const) {
      const defs = getPlatformNavDefs(variant)
      const calendar = defs.find((item) => item.kind === 'group' && item.label === 'Calendar')
      assert.ok(calendar?.kind === 'group', `Calendar missing for ${variant}`)
      if (calendar?.kind === 'group') {
        assert.deepEqual(
          calendar.children.map((child) => ({ path: child.path, label: child.label })),
          [
            { path: '/calendar/schedule', label: 'Schedule' },
            { path: '/calendar/events', label: 'Events' },
          ],
        )
      }
      assert.equal(defs[1]?.kind === 'group' && defs[1].label === 'Calendar', true)
    }

    const superAdmin = getPlatformNavDefs('superAdmin')
    const found = superAdmin.find((item) => item.kind === 'group' && item.label === 'Calendar')
    assert.equal(found, undefined, 'Calendar should not appear on superAdmin')
  })

  it('resolves super admin nav with companies', () => {
    const nav = resolvePlatformNavUrls('http://localhost:3010', 'superAdmin')
    const companies = nav.find((item) => item.kind === 'item' && item.label === 'Companies')
    assert.ok(companies)
    if (companies?.kind === 'item') {
      assert.equal(companies.href, 'http://localhost:3010/companies')
    }
  })

  it('includes My Companies first under Settings for member, main, and superAdmin', () => {
    for (const variant of ['member', 'main', 'superAdmin'] as const) {
      const nav = resolvePlatformNavUrls('http://localhost:3010', variant)
      const settings = nav.find((item) => item.kind === 'group' && item.label === 'Settings')
      assert.ok(settings?.kind === 'group', `Settings missing for ${variant}`)
      if (settings?.kind === 'group') {
        assert.equal(settings.children[0]?.label, 'My Companies')
        assert.equal(settings.children[0]?.href, 'http://localhost:3010/settings/companies')
        assert.equal(settings.children[1]?.label, 'Basic Settings')
        assert.equal(settings.children[2]?.label, 'System Theme')
      }
    }
  })

  it('resolves email sub-nav URLs with external paths', () => {
    const nav = resolvePlatformNavUrls('http://localhost:3010', 'main', {
      email: 'http://localhost:3014',
    })
    const emailGroup = nav.find((item) => item.kind === 'group' && item.label === 'Email')
    assert.ok(emailGroup?.kind === 'group')
    if (emailGroup?.kind === 'group') {
      assert.equal(emailGroup.children.length, 4)
      assert.equal(emailGroup.children[0]?.href, 'http://localhost:3014/send')
      assert.equal(emailGroup.children[0]?.label, 'Send Email')
      assert.equal(emailGroup.children[1]?.href, 'http://localhost:3014/queue')
      assert.equal(emailGroup.children[1]?.label, 'Queue')
      assert.equal(emailGroup.children[2]?.href, 'http://localhost:3014/history')
      assert.equal(emailGroup.children[3]?.href, 'http://localhost:3014/templates')
    }
  })

  it('maps Email sentinels to external paths', () => {
    assert.equal(isEmailNavSentinel(EMAIL_NAV_SENTINELS.send), true)
    assert.equal(isEmailNavSentinel(EMAIL_NAV_SENTINELS.queue), true)
    assert.equal(isEmailNavSentinel(`${EMAIL_NAV_SENTINELS.templates}/tmpl_1`), true)
    assert.equal(isEmailNavSentinel(`${EMAIL_NAV_SENTINELS.templates}/tmpl_1/preview`), true)
    assert.equal(isEmailNavSentinel('/sms/send'), false)
    assert.equal(emailSentinelToExternalPath(EMAIL_NAV_SENTINELS.send), '/send')
    assert.equal(emailSentinelToExternalPath(EMAIL_NAV_SENTINELS.queue), '/queue')
    assert.equal(emailSentinelToExternalPath(EMAIL_NAV_SENTINELS.history), '/history')
    assert.equal(emailSentinelToExternalPath(EMAIL_NAV_SENTINELS.templates), '/templates')
    assert.equal(
      emailSentinelToExternalPath(`${EMAIL_NAV_SENTINELS.templates}/tmpl_1`),
      '/templates/tmpl_1',
    )
    assert.equal(emailSentinelToExternalPath('/unknown'), null)
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

  it('resolves SMS sub-nav URLs with external paths', () => {
    const nav = resolvePlatformNavUrls('http://localhost:3010', 'main', {
      sms: 'http://localhost:3016',
    })
    const smsGroup = nav.find((item) => item.kind === 'group' && item.label === 'SMS')
    assert.ok(smsGroup?.kind === 'group')
    if (smsGroup?.kind === 'group') {
      assert.equal(smsGroup.children.length, 5)
      assert.equal(smsGroup.children[0]?.href, 'http://localhost:3016/send')
      assert.equal(smsGroup.children[0]?.label, 'Send SMS')
      assert.equal(smsGroup.children[1]?.href, 'http://localhost:3016/devices')
      assert.equal(smsGroup.children[2]?.href, 'http://localhost:3016/queue')
      assert.equal(smsGroup.children[3]?.href, 'http://localhost:3016/history')
      assert.equal(smsGroup.children[4]?.href, 'http://localhost:3016/templates')
    }
  })

  it('member nav omits SMS group', () => {
    const nav = resolvePlatformNavUrls('http://localhost:3010', 'member')
    const smsGroup = nav.find((item) => item.kind === 'group' && item.label === 'SMS')
    assert.equal(smsGroup, undefined)
  })

  it('maps Identity users sentinels to external paths', () => {
    assert.equal(isIdentityNavSentinel(IDENTITY_NAV_SENTINELS.users), true)
    assert.equal(isIdentityNavSentinel('/identity/users/user_abc'), true)
    assert.equal(isIdentityNavSentinel('/identity/users/'), false)
    assert.equal(isIdentityNavSentinel('/identity/users/a/b'), false)
    assert.equal(isIdentityNavSentinel('/identity/users/../x'), false)
    assert.equal(isIdentityNavSentinel('/profile'), false)
    assert.equal(identitySentinelToExternalPath(IDENTITY_NAV_SENTINELS.users), '/users')
    assert.equal(identitySentinelToExternalPath('/identity/users/user_abc'), '/users/user_abc')
    assert.equal(identitySentinelToExternalPath('/identity/users/'), null)
    assert.equal(identitySentinelToExternalPath('/identity/users/a/b'), null)
    assert.equal(identitySentinelToExternalPath('/unknown'), null)
  })

  it('maps SMS sentinels to external paths', () => {
    assert.equal(isSmsNavSentinel(SMS_NAV_SENTINELS.send), true)
    assert.equal(isSmsNavSentinel(`${SMS_NAV_SENTINELS.templates}/tmpl_1`), true)
    assert.equal(isSmsNavSentinel(`${SMS_NAV_SENTINELS.templates}/tmpl_1/preview`), true)
    assert.equal(isSmsNavSentinel(`${SMS_NAV_SENTINELS.templates}/tmpl_1/versions`), true)
    assert.equal(isSmsNavSentinel('/email/history'), false)
    assert.equal(smsSentinelToExternalPath(SMS_NAV_SENTINELS.send), '/send')
    assert.equal(smsSentinelToExternalPath(SMS_NAV_SENTINELS.devices), '/devices')
    assert.equal(smsSentinelToExternalPath(SMS_NAV_SENTINELS.queue), '/queue')
    assert.equal(smsSentinelToExternalPath(SMS_NAV_SENTINELS.history), '/history')
    assert.equal(smsSentinelToExternalPath(SMS_NAV_SENTINELS.templates), '/templates')
    assert.equal(
      smsSentinelToExternalPath(`${SMS_NAV_SENTINELS.templates}/tmpl_1`),
      '/templates/tmpl_1',
    )
    assert.equal(
      smsSentinelToExternalPath(`${SMS_NAV_SENTINELS.templates}/tmpl_1/versions`),
      '/templates/tmpl_1/versions',
    )
    assert.equal(smsSentinelToExternalPath('/unknown'), null)
  })

  it('resolves Data sub-nav URLs with external paths', () => {
    const nav = resolvePlatformNavUrls('http://localhost:3010', 'main', {
      data: 'http://localhost:3005',
    })
    const dataGroup = nav.find((item) => item.kind === 'group' && item.label === 'Data')
    assert.ok(dataGroup?.kind === 'group')
    if (dataGroup?.kind === 'group') {
      assert.equal(dataGroup.children.length, 6)
      assert.equal(dataGroup.children[0]?.href, 'http://localhost:3005/tags')
      assert.equal(dataGroup.children[0]?.label, 'Tags')
      assert.equal(dataGroup.children[1]?.href, 'http://localhost:3005/units')
      assert.equal(dataGroup.children[1]?.label, 'Units')
      assert.equal(dataGroup.children[2]?.href, 'http://localhost:3005/attributes')
      assert.equal(dataGroup.children[3]?.href, 'http://localhost:3005/products')
      assert.equal(dataGroup.children[4]?.href, 'http://localhost:3005/services')
      assert.equal(dataGroup.children[5]?.href, 'http://localhost:3005/spaces')
    }
  })

  it('member nav includes Identity Users and Staff', () => {
    const defs = getPlatformNavDefs('member')
    const identity = defs.find((item) => item.kind === 'group' && item.label === 'Identity')
    assert.ok(identity?.kind === 'group')
    if (identity?.kind === 'group') {
      assert.deepEqual(
        identity.children.map((child) => ({ path: child.path, label: child.label })),
        [
          { path: IDENTITY_NAV_SENTINELS.users, label: 'Users' },
          { path: '/staff', label: 'Staff' },
        ],
      )
    }
  })

  it('member nav includes Data group (filtered by company entities at consumer)', () => {
    const nav = resolvePlatformNavUrls('http://localhost:3010', 'member', {
      data: 'http://localhost:3005',
    })
    const dataGroup = nav.find((item) => item.kind === 'group' && item.label === 'Data')
    assert.ok(dataGroup?.kind === 'group')
    if (dataGroup?.kind === 'group') {
      assert.equal(dataGroup.children.length, 6)
      assert.equal(dataGroup.children[3]?.href, 'http://localhost:3005/products')
      assert.equal(dataGroup.children[4]?.href, 'http://localhost:3005/services')
      assert.equal(dataGroup.children[5]?.href, 'http://localhost:3005/spaces')
    }
  })

  it('maps Data sentinels to external paths', () => {
    assert.equal(isDataNavSentinel(DATA_NAV_SENTINELS.tags), true)
    assert.equal(isDataNavSentinel(DATA_NAV_SENTINELS.units), true)
    assert.equal(isDataNavSentinel('/data/dashboard'), false)
    assert.equal(isDataNavSentinel('/email/history'), false)
    assert.equal(dataSentinelToExternalPath(DATA_NAV_SENTINELS.tags), '/tags')
    assert.equal(dataSentinelToExternalPath(DATA_NAV_SENTINELS.units), '/units')
    assert.equal(dataSentinelToExternalPath(DATA_NAV_SENTINELS.attributes), '/attributes')
    assert.equal(dataSentinelToExternalPath(DATA_NAV_SENTINELS.products), '/products')
    assert.equal(dataSentinelToExternalPath(DATA_NAV_SENTINELS.services), '/services')
    assert.equal(dataSentinelToExternalPath(DATA_NAV_SENTINELS.spaces), '/spaces')
    assert.equal(dataSentinelToExternalPath('/unknown'), null)
  })

  it('maps Data sentinels to entity keys', () => {
    assert.equal(dataEntityKeyFromSentinel(DATA_NAV_SENTINELS.tags), 'tags')
    assert.equal(dataEntityKeyFromSentinel(DATA_NAV_SENTINELS.products), 'products')
    assert.equal(dataEntityKeyFromSentinel('/unknown'), null)
  })

  it('filters Data nav children by enabled entity keys', () => {
    const defs = getPlatformNavDefs('main')
    const filtered = filterPlatformNavDataEntities(defs, ['tags', 'products'])
    const dataGroup = filtered.find((item) => item.kind === 'group' && item.label === 'Data')
    assert.ok(dataGroup?.kind === 'group')
    if (dataGroup?.kind === 'group') {
      assert.deepEqual(
        dataGroup.children.map((child) => child.label),
        ['Tags', 'Products'],
      )
    }
    assert.ok(filtered.some((item) => item.kind === 'group' && item.label === 'Email'))
  })

  it('drops Data group when no entities are enabled', () => {
    const defs = getPlatformNavDefs('main')
    const filtered = filterPlatformNavDataEntities(defs, [])
    const dataGroup = filtered.find((item) => item.kind === 'group' && item.label === 'Data')
    assert.equal(dataGroup, undefined)
  })

  it('filterCompanyDataEntities keeps only products, services, spaces', () => {
    assert.deepEqual(
      filterCompanyDataEntities(['tags', 'units', 'attributes', 'products', 'spaces']),
      ['products', 'spaces'],
    )
  })
})
