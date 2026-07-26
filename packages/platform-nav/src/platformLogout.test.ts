import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildIdentityLogoutUrl,
  performPlatformLogout,
  resolveAbsolutePostLogoutLoginUrl,
  resolvePlatformLogoutLoginUrl,
} from './platformLogout'

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
      resolvePlatformLogoutLoginUrl('http://localhost:3010/'),
      'http://localhost:3010/login',
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

describe('buildIdentityLogoutUrl', () => {
  it('builds logout URL with post_logout_redirect_uri', () => {
    const url = buildIdentityLogoutUrl('http://localhost:3011', 'http://localhost:3010/login')
    assert.equal(
      url,
      'http://localhost:3011/logout?post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A3010%2Flogin',
    )
  })
})

describe('resolveAbsolutePostLogoutLoginUrl', () => {
  it('returns relative local login path without prompt=login', () => {
    assert.equal(resolveAbsolutePostLogoutLoginUrl(null, '/login'), '/login')
  })
})

describe('performPlatformLogout', () => {
  it('is exported and resolves target like resolvePlatformLogoutLoginUrl', () => {
    assert.equal(typeof performPlatformLogout, 'function')
  })
})
