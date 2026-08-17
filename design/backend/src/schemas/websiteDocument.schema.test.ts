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
    assert.ok(parsed.container.height >= 80)
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
})
