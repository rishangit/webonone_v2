import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { consumeStockBodySchema } from '../schemas/stocks.schema.js'

describe('consumeStockBodySchema', () => {
  it('accepts positive quantity', () => {
    const parsed = consumeStockBodySchema.parse({ quantity: 2 })
    assert.equal(parsed.quantity, 2)
  })

  it('rejects zero quantity', () => {
    assert.throws(() => consumeStockBodySchema.parse({ quantity: 0 }))
  })

  it('rejects negative quantity', () => {
    assert.throws(() => consumeStockBodySchema.parse({ quantity: -1 }))
  })
})
