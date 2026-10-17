import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { websiteDocumentSchema } from '../schemas/websiteDocument.schema.ts'
import {
  COMPANY_NAME_TOKEN,
  FONT_LIBRARY,
  buildStarterTemplate,
  copyPresetDocument,
  linkHomeMenu,
  replaceCompanyName,
} from './websiteLibrary.ts'

describe('website library', () => {
  it('seeds about 20 fonts with a name, Google Font URL, and family', () => {
    assert.equal(FONT_LIBRARY.length, 20)
    const ids = new Set(FONT_LIBRARY.map((font) => font.id))
    assert.equal(ids.size, 20)
    for (const font of FONT_LIBRARY) {
      assert.ok(font.name.length > 0)
      assert.equal(font.family, font.name)
      assert.match(font.googleFontUrl, /^https:\/\/fonts\.googleapis\.com\/css2\?family=/)
    }
    assert.ok(FONT_LIBRARY.some((font) => font.id === 'inter'))
    assert.ok(FONT_LIBRARY.some((font) => font.id === 'playfair-display'))
  })

  it('builds starter presets from content elements and addons', () => {
    const starter = buildStarterTemplate()
    assert.equal(starter.presets.length, 3)
    for (const preset of starter.presets) {
      const parsed = websiteDocumentSchema.parse(preset.document)
      assert.equal(parsed.blocks.length, 1)
      assert.ok(parsed.blocks[0]!.addons.length > 0)
    }
    const welcome = starter.presets.find((preset) => preset.slug === 'welcome')
    const types = welcome!.document.blocks[0]!.addons.map((addon) => addon.type)
    assert.deepEqual(types, ['text', 'text', 'button'])
    const header = starter.presets.find((preset) => preset.slug === 'site-header')
    assert.deepEqual(
      header!.document.blocks[0]!.addons.map((addon) => addon.type),
      ['text', 'menu'],
    )
  })

  it('replaces the company name and assigns new ids when copying a preset', () => {
    const starter = buildStarterTemplate()
    const welcome = starter.presets.find((preset) => preset.slug === 'welcome')!
    const named = replaceCompanyName(welcome.document, 'Northwind')
    const heading = named.blocks[0]!.addons.find((addon) => addon.type === 'text')
    assert.equal(heading && heading.type === 'text' ? heading.props.content : '', 'Northwind')
    assert.equal(JSON.stringify(named).includes(COMPANY_NAME_TOKEN), false)

    const copied = copyPresetDocument(named)
    assert.notEqual(copied.blocks[0]!.id, named.blocks[0]!.id)
    assert.notEqual(copied.blocks[0]!.addons[0]!.id, named.blocks[0]!.addons[0]!.id)

    const header = starter.presets.find((preset) => preset.slug === 'site-header')!
    const linked = linkHomeMenu(header.document, 'home-page-id-0000001')
    const menu = linked.blocks[0]!.addons.find((addon) => addon.type === 'menu')
    assert.equal(menu && menu.type === 'menu' ? menu.props.items[0]?.linkPageId : null, 'home-page-id-0000001')
  })
})
