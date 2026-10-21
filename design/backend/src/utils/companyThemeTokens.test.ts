import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  COMPANY_TOKEN_TABLE,
  LIBRARY_TOKEN_TABLE,
  companyItemSource,
  companyTokenInsert,
  companyTokenUpdate,
  hydrateCompanyTokenRows,
  planCompanyThemeTokens,
  remapDocumentTokenIds,
} from './companyThemeTokens.js'
import type { WebsiteButtonStyle, WebsiteFontToken, WebsiteTextStyle, WebsiteThemeColorPalette } from '../schemas/websiteThemes.schema.js'

const emptyOwned = { font: [], color: [], text: [], button: [] }
const emptyNames = { font: [], color: [], text: [], button: [] }
const emptyTaken = { font: new Set<string>(), color: new Set<string>(), text: new Set<string>(), button: new Set<string>() }

function libraryIds(ids: Partial<Record<'font' | 'color' | 'text' | 'button', string[]>> = {}) {
  return {
    font: new Set(ids.font ?? []),
    color: new Set(ids.color ?? []),
    text: new Set(ids.text ?? []),
    button: new Set(ids.button ?? []),
  }
}

const font: WebsiteFontToken = { id: 'font-body', name: 'Body', googleFontUrl: 'https://fonts.example/body', family: 'Body', sourceLibraryId: 'lib-font' }
const palette: WebsiteThemeColorPalette = {
  id: 'palette-brand',
  name: 'Brand',
  sourceLibraryPaletteId: 'lib-palette',
  colors: [{ name: 'Ink', value: '#111111' }],
}
const text: WebsiteTextStyle = {
  id: 'text-body',
  name: 'Body',
  fontId: 'font-body',
  size: 16,
  colorIndex: 1,
  colorPaletteId: 'palette-brand',
  sourceLibraryId: 'lib-text',
}
const button: WebsiteButtonStyle = {
  id: 'button-primary',
  name: 'Primary',
  colorPaletteId: 'palette-brand',
  backgroundColorIndex: 1,
  textColorIndex: 1,
  textStyleId: 'text-body',
  borderColorIndex: 1,
  borderWidth: 0,
  radius: 6,
  sourceLibraryId: 'lib-button',
}

describe('company theme token copies', () => {
  it('keeps a free id and stores the library id only on insert', () => {
    const planned = planCompanyThemeTokens({
      align: 'id',
      fonts: [font],
      colorPalettes: [palette],
      textStyles: [text],
      buttonStyles: [button],
      colorPaletteId: 'palette-brand',
      owned: emptyOwned,
      takenIds: emptyTaken,
      reservedNames: emptyNames,
      libraryIds: libraryIds({ font: ['lib-font'], color: ['lib-palette'], text: ['lib-text'], button: ['lib-button'] }),
      createId: () => 'new-id',
    })
    assert.deepEqual(planned.fontIds, ['font-body'])
    assert.equal(planned.colorPaletteId, 'palette-brand')
    const inserted = planned.writes.filter((write) => write.mode === 'insert')
    assert.equal(inserted.find((write) => write.kind === 'color')?.sourceLibraryId, 'lib-palette')
    assert.equal(inserted.find((write) => write.kind === 'text')?.sourceLibraryId, 'lib-text')
    const update = companyTokenUpdate({ ...inserted[0]!, mode: 'update' })
    assert.equal('source_library_id' in update, false)
    assert.equal(companyItemSource(null), null)
    assert.equal(companyItemSource('lib-theme'), 'lib-theme')
  })

  it('mints a new id when the incoming id is already taken and remaps style links', () => {
    const planned = planCompanyThemeTokens({
      align: 'id',
      fonts: [font],
      colorPalettes: [palette],
      textStyles: [text],
      buttonStyles: [button],
      colorPaletteId: 'palette-brand',
      owned: emptyOwned,
      takenIds: {
        font: new Set(['font-body']),
        color: new Set(['palette-brand']),
        text: new Set(['text-body']),
        button: new Set(['button-primary']),
      },
      reservedNames: emptyNames,
      libraryIds: libraryIds({ color: ['lib-palette'], text: ['lib-text'], button: ['lib-button'] }),
      createId: sequence(['font-2', 'palette-2', 'text-2', 'button-2']),
    })
    assert.deepEqual(planned.fontIds, ['font-2'])
    assert.deepEqual(planned.paletteIds, ['palette-2'])
    assert.equal(planned.colorPaletteId, 'palette-2')
    const textWrite = planned.writes.find((write) => write.kind === 'text')
    const buttonWrite = planned.writes.find((write) => write.kind === 'button')
    assert.equal(textWrite?.definition?.fontId, 'font-2')
    assert.equal(textWrite?.definition?.colorPaletteId, 'palette-2')
    assert.equal(buttonWrite?.definition?.textStyleId, 'text-2')
    assert.equal(planned.remap.text['text-body'], 'text-2')
    assert.equal(planned.remap.button['button-primary'], 'button-2')
    const row = companyTokenInsert(textWrite!, 'company-1', 'user-1')
    assert.equal(row.source_library_id, 'lib-text')
    assert.equal(row.company_id, 'company-1')
  })

  it('keeps the company row id when a library snapshot is applied by index', () => {
    const planned = planCompanyThemeTokens({
      align: 'index',
      fonts: [font],
      colorPalettes: [palette],
      textStyles: [text],
      buttonStyles: [],
      colorPaletteId: 'palette-brand',
      currentIds: { fontIds: ['owned-font'], paletteIds: ['owned-palette'], textStyleIds: ['owned-text'], buttonStyleIds: [] },
      owned: {
        font: [{ id: 'owned-font', name: 'Body' }],
        color: [{ id: 'owned-palette', name: 'Brand' }],
        text: [{ id: 'owned-text', name: 'Body' }],
        button: [],
      },
      takenIds: {
        font: new Set(['owned-font', 'font-body']),
        color: new Set(['owned-palette', 'palette-brand']),
        text: new Set(['owned-text', 'text-body']),
        button: new Set(),
      },
      reservedNames: { font: ['Body'], color: ['Brand'], text: ['Body'], button: [] },
      libraryIds: libraryIds(),
      createId: () => 'unused',
    })
    assert.deepEqual(planned.fontIds, ['owned-font'])
    assert.deepEqual(planned.textStyleIds, ['owned-text'])
    const textWrite = planned.writes.find((write) => write.kind === 'text')
    assert.equal(textWrite?.mode, 'update')
    assert.equal(textWrite?.definition?.fontId, 'owned-font')
    assert.equal(companyTokenUpdate(textWrite!).source_library_id, undefined)
  })

  it('hydrates company rows without reading the library payload', () => {
    const hydrated = hydrateCompanyTokenRows({
      fontIds: ['owned-font'],
      paletteIds: ['owned-palette'],
      textStyleIds: ['owned-text'],
      buttonStyleIds: [],
      fonts: [{ id: 'owned-font', name: 'Body', google_font_url: 'https://fonts.example/body', family: 'Body', source_library_id: 'lib-font' }],
      colors: [{ id: 'owned-palette', name: 'Brand', palette: { colors: [{ name: 'Ink', value: '#111111' }] }, source_library_id: 'lib-palette' }],
      texts: [{ id: 'owned-text', name: 'Body', definition: { fontId: 'owned-font', size: 16, colorIndex: 1 }, source_library_id: 'lib-text' }],
      buttons: [],
    })
    assert.equal(hydrated.fonts[0]?.sourceLibraryId, 'lib-font')
    assert.equal(hydrated.colorPalettes[0]?.sourceLibraryPaletteId, 'lib-palette')
    assert.equal(hydrated.textStyles[0]?.sourceLibraryId, 'lib-text')
    assert.equal(hydrated.textStyles[0]?.fontId, 'owned-font')
  })

  it('remaps nested document style ids and leaves other ids alone', () => {
    const document = remapDocumentTokenIds(
      {
        blocks: [{ props: { textStyleId: 'text-body', buttonStyleId: 'button-primary', colorPaletteId: 'palette-1', id: 'block-1' } }],
      },
      { text: { 'text-body': 'text-2' }, button: { 'button-primary': 'button-2' }, color: { 'palette-1': 'palette-2' } },
    )
    const props = document.blocks[0]?.props
    assert.equal(props?.textStyleId, 'text-2')
    assert.equal(props?.buttonStyleId, 'button-2')
    assert.equal(props?.colorPaletteId, 'palette-2')
    assert.equal(props?.id, 'block-1')
  })

  it('writes company token tables and never the library tables', () => {
    assert.deepEqual(Object.values(COMPANY_TOKEN_TABLE), [
      'design_website_color',
      'design_website_button',
      'design_website_font',
      'design_website_text',
    ])
    for (const table of Object.values(COMPANY_TOKEN_TABLE)) assert.equal(table.includes('library'), false)
    assert.equal(LIBRARY_TOKEN_TABLE.text, 'design_website_library_text')
  })
})

function sequence(ids: string[]) {
  let index = 0
  return () => ids[index++] ?? `extra-${index}`
}
