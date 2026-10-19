import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { WebsiteTheme } from '../types'
import {
  addPaletteSlot,
  applyLibraryPaletteGroupToTheme,
  applyThemeColorRoles,
  inferThemeColorRoles,
  inferThemePaletteId,
  remapColorIdToPalette,
  appendLibraryPaletteToTheme,
  defaultWebsitePaletteTokens,
  mergeImportedSwatches,
  pageChromeFromTokens,
  parseLibraryPaletteApplyPayload,
  parsePaletteSwatchesPayload,
  removePaletteSlot,
  swatchesToColorTokens,
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
    isLocked: false,
    sourceLibraryId: null,
    fonts: [],
    colors: [],
    colorPalettes: [],
    textStyles: [],
    buttonStyles: [],
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

  it('appends library palettes and skips duplicate hex values', () => {
    const theme = emptyTheme()
    const first = appendLibraryPaletteToTheme(theme, [
      { name: 'Primary', value: '#111111' },
      { name: 'Secondary', value: '#222222' },
    ])
    assert.equal(first.colors.length, 2)
    assert.equal(first.colors[0]?.id, 'primary')
    const second = appendLibraryPaletteToTheme(
      { ...theme, colors: first.colors },
      [
        { name: 'Secondary', value: '#222222' },
        { name: 'Accent', value: '#333333' },
      ],
    )
    assert.equal(second.colors.length, 3)
    assert.equal(second.colors[2]?.name, 'Accent')
  })

  it('tracks library palette groups on the theme', () => {
    const theme = emptyTheme()
    const applied = applyLibraryPaletteGroupToTheme(theme, {
      name: 'Brand',
      sourceLibraryPaletteId: 'lib-1',
      entries: [
        { name: 'Primary', value: '#111111' },
        { name: 'Secondary', value: '#222222' },
      ],
    })
    assert.equal(applied.colorPalettes?.length, 1)
    assert.equal(applied.colorPalettes?.[0]?.sourceLibraryPaletteId, 'lib-1')
    assert.equal(applied.colorPalettes?.[0]?.colorIds.length, 2)
  })

  it('infers and remaps button colors onto a selected palette', () => {
    const first = applyLibraryPaletteGroupToTheme(emptyTheme(), {
      name: 'Brand',
      sourceLibraryPaletteId: 'lib-1',
      entries: [
        { name: 'Primary', value: '#111111' },
        { name: 'Secondary', value: '#222222' },
      ],
    })
    const second = applyLibraryPaletteGroupToTheme(
      { ...emptyTheme(), colors: first.colors, colorPalettes: first.colorPalettes ?? [] },
      {
        name: 'Accent',
        sourceLibraryPaletteId: 'lib-2',
        entries: [
          { name: 'Primary', value: '#AA0000' },
          { name: 'Secondary', value: '#BB0000' },
        ],
      },
    )
    const theme = { ...emptyTheme(), colors: second.colors, colorPalettes: second.colorPalettes ?? [] }
    const brandId = second.colorPalettes?.[0]?.id ?? ''
    const accentId = second.colorPalettes?.[1]?.id ?? ''
    const primaryId = second.colorPalettes?.[0]?.colorIds[0] ?? ''
    assert.equal(inferThemePaletteId(theme, [primaryId]), brandId)
    assert.equal(remapColorIdToPalette(theme, brandId, accentId, primaryId), second.colorPalettes?.[1]?.colorIds[0])
  })

  it('keeps each added palette as its own list group', () => {
    const first = applyLibraryPaletteGroupToTheme(emptyTheme(), {
      name: 'Brand',
      sourceLibraryPaletteId: 'lib-1',
      entries: [
        { name: 'Primary', value: '#111111' },
        { name: 'Secondary', value: '#222222' },
      ],
    })
    const second = applyLibraryPaletteGroupToTheme(
      { ...emptyTheme(), colors: first.colors, colorPalettes: first.colorPalettes ?? [] },
      {
        name: 'Accent',
        sourceLibraryPaletteId: 'lib-2',
        entries: [
          { name: 'Primary', value: '#111111' },
          { name: 'Highlight', value: '#FFAA00' },
        ],
      },
    )
    assert.equal(second.colorPalettes?.length, 2)
    assert.equal(second.colorPalettes?.[0]?.name, 'Brand')
    assert.equal(second.colorPalettes?.[1]?.name, 'Accent')
    assert.notEqual(second.colorPalettes?.[0]?.colorIds[0], second.colorPalettes?.[1]?.colorIds[0])
  })

  it('infers five theme color roles from the selected palette', () => {
    const applied = applyLibraryPaletteGroupToTheme(emptyTheme(), {
      name: 'Brand',
      sourceLibraryPaletteId: 'lib-1',
      entries: [
        { name: 'Primary', value: '#344CE2' },
        { name: 'Secondary', value: '#3578E8' },
        { name: 'Background', value: '#EFF3FA' },
        { name: 'Surface', value: '#FFFFFF' },
        { name: 'Text', value: '#17211D' },
        { name: 'Accent', value: '#F59E0B' },
      ],
    })
    const theme = { ...emptyTheme(), colors: applied.colors, colorPalettes: applied.colorPalettes ?? [] }
    const roles = inferThemeColorRoles(theme)
    assert.equal(theme.colors.find((color) => color.id === roles.pageBackgroundColorId)?.value, '#EFF3FA')
    assert.equal(theme.colors.find((color) => color.id === roles.surfaceColorId)?.value, '#FFFFFF')
    assert.equal(theme.colors.find((color) => color.id === roles.bodyTextColorId)?.value, '#17211D')
    assert.equal(theme.colors.find((color) => color.id === roles.accentColor1Id)?.value, '#344CE2')
    assert.equal(theme.colors.find((color) => color.id === roles.accentColor2Id)?.value, '#3578E8')
    const next = applyThemeColorRoles(theme, { ...roles, pageBackgroundColorId: roles.surfaceColorId })
    assert.equal(next.pageBackground, '#FFFFFF')
  })
})
