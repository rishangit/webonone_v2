import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { migrateThemeColorRecord, readThemeColorFields } from './themeColorStorage.js'

describe('migrateThemeColorRecord', () => {
  it('moves flat color tokens into palette slots and stores basic settings as indexes', () => {
    const migrated = migrateThemeColorRecord({
      page_background: '#EFF3FA',
      body_text_color: '#17211D',
      colors: [
        { id: 'primary', name: 'Primary', value: '#344CE2' },
        { id: 'text', name: 'Text', value: '#17211D' },
        { id: 'background', name: 'Background', value: '#EFF3FA' },
      ],
      color_palettes: [
        {
          id: 'brand',
          name: 'Brand',
          sourceLibraryPaletteId: 'lib-1',
          colorIds: ['primary', 'text', 'background'],
        },
      ],
      color_roles: {
        pageBackgroundColorId: 'background',
        surfaceColorId: 'background',
        bodyTextColorId: 'text',
        accentColor1Id: 'primary',
        accentColor2Id: 'primary',
      },
      text_styles: [{ id: 'body', name: 'Body', fontId: 'font', size: 16, colorId: 'text' }],
      button_styles: [
        {
          id: 'btn',
          name: 'Primary',
          backgroundColorId: 'primary',
          textColorId: 'background',
          borderColorId: 'primary',
          textStyleId: 'body',
          borderWidth: 0,
          radius: 6,
        },
      ],
    })

    assert.equal(migrated.color_palette_id, 'brand')
    assert.equal(migrated.page_background_index, 3)
    assert.equal(migrated.body_text_index, 2)
    assert.equal(migrated.accent_1_index, 1)
    assert.equal(migrated.color_palettes[0]?.colors[0]?.value, '#344CE2')
    assert.equal((migrated.text_styles[0] as { colorIndex: number }).colorIndex, 2)
    assert.equal((migrated.text_styles[0] as { colorId?: string }).colorId, undefined)
    assert.equal((migrated.text_styles[0] as { colorPaletteId: string | null }).colorPaletteId, null)
    assert.equal((migrated.button_styles[0] as { backgroundColorIndex: number }).backgroundColorIndex, 1)
    assert.equal((migrated.button_styles[0] as { colorPaletteId: string | null }).colorPaletteId, null)

    const read = readThemeColorFields({
      color_palette_id: migrated.color_palette_id,
      page_background_index: migrated.page_background_index,
      surface_index: migrated.surface_index,
      body_text_index: migrated.body_text_index,
      accent_1_index: migrated.accent_1_index,
      accent_2_index: migrated.accent_2_index,
      color_palettes: migrated.color_palettes,
    })
    assert.equal(read.pageBackground, '#EFF3FA')
    assert.equal(read.bodyTextColor, '#17211D')
  })

  it('keeps an empty theme color slot empty', () => {
    const read = readThemeColorFields({
      color_palette_id: 'brand',
      page_background_index: null,
      surface_index: 1,
      body_text_index: null,
      accent_1_index: 1,
      accent_2_index: null,
      color_palettes: [{ id: 'brand', name: 'Brand', colors: [{ name: 'Ink', value: '#111111' }] }],
    })
    assert.equal(read.pageBackgroundIndex, null)
    assert.equal(read.bodyTextIndex, null)
    assert.equal(read.accent2Index, null)
    assert.equal(read.pageBackground, 'transparent')
    assert.equal(read.surfaceColor, '#111111')
    assert.equal(read.pageBackgroundPaletteIndex, null)
  })

  it('resolves a basic color from its own palette index', () => {
    const read = readThemeColorFields({
      color_palette_id: 'one',
      page_background_palette_index: 2,
      page_background_index: 2,
      surface_palette_index: null,
      surface_index: 1,
      body_text_index: 1,
      accent_1_index: 1,
      accent_2_index: null,
      color_palettes: [
        { id: 'one', name: 'One', colors: [{ name: 'A', value: '#111111' }] },
        { id: 'two', name: 'Two', colors: [{ name: 'B', value: '#222222' }, { name: 'C', value: '#333333' }] },
      ],
    })
    assert.equal(read.pageBackgroundPaletteIndex, 2)
    assert.equal(read.pageBackground, '#333333')
    assert.equal(read.surfacePaletteIndex, null)
    assert.equal(read.surfaceColor, '#111111')
    assert.equal(read.bodyTextColor, '#111111')
  })

  it('keeps a text style palette when it is not the basic palette', () => {
    const migrated = migrateThemeColorRecord({
      colors: [
        { id: 'a1', name: 'A', value: '#111111' },
        { id: 'b1', name: 'B', value: '#222222' },
      ],
      color_palettes: [
        { id: 'basic', name: 'Basic', colorIds: ['a1'] },
        { id: 'extra', name: 'Extra', colorIds: ['b1'] },
      ],
      color_roles: { pageBackgroundColorId: 'a1', bodyTextColorId: 'a1' },
      text_styles: [{ id: 'heading', name: 'Heading', colorId: 'b1', fontId: '', size: 32 }],
      button_styles: [],
    })
    assert.equal(migrated.color_palette_id, 'basic')
    assert.equal((migrated.text_styles[0] as { colorPaletteId: string }).colorPaletteId, 'extra')
    assert.equal((migrated.text_styles[0] as { colorIndex: number }).colorIndex, 1)
  })
})
