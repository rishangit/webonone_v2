import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { WebsiteTheme } from '../types'
import { emptyButtonDraft, resolveOwnedButtonLabelStyle } from './ownedButtonLabelStyle'

function theme(): WebsiteTheme {
  return {
    id: 'theme-1',
    companyId: 'co-1',
    name: 'Theme',
    pageBackground: '#ffffff',
    bodyTextColor: '#111827',
    isActive: true,
    isDefault: false,
    sourceLibraryId: null,
    fonts: [{ id: 'font-1', name: 'Inter', googleFontUrl: 'https://fonts.googleapis.com/css2?family=Inter', family: 'Inter' }],
    colorPaletteId: 'palette-1',
    pageBackgroundIndex: 1,
    surfaceIndex: 1,
    bodyTextIndex: 2,
    accent1Index: 1,
    accent2Index: 2,
    colorPalettes: [
      {
        id: 'palette-1',
        name: 'Brand',
        colors: [
          { name: 'Blue', value: '#344CE2' },
          { name: 'White', value: '#FFFFFF' },
        ],
      },
    ],
    textStyles: [
      { id: 'text-shared', name: 'Body', fontId: 'font-1', colorIndex: 1, colorPaletteId: null, size: 16 },
      { id: 'text-owned', name: 'Primary', fontId: 'font-1', colorIndex: 2, colorPaletteId: null, size: 18 },
    ],
    buttonStyles: [
      {
        id: 'btn-a',
        name: 'A',
        colorPaletteId: null,
        backgroundColorIndex: 1,
        textColorIndex: 2,
        textStyleId: 'text-shared',
        borderColorIndex: 1,
        borderWidth: 0,
        radius: 6,
      },
      {
        id: 'btn-b',
        name: 'B',
        colorPaletteId: null,
        backgroundColorIndex: 1,
        textColorIndex: 2,
        textStyleId: 'text-shared',
        borderColorIndex: 1,
        borderWidth: 0,
        radius: 6,
      },
      {
        id: 'btn-c',
        name: 'C',
        colorPaletteId: null,
        backgroundColorIndex: 1,
        textColorIndex: 2,
        textStyleId: 'text-owned',
        borderColorIndex: 1,
        borderWidth: 1,
        radius: 8,
      },
    ],
    createdBy: null,
    createdAt: '',
    updatedAt: '',
  }
}

describe('emptyButtonDraft', () => {
  it('creates a dedicated label style instead of reusing the first theme text style', () => {
    const draft = emptyButtonDraft(theme())
    assert.notEqual(draft.labelStyle.id, 'text-shared')
    assert.notEqual(draft.labelStyle.id, 'text-owned')
    assert.equal(draft.button.textStyleId, draft.labelStyle.id)
    assert.equal(draft.labelStyle.fontId, 'font-1')
    assert.equal(draft.button.backgroundColorIndex, 1)
    assert.equal(draft.button.textColorIndex, draft.labelStyle.colorIndex)
    assert.equal(draft.button.colorPaletteId, null)
  })

  it('keeps an owned label style when editing', () => {
    const current = theme()
    const draft = emptyButtonDraft(current, current.buttonStyles[2])
    assert.equal(draft.labelStyle.id, 'text-owned')
    assert.equal(draft.button.textStyleId, 'text-owned')
    assert.equal(draft.labelStyle.size, 18)
  })
})

describe('resolveOwnedButtonLabelStyle', () => {
  it('clones a label style shared by another button', () => {
    const current = theme()
    const owned = resolveOwnedButtonLabelStyle(current, current.buttonStyles[0])
    assert.notEqual(owned.id, 'text-shared')
    assert.equal(owned.fontId, 'font-1')
    assert.equal(owned.size, 16)
  })
})
