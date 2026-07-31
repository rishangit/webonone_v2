import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  expandLoopbackOrigins,
  matchesAllowedOrigin,
  matchesRedirectUri,
  parseAllowlistPatterns,
} from './redirectAllowlist'

const productionPatterns = parseAllowlistPatterns('https://*.webonone.com')
const devPatterns = parseAllowlistPatterns('http://localhost:*')

describe('parseAllowlistPatterns', () => {
  it('splits comma-separated values', () => {
    assert.deepEqual(parseAllowlistPatterns(' https://*.webonone.com , http://localhost:* '), [
      'https://*.webonone.com',
      'http://localhost:*',
    ])
  })
})

describe('matchesRedirectUri', () => {
  it('matches exact production callback URIs', () => {
    const patterns = parseAllowlistPatterns('https://app.webonone.com/callback')
    assert.equal(matchesRedirectUri('https://app.webonone.com/callback', patterns), true)
    assert.equal(matchesRedirectUri('https://app.webonone.com/profile', patterns), false)
  })

  it('matches any https subdomain path for wildcard patterns', () => {
    assert.equal(matchesRedirectUri('https://app.webonone.com/callback', productionPatterns), true)
    assert.equal(matchesRedirectUri('https://billing.webonone.com/callback', productionPatterns), true)
    assert.equal(matchesRedirectUri('https://identity.webonone.com/profile', productionPatterns), true)
  })

  it('rejects unsafe hosts and schemes for wildcard patterns', () => {
    assert.equal(matchesRedirectUri('http://app.webonone.com/callback', productionPatterns), false)
    assert.equal(matchesRedirectUri('https://evil-webonone.com/callback', productionPatterns), false)
    assert.equal(matchesRedirectUri('https://webonone.com.evil.com/callback', productionPatterns), false)
    assert.equal(matchesRedirectUri('https://webonone.com/callback', productionPatterns), false)
    assert.equal(matchesRedirectUri('javascript:alert(1)', productionPatterns), false)
  })

  it('matches localhost and 127.0.0.1 via either loopback pattern', () => {
    assert.equal(matchesRedirectUri('http://localhost:3010/callback', devPatterns), true)
    assert.equal(matchesRedirectUri('http://localhost:3011/profile', devPatterns), true)
    assert.equal(matchesRedirectUri('http://127.0.0.1:3000/callback', devPatterns), true)
    assert.equal(matchesRedirectUri('https://localhost:3010/callback', devPatterns), false)

    const ipv4Patterns = parseAllowlistPatterns('http://127.0.0.1:*')
    assert.equal(matchesRedirectUri('http://127.0.0.1:3010/callback', ipv4Patterns), true)
    assert.equal(matchesRedirectUri('http://localhost:3010/callback', ipv4Patterns), true)
  })
})

describe('expandLoopbackOrigins', () => {
  it('adds the localhost ↔ 127.0.0.1 alias with the same port', () => {
    assert.deepEqual(expandLoopbackOrigins(['http://127.0.0.1:3010']), [
      'http://127.0.0.1:3010',
      'http://localhost:3010',
    ])
    assert.deepEqual(expandLoopbackOrigins(['http://localhost:3011']), [
      'http://localhost:3011',
      'http://127.0.0.1:3011',
    ])
  })

  it('dedupes when both aliases are already listed', () => {
    assert.deepEqual(
      expandLoopbackOrigins(['http://127.0.0.1:3010', 'http://localhost:3010', 'http://127.0.0.1:3010']),
      ['http://127.0.0.1:3010', 'http://localhost:3010'],
    )
  })

  it('leaves non-loopback and invalid entries unchanged', () => {
    assert.deepEqual(expandLoopbackOrigins(['https://app.webonone.com', 'not-a-url', "'self'"]), [
      'https://app.webonone.com',
      'not-a-url',
      "'self'",
    ])
  })
})

describe('matchesAllowedOrigin', () => {
  it('matches consumer origins from wildcard patterns', () => {
    assert.equal(matchesAllowedOrigin('https://app.webonone.com', productionPatterns), true)
    assert.equal(matchesAllowedOrigin('https://billing.webonone.com', productionPatterns), true)
  })

  it('matches loopback origins in dev', () => {
    assert.equal(matchesAllowedOrigin('http://localhost:3010', devPatterns), true)
    assert.equal(matchesAllowedOrigin('http://127.0.0.1:3010', parseAllowlistPatterns('http://127.0.0.1:*')), true)
  })

  it('matches exact pattern origins for legacy entries', () => {
    const patterns = parseAllowlistPatterns('https://app.webonone.com/callback')
    assert.equal(matchesAllowedOrigin('https://app.webonone.com', patterns), true)
    assert.equal(matchesAllowedOrigin('https://identity.webonone.com', patterns), false)
  })

  it('treats localhost and 127.0.0.1 as aliases for exact origins', () => {
    const patterns = parseAllowlistPatterns('http://127.0.0.1:3010')
    assert.equal(matchesAllowedOrigin('http://localhost:3010', patterns), true)
    assert.equal(matchesAllowedOrigin('http://127.0.0.1:3010', patterns), true)
    assert.equal(matchesAllowedOrigin('http://localhost:3011', patterns), false)
    assert.equal(matchesAllowedOrigin('https://localhost:3010', patterns), false)
  })

  it('does not apply loopback aliasing to subdomain wildcards', () => {
    assert.equal(matchesAllowedOrigin('http://localhost:3010', productionPatterns), false)
    assert.equal(matchesAllowedOrigin('http://127.0.0.1:3010', productionPatterns), false)
    assert.equal(matchesAllowedOrigin('https://webonone.com', productionPatterns), false)
  })
}
)
