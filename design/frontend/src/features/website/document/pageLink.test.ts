import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { pageLinkHref } from './pageLink'

const pages = [{ id: 'page-1', path: 'about' }]

describe('pageLinkHref', () => {
  it('builds a public address only when a page is chosen and the surface is not editing', () => {
    assert.equal(pageLinkHref(pages, 'page-1', 'acme', true)?.path, 'about')
    assert.match(pageLinkHref(pages, 'page-1', 'acme', true)?.href ?? '', /\/about$/)
    assert.equal(pageLinkHref(pages, '', 'acme', true), null)
    assert.equal(pageLinkHref(pages, null, 'acme', true), null)
    assert.equal(pageLinkHref(pages, 'page-1', 'acme', false), null)
    assert.equal(pageLinkHref(pages, 'missing', 'acme', true), null)
  })
})