import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { emptyLayoutByBreakpoint, emptyWebsiteDocument } from '../types'
import type { WebsiteBlock, WebsiteDocumentV1 } from '../types'
import {
  blockTreeLabel,
  collapseKeysForTemplateSelection,
  findBlockPathInTree,
  listSlideTemplateTreeChildren,
  templateCollapseKeysForPath,
} from './contentTreeModel'

function blockWith(id: string, overrides: Partial<WebsiteBlock> = {}): WebsiteBlock {
  return {
    id,
    zIndex: 0,
    layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 16, height: 160 }),
    addons: [],
    children: [],
    ...overrides,
  }
}

function nestedPresetFixture(): WebsiteDocumentV1 {
  const imageAddon = {
    id: 'img',
    type: 'image' as const,
    zIndex: 0,
    layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 80 }),
    props: { mediaByBreakpoint: {}, fit: 'cover' as const, heightMode: 'auto' as const },
  }

  const innerShell = blockWith('inner-shell', {
    children: [blockWith('inner-card', { groupName: 'gallery-item', addons: [imageAddon] })],
  })

  const innerSlider = {
    id: 'inner-slider',
    type: 'slider' as const,
    zIndex: 0,
    layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 120 }),
    props: {
      slideTemplate: innerShell,
      dataSource: 'parent' as const,
      datasetId: null,
      itemsPath: 'galleryImages',
      itemGroup: null,
      manualSlides: [],
      showNavigation: true,
      autoSlide: false,
    },
  }

  const imagePresetBlock = blockWith('image-preset', {
    groupName: 'product-image-slider',
    addons: [innerSlider],
  })

  const item2Block = blockWith('item-2', {
    groupName: 'product-item-2',
    children: [imagePresetBlock],
  })

  const outerShell = blockWith('outer-shell', { children: [item2Block] })

  const outerSlider = {
    id: 'outer-slider',
    type: 'slider' as const,
    zIndex: 0,
    layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 240 }),
    props: {
      slideTemplate: outerShell,
      dataSource: 'dataset' as const,
      datasetId: 'ds1',
      itemGroup: 'product-item-2',
      manualSlides: [],
      showNavigation: true,
      autoSlide: false,
    },
  }

  return {
    version: 1,
    container: { height: 640 },
    blocks: [blockWith('host', { addons: [outerSlider] })],
  }
}

describe('listSlideTemplateTreeChildren', () => {
  it('returns shell addons and child blocks without the shell row', () => {
    const shell = blockWith('shell', {
      addons: [
        {
          id: 'legacy',
          type: 'text',
          zIndex: 0,
          layout: emptyLayoutByBreakpoint(),
          props: { textStyleId: '', content: 'x', snapshot: { fontFamily: 'inherit', size: 16, color: '#111' } },
        },
      ],
      children: [blockWith('child-a', { groupName: 'card' })],
    })
    const result = listSlideTemplateTreeChildren(shell)
    assert.equal(result.legacyShellAddons.length, 1)
    assert.equal(result.blocks.length, 1)
    assert.equal(result.blocks[0]?.groupName, 'card')
  })
})

describe('findBlockPathInTree', () => {
  it('returns path to deeply nested preset block', () => {
    const doc = nestedPresetFixture()
    const host = doc.blocks[0]!
    const outerSlider = host.addons[0]
    assert.equal(outerSlider?.type, 'slider')
    if (outerSlider?.type !== 'slider') return

    const slideTemplate = outerSlider.props.slideTemplate!
    const path = findBlockPathInTree(slideTemplate, 'image-preset')
    assert.equal(path.length, 3)
    assert.equal(path[0]?.id, 'outer-shell')
    assert.equal(path[1]?.id, 'item-2')
    assert.equal(path[2]?.id, 'image-preset')
  })
})

describe('blockTreeLabel', () => {
  it('includes group name when set', () => {
    assert.equal(blockTreeLabel(blockWith('x', { groupName: 'product-item-2' }), 'Block'), 'Block · product-item-2')
  })
})

describe('collapseKeysForTemplateSelection', () => {
  it('includes ancestor template keys for deep templateBlock selection', () => {
    const doc = nestedPresetFixture()
    const keys = collapseKeysForTemplateSelection(doc, {
      kind: 'templateBlock',
      hostBlockId: 'host',
      sliderAddonId: 'outer-slider',
      templateBlockId: 'image-preset',
    })
    assert.ok(keys.includes('addon:outer-slider'))
    assert.ok(keys.includes('template:outer-shell'))
    assert.ok(keys.includes('template:item-2'))
    assert.ok(keys.includes('template:image-preset'))
  })

  it('includes nested slider keys for deep templateAddon selection', () => {
    const doc = nestedPresetFixture()
    const keys = collapseKeysForTemplateSelection(doc, {
      kind: 'templateAddon',
      hostBlockId: 'host',
      sliderAddonId: 'outer-slider',
      templateBlockId: 'inner-card',
      templateAddonId: 'img',
    })
    assert.ok(keys.includes('template:item-2'))
    assert.ok(keys.includes('template:image-preset'))
    assert.ok(keys.includes('template-slider:inner-slider'))
  })
})

describe('templateCollapseKeysForPath', () => {
  it('maps each block in path to a collapse key', () => {
    const keys = templateCollapseKeysForPath([
      blockWith('a'),
      blockWith('b'),
    ])
    assert.deepEqual(keys, ['template:a', 'template:b'])
  })
})
