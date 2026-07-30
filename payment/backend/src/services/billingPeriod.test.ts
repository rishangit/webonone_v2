import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { periodAtIndex, periodsThroughNow } from './billingPeriod.js'

describe('billingPeriod', () => {
  it('anchors periods to activation day', () => {
    const activated = new Date('2026-03-15T10:22:00.000Z')
    const p0 = periodAtIndex(activated, 0, 'Asia/Colombo')
    const p1 = periodAtIndex(activated, 1, 'Asia/Colombo')
    assert.equal(p0.periodStart.toISOString().slice(0, 10), '2026-03-15')
    assert.equal(p0.periodEnd.toISOString().slice(0, 10), '2026-04-15')
    assert.equal(p1.periodStart.toISOString().slice(0, 10), '2026-04-15')
    assert.equal(p1.periodEnd.toISOString().slice(0, 10), '2026-05-15')
  })

  it('clamps missing day-of-month', () => {
    const activated = new Date('2026-01-31T05:00:00.000Z')
    const p1 = periodAtIndex(activated, 1, 'Asia/Colombo')
    assert.equal(p1.periodStart.toISOString().slice(0, 10), '2026-02-28')
  })

  it('includes current period through now', () => {
    const activated = new Date('2026-01-10T00:00:00.000Z')
    const now = new Date('2026-03-20T00:00:00.000Z')
    const periods = periodsThroughNow(activated, now, 'UTC')
    assert.equal(periods.length, 3)
  })
})
