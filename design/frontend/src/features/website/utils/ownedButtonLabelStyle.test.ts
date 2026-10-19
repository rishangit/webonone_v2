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
    isLocked: false,
    sourceLibraryId: null,
    fonts: [{ id: 'font-1', name: 'Inter', googleFontUrl: 'https://fonts.googleapis.com/css2?family=Inter', family: 'Inter' }],
    colors: [
      { id: 'color-1', name: 'Blue', value: '#344CE2' },
      { id: 'color-2', name: 'White', value: '#FFFFFF' },
    ],
    colorPalettes: [],
    textStyles: [
      { id: 'text-shared', name: 'Body', fontId: 'font-1', colorId: 'color-1', size: 16 },
      { id: 'text-owned', name: 'Primary', fontId: 'font-1', colorId: 'color-2', size: 18 },
    ],
    buttonStyles: [
      {
        id: 'btn-a',
        name: 'A',
        backgroundColorId: 'color-1',
        textColorId: 'color-2',
        textStyleId: 'text-shared',
        borderColorId: 'color-1',
        borderWidth: 0,
        radius: 6,
      },
      {
        id: 'btn-b',
        name: 'B',
        backgroundColorId: 'color-1',
        textColorId: 'color-2',
        textStyleId: 'text-shared',
        borderColorId: 'color-1',
        borderWidth: 0,
        radius: 6,
      },
      {
        id: 'btn-c',
        name: 'C',
        backgroundColorId: 'color-1',
        textColorId: 'color-2',
        textStyleId: 'text-owned',
        borderColorId: 'color-1',
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
    assert.equal(draft.button.backgroundColorId, 'color-1')
    assert.equal(draft.button.textColorId, draft.labelStyle.colorId)
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
