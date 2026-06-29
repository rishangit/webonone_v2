import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { resolvePlatformLogoutLoginUrl } from './platformLogout'

describe('resolvePlatformLogoutLoginUrl', () => {
  it('returns local login path when returnUrl is absent', () => {
    assert.equal(resolvePlatformLogoutLoginUrl(null), '/login')
    assert.equal(resolvePlatformLogoutLoginUrl(undefined), '/login')
    assert.equal(resolvePlatformLogoutLoginUrl(''), '/login')
  })

  it('returns local login path when returnUrl is invalid', () => {
    assert.equal(resolvePlatformLogoutLoginUrl('not-a-url'), '/login')
  })

  it('returns core origin login when returnUrl is valid', () => {
    assert.equal(
      resolvePlatformLogoutLoginUrl('http://localhost:3000/'),
      'http://localhost:3000/login',
    )
    assert.equal(
      resolvePlatformLogoutLoginUrl('https://app.example.com/dashboard'),
      'https://app.example.com/login',
    )
  })

  it('uses custom local login path when returnUrl is absent', () => {
    assert.equal(resolvePlatformLogoutLoginUrl(null, '/sign-in'), '/sign-in')
  })
})
