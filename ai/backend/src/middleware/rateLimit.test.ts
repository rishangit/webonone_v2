import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createMemoryRateLimiter } from './rateLimit.js'

describe('memory rate limiter', () => {
  it('allows up to max hits then denies', () => {
    const limiter = createMemoryRateLimiter({ max: 2, windowMs: 60_000 })
    assert.equal(limiter.allow('a'), true)
    assert.equal(limiter.allow('a'), true)
    assert.equal(limiter.allow('a'), false)
    assert.equal(limiter.allow('b'), true)
  })
})
