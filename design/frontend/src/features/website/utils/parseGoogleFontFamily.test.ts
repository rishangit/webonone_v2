import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  extractGoogleFontUrl,
  normalizeGoogleFontInput,
  parseGoogleFontFamily,
} from './parseGoogleFontFamily'

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

  it('parses link tag snippets', () => {
    assert.equal(
      parseGoogleFontFamily(
        '<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">',
      ),
      'Playfair Display',
    )
  })

  it('parses quoted raw URLs', () => {
    assert.equal(
      parseGoogleFontFamily(
        '"https://fonts.googleapis.com/css2?family=Jacques+Francois&display=swap"',
      ),
      'Jacques Francois',
    )
  })

  it('returns null for empty or invalid URLs', () => {
    assert.equal(parseGoogleFontFamily(''), null)
    assert.equal(parseGoogleFontFamily('not-a-url'), null)
    assert.equal(parseGoogleFontFamily('https://example.com/css2?family=Inter'), null)
  })
})

describe('extractGoogleFontUrl', () => {
  it('extracts href from link tags', () => {
    assert.equal(
      extractGoogleFontUrl(
        '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap" rel="stylesheet">',
      ),
      'https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap',
    )
  })

  it('prefers the stylesheet link when a full Google embed block is pasted', () => {
    assert.equal(
      extractGoogleFontUrl(`<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jacques+Francois&display=swap" rel="stylesheet">`),
      'https://fonts.googleapis.com/css2?family=Jacques+Francois&display=swap',
    )
  })

  it('returns direct stylesheet URLs unchanged', () => {
    const url = 'https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap'
    assert.equal(extractGoogleFontUrl(url), url)
  })
})

describe('normalizeGoogleFontInput', () => {
  it('normalizes pasted embed code to the stylesheet URL', () => {
    assert.equal(
      normalizeGoogleFontInput(
        '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap" rel="stylesheet">',
      ),
      'https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap',
    )
  })
})
