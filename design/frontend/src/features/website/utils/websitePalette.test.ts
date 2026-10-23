import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { WebsiteTheme } from '../types'
import {
  addPaletteSlot,
  applyLibraryPaletteGroupToTheme,
  applyThemeChrome,
  defaultWebsitePaletteTokens,
  mergeImportedSwatches,
  pageChromeFromTokens,
  paletteOverrideForSave,
  parseLibraryPaletteApplyPayload,
  parsePaletteSwatchesPayload,
  remapColorIndex,
  removePaletteSlot,
  removeThemeColorPaletteGroup,
  stylePaletteId,
  swatchesToColorTokens,
  themeSlotValue,
  WEBSITE_PALETTE_MAX,
} from './websitePalette'

function emptyTheme(): WebsiteTheme {
  return {
    id: 'theme-1',
    companyId: 'co-1',
    name: 'Theme',
    pageBackground: '#ffffff',
    bodyTextColor: '#111827',
    isActive: true,
    isDefault: false,
    sourceLibraryId: null,
    fonts: [],
    colorPaletteId: '',
    pageBackgroundIndex: 1,
    surfaceIndex: 1,
    bodyTextIndex: 1,
    accent1Index: 1,
    accent2Index: 1,
    colorPalettes: [],
    textStyles: [],
    buttonStyles: [],
    createdBy: null,
    createdAt: '',
    updatedAt: '',
  }
}

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

  it('parses library palette apply payloads from peer dialogs', () => {
    assert.deepEqual(
      parseLibraryPaletteApplyPayload({
        kind: 'libraryPalette',
        swatches: ['#111111', '#222222'],
        colorNames: ['A', 'B'],
      }),
      {
        swatches: ['#111111', '#222222'],
        colorNames: ['A', 'B'],
        sourceLibraryPaletteId: null,
        paletteName: null,
      },
    )
    assert.equal(parseLibraryPaletteApplyPayload({ kind: 'color' }), null)
  })

  it('stores palette colors by slot and selects the first palette as basic', () => {
    const applied = applyLibraryPaletteGroupToTheme(emptyTheme(), {
      name: 'Brand',
      sourceLibraryPaletteId: 'lib-1',
      entries: [
        { name: 'Primary', value: '#111111' },
        { name: 'Secondary', value: '#222222' },
      ],
    })
    assert.equal(applied.colorPalettes.length, 1)
    assert.equal(applied.colorPalettes[0]?.sourceLibraryPaletteId, 'lib-1')
    assert.equal(applied.colorPalettes[0]?.colors.length, 2)
    assert.equal(applied.colorPaletteId, applied.colorPalettes[0]?.id)
    assert.equal(applied.accent1Index, 1)
    assert.equal(applied.accent2Index, 2)
  })

  it('keeps a later palette from replacing the basic palette', () => {
    const first = applyLibraryPaletteGroupToTheme(emptyTheme(), {
      name: 'Brand',
      sourceLibraryPaletteId: 'lib-1',
      entries: [
        { name: 'Primary', value: '#111111' },
        { name: 'Secondary', value: '#222222' },
      ],
    })
    const theme = applyThemeChrome({ ...emptyTheme(), ...first })
    const second = applyLibraryPaletteGroupToTheme(theme, {
      name: 'Accent',
      sourceLibraryPaletteId: 'lib-2',
      entries: [
        { name: 'Primary', value: '#AA0000' },
        { name: 'Secondary', value: '#BB0000' },
      ],
    })
    assert.equal(second.colorPalettes.length, 2)
    assert.equal(second.colorPaletteId, first.colorPaletteId)
    assert.equal(second.colorPalettes[1]?.colors[0]?.value, '#AA0000')
    assert.equal(remapColorIndex({ ...theme, ...second }, second.colorPalettes[1]!.id, 2), 2)
    assert.equal(paletteOverrideForSave(second.colorPaletteId, second.colorPaletteId), null)
    assert.equal(paletteOverrideForSave(second.colorPaletteId, ''), null)
    assert.equal(paletteOverrideForSave(second.colorPaletteId, second.colorPalettes[1]!.id), second.colorPalettes[1]!.id)
  })

  it('paints theme colors from the first palette when the theme palette is empty', () => {
    const applied = applyLibraryPaletteGroupToTheme(emptyTheme(), {
      name: 'Brand',
      sourceLibraryPaletteId: 'lib-1',
      entries: [
        { name: 'Primary', value: '#111111' },
        { name: 'Secondary', value: '#222222' },
      ],
    })
    const theme = applyThemeChrome({ ...emptyTheme(), ...applied, colorPaletteId: '' })
    assert.equal(theme.colorPaletteId, '')
    assert.equal(theme.pageBackground, '#111111')
    assert.equal(stylePaletteId(theme, null), applied.colorPalettes[0]?.id)
    assert.equal(stylePaletteId(theme, 'missing'), applied.colorPalettes[0]?.id)
  })

  it('clears a style override when its palette is removed', () => {
    const first = applyLibraryPaletteGroupToTheme(emptyTheme(), {
      name: 'Brand',
      sourceLibraryPaletteId: 'lib-1',
      entries: [{ name: 'Primary', value: '#111111' }],
    })
    const theme = applyThemeChrome({
      ...emptyTheme(),
      ...first,
      textStyles: [
        {
          id: 'body',
          name: 'Body',
          fontId: '',
          size: 16,
          colorIndex: 1,
          colorPaletteId: 'extra',
        },
      ],
      buttonStyles: [
        {
          id: 'btn',
          name: 'Button',
          colorPaletteId: 'extra',
          backgroundColorIndex: 1,
          textColorIndex: 1,
          textStyleId: 'body',
          borderColorIndex: 1,
          borderWidth: 0,
          radius: 6,
        },
      ],
    })
    const removed = removeThemeColorPaletteGroup(
      { ...theme, colorPalettes: [...theme.colorPalettes, { id: 'extra', name: 'Extra', colors: [{ name: 'A', value: '#000' }] }] },
      'extra',
    )
    assert.equal(removed.textStyles[0]?.colorPaletteId, null)
    assert.equal(removed.buttonStyles[0]?.colorPaletteId, null)
    assert.equal(removed.colorPaletteId, first.colorPaletteId)
  })

  it('reads page chrome from the basic palette slot', () => {
    const applied = applyLibraryPaletteGroupToTheme(emptyTheme(), {
      name: 'Brand',
      sourceLibraryPaletteId: 'lib-1',
      entries: [
        { name: 'Primary', value: '#344CE2' },
        { name: 'Secondary', value: '#3578E8' },
        { name: 'Background', value: '#EFF3FA' },
        { name: 'Surface', value: '#FFFFFF' },
        { name: 'Text', value: '#17211D' },
      ],
    })
    const theme = applyThemeChrome({ ...emptyTheme(), ...applied })
    assert.equal(theme.pageBackgroundIndex, 3)
    assert.equal(theme.surfaceIndex, 4)
    assert.equal(theme.bodyTextIndex, 5)
    assert.equal(themeSlotValue(theme, theme.colorPaletteId, theme.pageBackgroundIndex, ''), '#EFF3FA')
    assert.equal(theme.pageBackground, '#EFF3FA')
    assert.equal(theme.bodyTextColor, '#17211D')
  })

  it('reads a basic color from another palette and shifts indexes when that palette is removed', () => {
    const theme = applyThemeChrome({
      ...emptyTheme(),
      colorPaletteId: 'one',
      colorPalettes: [
        { id: 'one', name: 'One', colors: [{ name: 'A', value: '#111111' }] },
        { id: 'two', name: 'Two', colors: [{ name: 'B', value: '#222222' }, { name: 'C', value: '#333333' }] },
        { id: 'three', name: 'Three', colors: [{ name: 'D', value: '#444444' }] },
      ],
      pageBackgroundPaletteIndex: 2,
      pageBackgroundIndex: 2,
      surfacePaletteIndex: 3,
      surfaceIndex: 1,
    })
    assert.equal(theme.pageBackground, '#333333')
    assert.equal(theme.surfaceColor, '#444444')
    assert.equal(theme.bodyTextColor, '#111111')

    const removed = applyThemeChrome({ ...theme, ...removeThemeColorPaletteGroup(theme, 'two') })
    assert.equal(removed.colorPaletteId, 'one')
    assert.equal(removed.pageBackgroundPaletteIndex, null)
    assert.equal(removed.pageBackground, '#111111')
    assert.equal(removed.surfacePaletteIndex, 2)
    assert.equal(removed.surfaceColor, '#444444')
  })
})
