import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ADDON_LAYOUT_LIMITS,
  clampRect,
  CONTENT_BLOCK_LAYOUT_LIMITS,
  documentContentHeight,
  pinchScaleFromSpans,
  resolveContainerHeight,
  writeContainerHeight,
  pinchToRect,
  pointerToRect,
  ROW_HEIGHT,
  snapRowSpan,
  snapToRow,
} from './layout'
import { emptyLayoutByBreakpoint, emptyWebsiteDocument } from '../types'

describe('container height by size', () => {
  it('keeps each screen size height when one size is resized', () => {
    const document = emptyWebsiteDocument()
    const sm = writeContainerHeight(document.container, 'sm', 320)
    const both = writeContainerHeight(sm, 'lg', 960)
    assert.equal(resolveContainerHeight(both, 'sm'), 320)
    assert.equal(resolveContainerHeight(both, 'lg'), 960)
    assert.equal(resolveContainerHeight(both, 'md'), document.container.height)
    assert.equal(resolveContainerHeight(both, 'xl'), document.container.height)
    assert.equal(resolveContainerHeight(both, '2xl'), document.container.height)
    assert.equal(both.height, document.container.height)
  })
})

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
        children: [],
      },
      {
        id: 'b',
        zIndex: 1,
        layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 6, top: 20, height: 40 }),
        addons: [],
        children: [],
      },
    ]
    assert.equal(documentContentHeight(document, '2xl'), 88)
  })
})

describe('row grid snap', () => {
  it('snapToRow rounds to the nearest row height', () => {
    assert.equal(snapToRow(0), 0)
    assert.equal(snapToRow(3), 0)
    assert.equal(snapToRow(8), 8)
    assert.equal(snapToRow(40), 40)
    assert.equal(snapToRow(48), 48)
    assert.equal(snapToRow(49), 48)
  })

  it('snapRowSpan enforces a minimum row count', () => {
    assert.equal(snapRowSpan(10, 1), ROW_HEIGHT)
    assert.equal(snapRowSpan(80, 3), 80)
    assert.equal(snapRowSpan(96, 3), 96)
  })

  it('clampRect snaps top and height to row multiples', () => {
    const rect = clampRect({ col: 1, colSpan: 4, top: 17, height: 85 }, CONTENT_BLOCK_LAYOUT_LIMITS)
    assert.equal(rect.top, 16)
    assert.equal(rect.height, 88)
  })

  it('clampRect allows content blocks down to colSpan 1', () => {
    const rect = clampRect({ col: 1, colSpan: 1, top: 0, height: 96 }, CONTENT_BLOCK_LAYOUT_LIMITS)
    assert.equal(rect.colSpan, 1)
  })

  it('clampRect enforces addon min row span of 1 (one row)', () => {
    const rect = clampRect({ col: 1, colSpan: 2, top: 5, height: 20 }, ADDON_LAYOUT_LIMITS)
    assert.equal(rect.top, 8)
    assert.equal(rect.height, 24)
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
    assert.equal(resized.height, 120)
  })

  it('pointerToRect southeast resize snaps both dimensions', () => {
    const start = { col: 1, colSpan: 4, top: 32, height: 96 }
    const resized = pointerToRect(start, 50, 18, 1200, 'se', ADDON_LAYOUT_LIMITS)
    assert.equal(resized.top % ROW_HEIGHT, 0)
    assert.equal(resized.height % ROW_HEIGHT, 0)
    assert.equal(resized.colSpan, 5)
  })

  it('pinchToRect scales from center and snaps to the grid', () => {
    const start = { col: 3, colSpan: 4, top: 32, height: 96 }
    const resized = pinchToRect(start, 2, 2, 1200, CONTENT_BLOCK_LAYOUT_LIMITS)
    assert.equal(resized.colSpan, 8)
    assert.equal(resized.height, 192)
    assert.equal(resized.top % ROW_HEIGHT, 0)
  })

  it('pinchScaleFromSpans follows each axis when spans are large enough', () => {
    const start = { spanX: 100, spanY: 80, distance: 128 }
    const current = { spanX: 150, spanY: 80, distance: 170 }
    const scale = pinchScaleFromSpans(start, current)
    assert.equal(scale.scaleX, 1.5)
    assert.equal(scale.scaleY, 1)
  })
})
