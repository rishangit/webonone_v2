import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { documentContentHeight } from './layout'
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
