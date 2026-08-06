import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseCoreReturnPath, parseReturnUrl } from './returnUrl'

describe('parseReturnUrl', () => {
  const patterns = ['http://127.0.0.1:3018', 'http://localhost:3018']

  it('keeps pathname and search on allowlisted origin', () => {
    const params = new URLSearchParams({
      return_url: 'http://127.0.0.1:3018/catalog/services/abc?tab=1',
    })
    assert.equal(
      parseReturnUrl(params, patterns),
      'http://127.0.0.1:3018/catalog/services/abc?tab=1',
    )
  })

  it('drops hash', () => {
    const params = new URLSearchParams({
      return_url: 'http://127.0.0.1:3018/catalog/x#section',
    })
    assert.equal(parseReturnUrl(params, patterns), 'http://127.0.0.1:3018/catalog/x')
  })

  it('rejects foreign hosts', () => {
    const params = new URLSearchParams({
      return_url: 'https://evil.example/phish',
    })
    assert.equal(parseReturnUrl(params, patterns), null)
  })

  it('rejects malformed values', () => {
    const params = new URLSearchParams({ return_url: 'not a url' })
    assert.equal(parseReturnUrl(params, patterns), null)
  })
})

describe('parseCoreReturnPath', () => {
  it('keeps path and search', () => {
    assert.equal(parseCoreReturnPath('/settings/basic?x=1'), '/settings/basic?x=1')
  })

  it('rejects login and callback loops', () => {
    assert.equal(parseCoreReturnPath('/login'), null)
    assert.equal(parseCoreReturnPath('/callback'), null)
    assert.equal(parseCoreReturnPath('/auth/clear-session'), null)
  })

  it('rejects absolute and protocol-relative URLs', () => {
    assert.equal(parseCoreReturnPath('https://evil.example/x'), null)
    assert.equal(parseCoreReturnPath('//evil.example/x'), null)
  })

  it('rejects missing or empty', () => {
    assert.equal(parseCoreReturnPath(null), null)
    assert.equal(parseCoreReturnPath(''), null)
    assert.equal(parseCoreReturnPath('settings'), null)
  })
})
