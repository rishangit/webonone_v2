import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  emptyWebsiteDocument,
  websiteDocumentSchema,
} from './websiteDocument.schema.ts'

describe('websiteDocumentSchema', () => {
  it('accepts an empty document', () => {
    const parsed = websiteDocumentSchema.parse(emptyWebsiteDocument())
    assert.equal(parsed.version, 1)
    assert.equal(parsed.blocks.length, 0)
    assert.ok(parsed.container.height >= 64)
  })

  it('rejects a block that overflows the 12-column grid', () => {
    const result = websiteDocumentSchema.safeParse({
      version: 1,
      container: { height: 640 },
      blocks: [
        {
          id: 'b1',
          zIndex: 0,
          layout: { '2xl': { col: 10, colSpan: 4, top: 0, height: 80 } },
          addons: [],
        },
      ],
    })
    assert.equal(result.success, false)
  })

  it('accepts a document with a menu addon', () => {
    const parsed = websiteDocumentSchema.parse({
      version: 1,
      container: { height: 640 },
      blocks: [
        {
          id: 'b1',
          zIndex: 0,
          layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 48 } },
          addons: [
            {
              id: 'm1',
              type: 'menu',
              zIndex: 0,
              layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 48 } },
              props: {
                displayByBreakpoint: {
                  '2xl': { mode: 'inline', align: 'start' },
                  sm: { mode: 'hamburger', align: 'start', panelSide: 'left' },
                },
                items: [
                  {
                    id: 'i1',
                    label: 'Home',
                    textStyleId: 'ts1',
                    linkPageId: 'p1',
                    children: [
                      {
                        id: 's1',
                        label: 'About',
                        textStyleId: 'ts2',
                        linkPageId: 'p2',
                        children: [],
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ],
    })
    assert.equal(parsed.blocks[0]?.addons[0]?.type, 'menu')
  })
})
