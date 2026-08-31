import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  contrastRatio,
  darken,
  hexToHsl,
  isHexColor,
  lighten,
  meetsContrast,
  mix,
  pickContrastingText,
} from './colorUtils'

describe('colorUtils', () => {
  it('validates hex colors', () => {
    assert.equal(isHexColor('#344CE2'), true)
    assert.equal(isHexColor('#fff'), false)
  })

  it('lightens and darkens', () => {
    const base = '#344CE2'
    const lighter = lighten(base, 10)
    const darker = darken(base, 10)
    assert.notEqual(lighter, base)
    assert.notEqual(darker, base)
    assert.ok(hexToHsl(lighter).l > hexToHsl(base).l)
    assert.ok(hexToHsl(darker).l < hexToHsl(base).l)
  })

  it('mixes two colors', () => {
    const mid = mix('#000000', '#FFFFFF', 0.5)
    assert.match(mid, /^#[0-9A-F]{6}$/)
  })

  it('picks contrasting text for light and dark backgrounds', () => {
    assert.equal(pickContrastingText('#FFFFFF'), '#1A1A1A')
    assert.equal(pickContrastingText('#000000'), '#FFFFFF')
  })

  it('meets WCAG AA contrast for readable pairs', () => {
    assert.equal(meetsContrast('#FFFFFF', '#344CE2'), true)
    assert.equal(meetsContrast('#1A1A1A', '#FFFFFF'), true)
    assert.ok(contrastRatio('#FFFFFF', '#344CE2') >= 4.5)
  })
})
