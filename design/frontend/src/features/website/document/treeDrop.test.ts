import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { moveAddon, moveBlock } from './blockTree'
import { emptyLayoutByBreakpoint, emptyWebsiteDocument } from '../types'
import type { WebsiteBlock, WebsiteDocumentV1 } from '../types'
import {
  addonDropMove,
  blockDropMove,
  hintForAddonRow,
  hintForBlockRow,
  placementFromPointer,
  siblingInsertIndex,
  type TreeDrag,
} from './treeDrop'

function textAddon(id: string) {
  return {
    id,
    type: 'text' as const,
    zIndex: 0,
    layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 32 }),
    props: {
      textStyleId: '',
      content: id,
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

function ids(blocks: WebsiteBlock[]) {
  return [...blocks].sort((a, b) => a.zIndex - b.zIndex).map((block) => block.id)
}

describe('tree drop placement', () => {
  it('uses the row edges to reorder and the middle of a block to nest', () => {
    assert.equal(placementFromPointer(0.1, true), 'before')
    assert.equal(placementFromPointer(0.5, true), 'inside')
    assert.equal(placementFromPointer(0.9, true), 'after')
    assert.equal(placementFromPointer(0.2, false), 'before')
    assert.equal(placementFromPointer(0.8, false), 'after')
  })

  it('shifts the insert index when the source row is removed from the same list', () => {
    assert.equal(siblingInsertIndex(0, 2, 'before', true), 1)
    assert.equal(siblingInsertIndex(0, 2, 'after', true), 2)
    assert.equal(siblingInsertIndex(2, 0, 'before', true), 0)
    assert.equal(siblingInsertIndex(2, 0, 'after', true), 1)
    assert.equal(siblingInsertIndex(-1, 1, 'after', false), 2)
  })
})

describe('tree drop hints', () => {
  const blockDrag: TreeDrag = { kind: 'block', blockId: 'a', parentBlockId: null, index: 0 }

  it('highlights a block when an add-on will drop inside it', () => {
    const hint = hintForBlockRow({
      drag: { kind: 'addon', blockId: 'a', addonId: 't', index: 0 },
      zone: 'before',
      blockId: 'b',
      parentBlockId: null,
      blockIndex: 1,
      parentIsInsideDrag: false,
      blockIsInsideDrag: false,
    })
    assert.deepEqual(hint, { treeId: 'block:b', placement: 'inside' })
  })

  it('draws a sibling line when a block is dragged to the edge of another block', () => {
    const hint = hintForBlockRow({
      drag: blockDrag,
      zone: 'after',
      blockId: 'b',
      parentBlockId: null,
      blockIndex: 1,
      parentIsInsideDrag: false,
      blockIsInsideDrag: false,
    })
    assert.deepEqual(hint, { treeId: 'block:b', placement: 'after' })
  })

  it('refuses to nest a block into itself', () => {
    const hint = hintForBlockRow({
      drag: blockDrag,
      zone: 'inside',
      blockId: 'a',
      parentBlockId: null,
      blockIndex: 0,
      parentIsInsideDrag: false,
      blockIsInsideDrag: true,
    })
    assert.equal(hint, null)
  })

  it('shows a line between add-ons and a parent border when a block hovers an add-on', () => {
    assert.deepEqual(
      hintForAddonRow({
        drag: { kind: 'addon', blockId: 'a', addonId: 't1', index: 0 },
        zone: 'after',
        addonId: 't2',
        addonIndex: 2,
        hostBlockId: 'a',
        hostIsInsideDrag: false,
      }),
      { treeId: 'addon:t2', placement: 'after' },
    )
    assert.deepEqual(
      hintForAddonRow({
        drag: { kind: 'block', blockId: 'b', parentBlockId: null, index: 1 },
        zone: 'before',
        addonId: 't2',
        addonIndex: 0,
        hostBlockId: 'a',
        hostIsInsideDrag: false,
      }),
      { treeId: 'block:a', placement: 'inside' },
    )
  })
})

describe('tree drop moves', () => {
  it('reorders root blocks to the line between siblings', () => {
    const document: WebsiteDocumentV1 = {
      ...emptyWebsiteDocument(),
      blocks: [
        blockWith('a'),
        blockWith('b', { zIndex: 1 }),
        blockWith('c', { zIndex: 2 }),
      ],
    }
    const move = blockDropMove({
      drag: { kind: 'block', blockId: 'a', parentBlockId: null, index: 0 },
      zone: 'after',
      blockId: 'c',
      parentBlockId: null,
      blockIndex: 2,
      childCount: 0,
      addonCount: 0,
      parentIsInsideDrag: false,
      blockIsInsideDrag: false,
    })
    assert.ok(move && move.kind === 'block')
    const next = moveBlock(document, move.blockId, move.toParentId, move.toIndex)
    assert.deepEqual(ids(next.blocks), ['b', 'c', 'a'])
  })

  it('nests a block when the pointer is in the middle of a block row', () => {
    const document: WebsiteDocumentV1 = {
      ...emptyWebsiteDocument(),
      blocks: [blockWith('a'), blockWith('b', { zIndex: 1 })],
    }
    const move = blockDropMove({
      drag: { kind: 'block', blockId: 'b', parentBlockId: null, index: 1 },
      zone: 'inside',
      blockId: 'a',
      parentBlockId: null,
      blockIndex: 0,
      childCount: 0,
      addonCount: 0,
      parentIsInsideDrag: false,
      blockIsInsideDrag: false,
    })
    assert.ok(move && move.kind === 'block')
    const next = moveBlock(document, move.blockId, move.toParentId, move.toIndex)
    assert.deepEqual(ids(next.blocks), ['a'])
    assert.deepEqual(ids(next.blocks[0]?.children ?? []), ['b'])
  })

  it('reorders add-ons to the line between siblings', () => {
    const document: WebsiteDocumentV1 = {
      ...emptyWebsiteDocument(),
      blocks: [
        blockWith('host', {
          addons: [textAddon('a1'), { ...textAddon('a2'), zIndex: 1 }, { ...textAddon('a3'), zIndex: 2 }],
        }),
      ],
    }
    const move = addonDropMove({
      drag: { kind: 'addon', blockId: 'host', addonId: 'a1', index: 0 },
      zone: 'after',
      addonId: 'a3',
      addonIndex: 2,
      hostBlockId: 'host',
      hostIsInsideDrag: false,
    })
    assert.ok(move && move.kind === 'addon')
    const next = moveAddon(document, move.fromBlockId, move.addonId, move.toBlockId, move.toIndex)
    const addons = [...next.blocks[0]!.addons].sort((a, b) => a.zIndex - b.zIndex).map((addon) => addon.id)
    assert.deepEqual(addons, ['a2', 'a3', 'a1'])
  })
})
