import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseGoogleFontFamily } from './parseGoogleFontFamily'

describe('parseGoogleFontFamily', () => {
  it('parses css2 family names', () => {
    assert.equal(
      parseGoogleFontFamily('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap'),
      'Inter',
    )
    assert.equal(
      parseGoogleFontFamily(
        'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;1,700&display=swap',
      ),
      'Open Sans',
    )
  })

  it('parses css v1 family names', () => {
    assert.equal(
      parseGoogleFontFamily('https://fonts.googleapis.com/css?family=Roboto:400,700'),
      'Roboto',
    )
  })

  it('parses @import url() snippets', () => {
    assert.equal(
      parseGoogleFontFamily(
        "@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400&display=swap');",
      ),
      'Lato',
    )
  })

  it('returns null for empty or invalid URLs', () => {
    assert.equal(parseGoogleFontFamily(''), null)
    assert.equal(parseGoogleFontFamily('not-a-url'), null)
    assert.equal(parseGoogleFontFamily('https://example.com/css2?family=Inter'), null)
  })
})
