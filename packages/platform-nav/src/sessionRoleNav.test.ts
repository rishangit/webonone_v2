import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { SMS_NAV_SENTINELS } from './coreNav'
import {
  appendMobileSmsThisDeviceNav,
  buildNavDefsForSessionRole,
  sessionRoleToNavVariant,
} from './sessionRoleNav'

function groupLabels(defs: ReturnType<typeof buildNavDefsForSessionRole>): string[] {
  return defs.filter((item) => item.kind === 'group').map((item) => item.label)
}

function smsChildLabels(defs: ReturnType<typeof buildNavDefsForSessionRole>): string[] {
  const sms = defs.find((item) => item.kind === 'group' && item.label === 'SMS')
  if (sms?.kind !== 'group') return []
  return sms.children.map((child) => child.label)
}

describe('sessionRoleNav', () => {
  it('maps session roles to nav variants', () => {
    assert.equal(sessionRoleToNavVariant('super_admin'), 'superAdmin')
    assert.equal(sessionRoleToNavVariant('company_admin'), 'main')
    assert.equal(sessionRoleToNavVariant('member'), 'member')
  })

  it('includes SMS for admins and omits it for members', () => {
    assert.ok(groupLabels(buildNavDefsForSessionRole('super_admin')).includes('SMS'))
    assert.ok(groupLabels(buildNavDefsForSessionRole('company_admin', ['products'], 'co_1')).includes('SMS'))
    assert.equal(
      groupLabels(buildNavDefsForSessionRole('member', ['products'], 'co_1')).includes('SMS'),
      false,
    )
    assert.equal(groupLabels(buildNavDefsForSessionRole('member')).includes('SMS'), false)
  })

  it('strips Identity/Data/Design for Default User', () => {
    const labels = groupLabels(buildNavDefsForSessionRole('member', undefined, null))
    assert.equal(labels.includes('Identity'), false)
    assert.equal(labels.includes('Data'), false)
    assert.equal(labels.includes('Design'), false)
    assert.ok(labels.includes('Calendar'))
    assert.ok(labels.includes('Settings'))
  })

  it('keeps Identity/Data/Design for staff with a company', () => {
    const labels = groupLabels(buildNavDefsForSessionRole('member', ['products'], 'co_1'))
    assert.ok(labels.includes('Identity'))
    assert.ok(labels.includes('Data'))
    assert.ok(labels.includes('Design'))
  })

  it('filters company Data children to enabled catalog entities', () => {
    const defs = buildNavDefsForSessionRole('company_admin', ['products', 'tags'], 'co_1')
    const data = defs.find((item) => item.kind === 'group' && item.label === 'Data')
    assert.ok(data?.kind === 'group')
    if (data?.kind === 'group') {
      assert.deepEqual(
        data.children.map((child) => child.label),
        ['Products'],
      )
    }
  })

  it('appends This device after Devices on mobile SMS nav', () => {
    const defs = appendMobileSmsThisDeviceNav(buildNavDefsForSessionRole('company_admin', [], 'co_1'))
    assert.deepEqual(smsChildLabels(defs), [
      'Send SMS',
      'Devices',
      'This device',
      'Queue',
      'History',
      'Templates',
    ])
    const sms = defs.find((item) => item.kind === 'group' && item.label === 'SMS')
    assert.ok(sms?.kind === 'group')
    if (sms?.kind === 'group') {
      const leaf = sms.children.find((child) => child.path === SMS_NAV_SENTINELS.gateway)
      assert.equal(leaf?.label, 'This device')
    }
  })
})
