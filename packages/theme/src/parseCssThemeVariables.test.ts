import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseCssPaletteSwatches, parseCssThemeVariables } from './parseCssThemeVariables'

const SEMANTIC = `:root {
  --color-primary: #344CE2;
  --color-secondary: #3578E8;
  --color-background: #EFF3FA;
  --color-surface: #FFFFFF;
  --color-text: #17211D;
}`

const LEGACY = `:root {
  --color-1: #111111;
  --color-2: #222222;
  --color-3: #333333;
  --color-4: #444444;
  --color-5: #555555;
}`

describe('parseCssThemeVariables', () => {
  it('parses semantic --color-* vars', () => {
    assert.deepEqual(parseCssThemeVariables(SEMANTIC), {
      primary: '#344CE2',
      secondary: '#3578E8',
      background: '#EFF3FA',
      surface: '#FFFFFF',
      text: '#17211D',
    })
  })

  it('parses legacy --color-1 through --color-5', () => {
    assert.deepEqual(parseCssThemeVariables(LEGACY), {
      primary: '#111111',
      secondary: '#222222',
      background: '#444444',
      surface: '#555555',
      text: '#333333',
    })
  })

  it('expands 3-digit hex', () => {
    const parsed = parseCssThemeVariables(`:root {
      --color-primary: #abc;
      --color-secondary: #def;
      --color-background: #fff;
      --color-surface: #000;
      --color-text: #123;
    }`)
    assert.deepEqual(parsed, {
      primary: '#AABBCC',
      secondary: '#DDEEFF',
      background: '#FFFFFF',
      surface: '#000000',
      text: '#112233',
    })
  })

  it('returns null when required vars are missing', () => {
    assert.equal(parseCssThemeVariables(':root { --color-primary: #344CE2; }'), null)
    assert.equal(parseCssThemeVariables('not css'), null)
  })
})

describe('parseCssPaletteSwatches', () => {
  it('parses one to seven numbered colors', () => {
    assert.deepEqual(parseCssPaletteSwatches(':root { --color-1: #111111; }'), ['#111111'])
    assert.deepEqual(
      parseCssPaletteSwatches(`:root {
        --color-1: #111111;
        --color-2: #222222;
        --color-3: #333333;
        --color-4: #444444;
        --color-5: #555555;
        --color-6: #666666;
        --color-7: #777777;
      }`),
      ['#111111', '#222222', '#333333', '#444444', '#555555', '#666666', '#777777'],
    )
  })

  it('falls back to a semantic five-color block', () => {
    assert.deepEqual(parseCssPaletteSwatches(SEMANTIC), [
      '#344CE2',
      '#3578E8',
      '#EFF3FA',
      '#FFFFFF',
      '#17211D',
    ])
  })

  it('returns null when no palette vars are present', () => {
    assert.equal(parseCssPaletteSwatches('not css'), null)
  })
})
