import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ADDON_LAYOUT_LIMITS,
  clampRect,
  CONTENT_BLOCK_LAYOUT_LIMITS,
  documentContentHeight,
  pointerToRect,
  ROW_HEIGHT,
  snapRowSpan,
  snapToRow,
} from './layout'
import { emptyLayoutByBreakpoint, emptyWebsiteDocument } from '../types'

describe('documentContentHeight', () => {
  it('is 0 when there are no blocks', () => {
    assert.equal(documentContentHeight(emptyWebsiteDocument(), '2xl'), 0)
  })

  it('uses the lowest block edge, not the designer canvas height', () => {
    const document = emptyWebsiteDocument()
    document.container.height = 640
    document.blocks = [
      {
        id: 'a',
        zIndex: 0,
        layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 8, height: 80 }),
        addons: [],
      },
      {
        id: 'b',
        zIndex: 1,
        layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 6, top: 20, height: 40 }),
        addons: [],
      },
    ]
    assert.equal(documentContentHeight(document, '2xl'), 88)
  })
})

describe('row grid snap', () => {
  it('snapToRow rounds to the nearest 32px', () => {
    assert.equal(snapToRow(0), 0)
    assert.equal(snapToRow(15), 0)
    assert.equal(snapToRow(16), 32)
    assert.equal(snapToRow(40), 32)
    assert.equal(snapToRow(48), 64)
    assert.equal(snapToRow(49), 64)
  })

  it('snapRowSpan enforces a minimum row count', () => {
    assert.equal(snapRowSpan(10, 1), ROW_HEIGHT)
    assert.equal(snapRowSpan(80, 3), 96)
    assert.equal(snapRowSpan(96, 3), 96)
  })

  it('clampRect snaps top and height to row multiples', () => {
    const rect = clampRect({ col: 1, colSpan: 4, top: 17, height: 85 }, CONTENT_BLOCK_LAYOUT_LIMITS)
    assert.equal(rect.top, 32)
    assert.equal(rect.height, 96)
  })

  it('clampRect enforces addon min row span of 1 (32px)', () => {
    const rect = clampRect({ col: 1, colSpan: 2, top: 5, height: 20 }, ADDON_LAYOUT_LIMITS)
    assert.equal(rect.top, 0)
    assert.equal(rect.height, 32)
  })

  it('pointerToRect move snaps vertical position to rows', () => {
    const start = { col: 1, colSpan: 4, top: 32, height: 96 }
    const moved = pointerToRect(start, 0, 25, 1200, 'move', CONTENT_BLOCK_LAYOUT_LIMITS)
    assert.equal(moved.top % ROW_HEIGHT, 0)
    assert.equal(moved.height % ROW_HEIGHT, 0)
  })

  it('pointerToRect south resize snaps height to rows', () => {
    const start = { col: 1, colSpan: 4, top: 0, height: 96 }
    const resized = pointerToRect(start, 0, 20, 1200, 's', CONTENT_BLOCK_LAYOUT_LIMITS)
    assert.equal(resized.height % ROW_HEIGHT, 0)
    assert.equal(resized.height, 128)
  })

  it('pointerToRect southeast resize snaps both dimensions', () => {
    const start = { col: 1, colSpan: 4, top: 32, height: 96 }
    const resized = pointerToRect(start, 50, 18, 1200, 'se', ADDON_LAYOUT_LIMITS)
    assert.equal(resized.top % ROW_HEIGHT, 0)
    assert.equal(resized.height % ROW_HEIGHT, 0)
    assert.equal(resized.colSpan, 5)
  })
})
