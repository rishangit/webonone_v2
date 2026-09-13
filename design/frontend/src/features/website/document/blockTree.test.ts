import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { emptyLayoutByBreakpoint, emptyWebsiteDocument } from '../types'
import type { WebsiteBlock, WebsiteDocumentV1 } from '../types'
import {
  addBlock,
  cloneBlockTree,
  deleteBlock,
  documentFromBlock,
  duplicateAddon,
  duplicateBlock,
  findBlock,
  insertBlocksFromPreset,
  stripNestedSliders,
} from './blockTree'
import { ROW_HEIGHT } from './layout'

function textAddon(id: string, content: string) {
  return {
    id,
    type: 'text' as const,
    zIndex: 0,
    layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 32 }),
    props: {
      textStyleId: '',
      content,
      snapshot: { fontFamily: 'inherit', size: 16, color: '#111827' },
    },
  }
}

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

describe('nested content elements', () => {
  it('adds a child content element under a selected parent', () => {
    let document = emptyWebsiteDocument()
    document = addBlock(document)
    const parentId = document.blocks[0]!.id
    document = addBlock(document, parentId)
    const parent = findBlock(document, parentId)
    assert.equal(parent?.children.length, 1)
    assert.equal(document.blocks.length, 1)
  })

  it('inserts preset blocks as children with reminted ids', () => {
    let document = emptyWebsiteDocument()
    document = addBlock(document)
    const parentId = document.blocks[0]!.id

    const preset: WebsiteDocumentV1 = {
      version: 1,
      container: { height: 640 },
      blocks: [
        blockWith('preset-a', { addons: [textAddon('ta', 'A')], zIndex: 0 }),
        blockWith('preset-b', {
          zIndex: 1,
          children: [blockWith('preset-b-child', { addons: [textAddon('tb', 'B')] })],
        }),
      ],
    }

    document = insertBlocksFromPreset(document, parentId, preset)
    const parent = findBlock(document, parentId)
    assert.equal(parent?.children.length, 2)
    assert.notEqual(parent?.children[0]?.id, 'preset-a')
    assert.notEqual(parent?.children[1]?.id, 'preset-b')
    assert.equal(parent?.children[0]?.addons[0]?.type, 'text')
    assert.notEqual(parent?.children[0]?.addons[0]?.id, 'ta')
    assert.equal(parent?.children[1]?.children.length, 1)
    assert.notEqual(parent?.children[1]?.children[0]?.id, 'preset-b-child')
  })

  it('inserts preset blocks at root when no parent is selected', () => {
    const preset: WebsiteDocumentV1 = {
      version: 1,
      container: { height: 640 },
      blocks: [blockWith('p1'), blockWith('p2', { zIndex: 1 })],
    }
    const document = insertBlocksFromPreset(emptyWebsiteDocument(), null, preset)
    assert.equal(document.blocks.length, 2)
    assert.notEqual(document.blocks[0]?.id, 'p1')
  })

  it('deletes a nested block without removing the parent', () => {
    let document = emptyWebsiteDocument()
    document = addBlock(document)
    const parentId = document.blocks[0]!.id
    document = addBlock(document, parentId)
    const childId = findBlock(document, parentId)!.children[0]!.id
    document = deleteBlock(document, childId)
    assert.equal(findBlock(document, parentId)?.children.length, 0)
    assert.ok(findBlock(document, parentId))
  })

  it('documentFromBlock preserves nested children', () => {
    const source = blockWith('root', {
      children: [blockWith('child', { addons: [textAddon('t1', 'Nested')] })],
    })
    const asPreset = documentFromBlock(source)
    assert.equal(asPreset.blocks.length, 1)
    assert.equal(asPreset.blocks[0]?.children.length, 1)
    assert.notEqual(asPreset.blocks[0]?.id, 'root')
    assert.notEqual(asPreset.blocks[0]?.children[0]?.id, 'child')
    assert.equal(asPreset.blocks[0]?.children[0]?.addons[0]?.type, 'text')
  })

  it('stamps groupName from preset name when root block has none', () => {
    const preset: WebsiteDocumentV1 = {
      version: 1,
      container: { height: 640 },
      blocks: [blockWith('p1')],
    }
    const document = insertBlocksFromPreset(emptyWebsiteDocument(), null, preset, null, 'Product Card')
    assert.equal(document.blocks[0]?.groupName, 'product-card')
  })

  it('preserves existing groupName when inserting a preset', () => {
    const preset: WebsiteDocumentV1 = {
      version: 1,
      container: { height: 640 },
      blocks: [blockWith('p1', { groupName: 'custom-card' })],
    }
    const document = insertBlocksFromPreset(emptyWebsiteDocument(), null, preset, null, 'Product Card')
    assert.equal(document.blocks[0]?.groupName, 'custom-card')
  })
})

describe('duplicateBlock / duplicateAddon', () => {
  it('duplicates a nested block with children, chrome, and reminted ids after the source', () => {
    const source = blockWith('root', {
      backgroundColor: '#fff',
      borderRadius: 'md',
      padding: 2,
      children: [
        blockWith('child', {
          backgroundColor: '#eee',
          addons: [textAddon('t1', 'Hello')],
        }),
      ],
    })
    let document: WebsiteDocumentV1 = {
      version: 1,
      container: { height: 640 },
      blocks: [source, blockWith('other', { zIndex: 1, layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 200, height: 80 }) })],
    }

    const result = duplicateBlock(document, 'root')
    assert.ok(result)
    document = result.document
    assert.equal(document.blocks.length, 3)
    assert.equal(document.blocks[0]?.id, 'root')
    assert.equal(document.blocks[1]?.id, result.id)
    assert.notEqual(result.id, 'root')
    const clone = document.blocks[1]!
    assert.equal(clone.backgroundColor, '#fff')
    assert.equal(clone.borderRadius, 'md')
    assert.equal(clone.padding, 2)
    assert.equal(clone.children.length, 1)
    assert.notEqual(clone.children[0]?.id, 'child')
    assert.equal(clone.children[0]?.addons[0]?.type, 'text')
    assert.notEqual(clone.children[0]?.addons[0]?.id, 't1')
    assert.equal(clone.layout['2xl'].top, source.layout['2xl'].top + ROW_HEIGHT)
    assert.equal(document.blocks[2]?.id, 'other')
  })

  it('duplicates an addon after the source with offset layout', () => {
    let document: WebsiteDocumentV1 = {
      version: 1,
      container: { height: 640 },
      blocks: [
        blockWith('host', {
          addons: [
            textAddon('a1', 'One'),
            { ...textAddon('a2', 'Two'), zIndex: 1 },
          ],
        }),
      ],
    }
    const sourceTop = document.blocks[0]!.addons[0]!.layout['2xl'].top
    const result = duplicateAddon(document, 'host', 'a1')
    assert.ok(result)
    document = result.document
    const addons = [...document.blocks[0]!.addons].sort((a, b) => a.zIndex - b.zIndex)
    assert.equal(addons.length, 3)
    assert.equal(addons[0]?.id, 'a1')
    assert.equal(addons[1]?.id, result.id)
    assert.equal(addons[2]?.id, 'a2')
    assert.notEqual(result.id, 'a1')
    if (addons[1]?.type === 'text') {
      assert.equal(addons[1].props.content, 'One')
    }
    assert.equal(addons[1]?.layout['2xl'].top, sourceTop + ROW_HEIGHT)
  })
})

describe('cloneBlockTree preset into slider template', () => {
  it('preserves nested slider addons when allowedTypes is null', () => {
    const presetRoot = blockWith('preset-root', {
      groupName: 'product-image-slider',
      addons: [
        {
          id: 'nested-slider',
          type: 'slider' as const,
          zIndex: 0,
          layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 120 }),
          props: {
            slideTemplate: blockWith('inner-shell', {
              children: [blockWith('inner-card', { groupName: 'gallery-item' })],
            }),
            dataSource: 'parent' as const,
            datasetId: null,
            itemsPath: 'galleryImages',
            itemGroup: null,
            manualSlides: [],
            showNavigation: true,
            autoSlide: false,
          },
        },
      ],
    })

    const cloned = stripNestedSliders(cloneBlockTree(presetRoot, 0, null))
    assert.equal(cloned.addons.length, 1)
    assert.equal(cloned.addons[0]?.type, 'slider')
    if (cloned.addons[0]?.type === 'slider') {
      assert.ok(cloned.addons[0].props.slideTemplate)
      assert.equal(cloned.addons[0].props.slideTemplate?.children?.length, 1)
    }
  })

  it('drops slider addons when allowedTypes excludes slider', () => {
    const presetRoot = blockWith('preset-root', {
      addons: [
        {
          id: 'nested-slider',
          type: 'slider' as const,
          zIndex: 0,
          layout: emptyLayoutByBreakpoint(),
          props: {
            slideTemplate: null,
            dataSource: 'manual' as const,
            datasetId: null,
            itemGroup: null,
            manualSlides: [],
            showNavigation: true,
            autoSlide: false,
          },
        },
      ],
    })

    const allowed = new Set(['image', 'text', 'button', 'menu'] as const)
    const cloned = cloneBlockTree(presetRoot, 0, allowed)
    assert.equal(cloned.addons.length, 0)
  })
})
