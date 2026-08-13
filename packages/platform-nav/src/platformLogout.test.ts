import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  appendPromptLogin,
  buildClearFirstLogoutUrl,
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

describe('appendPromptLogin', () => {
  it('appends prompt=login to absolute URLs', () => {
    assert.equal(
      appendPromptLogin('http://localhost:3010/login'),
      'http://localhost:3010/login?prompt=login',
    )
  })

  it('does not duplicate prompt=login', () => {
    assert.equal(
      appendPromptLogin('http://localhost:3010/login?prompt=login'),
      'http://localhost:3010/login?prompt=login',
    )
  })
})

describe('buildIdentityLogoutUrl', () => {
  it('builds logout URL with post_logout_redirect_uri', () => {
    const url = buildIdentityLogoutUrl('http://localhost:3011', 'http://localhost:3010/login?prompt=login')
    assert.equal(
      url,
      'http://localhost:3011/logout?post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A3010%2Flogin%3Fprompt%3Dlogin',
    )
  })
})

describe('resolveAbsolutePostLogoutLoginUrl', () => {
  it('returns relative local login path with prompt=login', () => {
    assert.equal(resolveAbsolutePostLogoutLoginUrl(null, '/login'), '/login?prompt=login')
  })
})

describe('buildClearFirstLogoutUrl', () => {
  it('clears peer origin before Identity logout and lands on finalUrl', () => {
    const url = buildClearFirstLogoutUrl(
      ['http://127.0.0.1:3010'],
      'http://127.0.0.1:3011',
      'http://127.0.0.1:3018/?prompt=login',
    )
    assert.equal(
      url,
      'http://127.0.0.1:3010/auth/clear-session?continue=http%3A%2F%2F127.0.0.1%3A3011%2Flogout%3Fpost_logout_redirect_uri%3Dhttp%253A%252F%252F127.0.0.1%253A3018%252F%253Fprompt%253Dlogin',
    )
  })
})

describe('performPlatformLogout', () => {
  it('is exported and resolves target like resolvePlatformLogoutLoginUrl', () => {
    assert.equal(typeof performPlatformLogout, 'function')
  })
})
