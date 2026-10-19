import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  legacyPaletteToColors,
  libraryPaletteFromCssSwatches,
  parseStoredColorLibraryPalette,
  paletteToSwatches,
} from './colorLibraryPalette'

describe('parseStoredColorLibraryPalette', () => {
  it('converts legacy six-slot palettes to named colors', () => {
    const parsed = parseStoredColorLibraryPalette({
      color_1: '#111111',
      color_2: '#222222',
      color_3: '#333333',
      color_4: '#444444',
      color_5: '#555555',
      color_6: '#666666',
    })
    assert.equal(parsed.colors.length, 6)
    assert.deepEqual(parsed.colors[0], { name: 'Color 1', value: '#111111' })
    assert.deepEqual(paletteToSwatches(parsed), [
      '#111111',
      '#222222',
      '#333333',
      '#444444',
      '#555555',
      '#666666',
    ])
  })

  it('keeps canonical colors array', () => {
    const parsed = parseStoredColorLibraryPalette({
      colors: [{ name: 'Primary', value: '#abcdef' }],
    })
    assert.deepEqual(parsed.colors, [{ name: 'Primary', value: '#ABCDEF' }])
  })
})

describe('libraryPaletteFromCssSwatches', () => {
  it('maps swatches to named colors and caps at six', () => {
    const palette = libraryPaletteFromCssSwatches(
      ['#111111', '#222222', '#333333', '#444444', '#555555', '#666666', '#777777'],
      (slot) => `Slot ${slot}`,
    )
    assert.equal(palette.colors.length, 6)
    assert.equal(palette.colors[5]?.value, '#666666')
  })
})

describe('legacyPaletteToColors', () => {
  it('assigns default slot names', () => {
    const colors = legacyPaletteToColors({
      color_1: '#111111',
      color_2: '#222222',
      color_3: '#333333',
      color_4: '#444444',
      color_5: '#555555',
      color_6: '#666666',
    })
    assert.equal(colors[1].name, 'Color 2')
  })
})
