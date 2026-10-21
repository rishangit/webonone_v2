import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { emptyLayoutByBreakpoint } from '../types'
import type { WebsiteBlock, WebsiteDocumentV1, WebsiteTheme } from '../types'
import { inheritPaletteId, paletteInheritedByAddon, paletteInheritedByBlock } from './palette'
import { paletteForColors } from '../utils/websitePalette'

function block(id: string, colorPaletteId: string | null, children: WebsiteBlock[] = []): WebsiteBlock {
  return {
    id,
    zIndex: 1,
    layout: emptyLayoutByBreakpoint(),
    addons: [],
    children,
    colorPaletteId,
  }
}

function document(blocks: WebsiteBlock[]): WebsiteDocumentV1 {
  return { version: 1, container: { height: 640 }, blocks }
}

const theme = {
  colorPaletteId: 'basic',
  colorPalettes: [
    { id: 'basic', name: 'Basic', colors: [] },
    { id: 'ocean', name: 'Ocean', colors: [] },
  ],
} as unknown as WebsiteTheme

describe('palette inheritance', () => {
  it('uses the parent palette until a child sets its own', () => {
    assert.equal(inheritPaletteId(null, 'ocean'), 'ocean')
    assert.equal(inheritPaletteId('sunset', 'ocean'), 'sunset')
    assert.equal(inheritPaletteId(undefined, null), null)
  })

  it('lets an element palette replace a style palette', () => {
    assert.equal(paletteForColors(theme, 'basic', 'ocean'), 'ocean')
    assert.equal(paletteForColors(theme, 'ocean', null), 'ocean')
    assert.equal(paletteForColors(theme, null, null), 'basic')
    assert.equal(paletteForColors(theme, 'missing', null), 'basic')
  })

  it('resolves nested blocks from the document root without copying the id', () => {
    const doc = document([
      block('parent', 'ocean', [block('child', null, [block('own', 'sunset')])]),
    ])
    assert.equal(paletteInheritedByBlock(doc, 'child', null), 'ocean')
    assert.equal(paletteInheritedByBlock(doc, 'own', null), 'ocean')
    assert.equal(paletteInheritedByAddon(doc, 'child', 'page'), 'ocean')
    assert.equal(paletteInheritedByBlock(doc, 'parent', 'page'), 'page')
  })

  it('starts slider template items from the slider palette', () => {
    const slide = block('slide', null, [block('card', null)])
    const host = block('host', null)
    host.addons = [
      {
        id: 'slider',
        type: 'slider',
        zIndex: 1,
        layout: emptyLayoutByBreakpoint(),
        colorPaletteId: 'ocean',
        props: { slideTemplate: slide },
      } as WebsiteBlock['addons'][number],
    ]
    const doc = document([host])
    assert.equal(
      paletteInheritedByBlock(doc, 'card', null, { hostBlockId: 'host', sliderAddonId: 'slider' }),
      'ocean',
    )
    assert.equal(
      paletteInheritedByAddon(doc, 'host', null, { sliderAddonId: 'slider', templateBlockId: 'card' }),
      'ocean',
    )
  })
})
