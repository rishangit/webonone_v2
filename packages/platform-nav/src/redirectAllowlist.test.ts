import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
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

  it('matches localhost dev ports and paths', () => {
    assert.equal(matchesRedirectUri('http://localhost:3000/callback', devPatterns), true)
    assert.equal(matchesRedirectUri('http://localhost:3001/profile', devPatterns), true)
    assert.equal(matchesRedirectUri('http://127.0.0.1:3000/callback', devPatterns), true)
    assert.equal(matchesRedirectUri('https://localhost:3000/callback', devPatterns), false)
  })
})

describe('matchesAllowedOrigin', () => {
  it('matches consumer origins from wildcard patterns', () => {
    assert.equal(matchesAllowedOrigin('https://app.webonone.com', productionPatterns), true)
    assert.equal(matchesAllowedOrigin('https://billing.webonone.com', productionPatterns), true)
  })

  it('matches localhost origins in dev', () => {
    assert.equal(matchesAllowedOrigin('http://localhost:3000', devPatterns), true)
  })

  it('matches exact pattern origins for legacy entries', () => {
    const patterns = parseAllowlistPatterns('https://app.webonone.com/callback')
    assert.equal(matchesAllowedOrigin('https://app.webonone.com', patterns), true)
    assert.equal(matchesAllowedOrigin('https://identity.webonone.com', patterns), false)
  })
})
