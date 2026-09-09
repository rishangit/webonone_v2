import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  addPaletteSlot,
  defaultWebsitePaletteTokens,
  mergeImportedSwatches,
  pageChromeFromTokens,
  parsePaletteSwatchesPayload,
  removePaletteSlot,
  swatchesToColorTokens,
  WEBSITE_PALETTE_MAX,
} from './websitePalette'

describe('websitePalette', () => {
  it('seeds five named role tokens by default', () => {
    const tokens = defaultWebsitePaletteTokens()
    assert.equal(tokens.length, 5)
    assert.equal(tokens[0]?.id, 'primary')
    assert.equal(tokens[0]?.name, 'Primary')
  })

  it('imports one to seven swatches and keeps extra custom colors', () => {
    const existing = defaultWebsitePaletteTokens()
    existing[0] = { ...existing[0]!, name: 'Brand' }
    existing.push({ id: 'accent', name: 'Accent', value: '#FF00AA' })
    const next = mergeImportedSwatches(['#111111', '#222222', '#333333'], existing)
    assert.equal(next.find((token) => token.id === 'primary')?.name, 'Brand')
    assert.equal(next.find((token) => token.id === 'primary')?.value, '#111111')
    assert.equal(next.find((token) => token.id === 'accent')?.value, '#FF00AA')
    assert.equal(next.some((token) => token.id === 'text'), false)
    assert.equal(next.length, 4)
  })

  it('keeps unused imported slots that are still in use', () => {
    const existing = defaultWebsitePaletteTokens()
    const next = mergeImportedSwatches(['#111111'], existing, undefined, new Set(['text']))
    assert.equal(next.find((token) => token.id === 'text')?.value, existing.find((token) => token.id === 'text')?.value)
    assert.equal(next[0]?.id, 'primary')
  })

  it('adds and removes slots within 1–7', () => {
    let slots = defaultWebsitePaletteTokens()
    slots = addPaletteSlot(slots)
    slots = addPaletteSlot(slots)
    assert.equal(slots.length, WEBSITE_PALETTE_MAX)
    assert.equal(addPaletteSlot(slots).length, WEBSITE_PALETTE_MAX)
    slots = removePaletteSlot(slots, 'color7')
    assert.equal(slots.length, 6)
    assert.equal(removePaletteSlot(swatchesToColorTokens(['#111111']), 'primary').length, 1)
  })

  it('maps background and text onto page chrome with fallbacks', () => {
    const five = defaultWebsitePaletteTokens()
    assert.deepEqual(pageChromeFromTokens(five), {
      pageBackground: five.find((token) => token.id === 'background')?.value,
      bodyTextColor: five.find((token) => token.id === 'text')?.value,
    })
    const one = swatchesToColorTokens(['#344CE2'])
    assert.deepEqual(pageChromeFromTokens(one), {
      pageBackground: '#344CE2',
      bodyTextColor: '#344CE2',
    })
  })

  it('parses a swatches payload', () => {
    assert.deepEqual(parsePaletteSwatchesPayload(['#344CE2', '#3578E8']), ['#344CE2', '#3578E8'])
    assert.deepEqual(parsePaletteSwatchesPayload({ swatches: ['#344CE2'] }), ['#344CE2'])
    assert.equal(parsePaletteSwatchesPayload(['#fff']), null)
    assert.equal(parsePaletteSwatchesPayload([]), null)
  })
})
