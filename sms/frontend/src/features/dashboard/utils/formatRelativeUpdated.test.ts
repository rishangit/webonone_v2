import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  formatRelativeUpdated,
  resolveSmsCreditsViewState,
} from './formatRelativeUpdated'

describe('formatRelativeUpdated', () => {
  const now = Date.parse('2026-10-06T12:00:00.000Z')

  it('formats minutes ago', () => {
    assert.equal(
      formatRelativeUpdated('2026-10-06T11:58:00.000Z', now),
      '2 minutes ago',
    )
  })

  it('returns null for missing/invalid', () => {
    assert.equal(formatRelativeUpdated(null, now), null)
    assert.equal(formatRelativeUpdated('not-a-date', now), null)
  })
})

describe('resolveSmsCreditsViewState', () => {
  it('uses loading before first success (never treats as zero balance)', () => {
    assert.deepEqual(
      resolveSmsCreditsViewState({
        status: 'loading',
        balance: null,
        configured: null,
        lastUpdated: null,
        error: null,
        hasLoaded: false,
      }),
      { kind: 'loading' },
    )
  })

  it('maps not configured', () => {
    assert.deepEqual(
      resolveSmsCreditsViewState({
        status: 'idle',
        balance: null,
        configured: false,
        lastUpdated: null,
        error: null,
        hasLoaded: true,
      }),
      { kind: 'not_configured' },
    )
  })

  it('maps error with retry path', () => {
    assert.deepEqual(
      resolveSmsCreditsViewState({
        status: 'error',
        balance: null,
        configured: null,
        lastUpdated: null,
        error: 'Unable to retrieve SMS balance',
        hasLoaded: true,
      }),
      { kind: 'error', message: 'Unable to retrieve SMS balance' },
    )
  })

  it('maps ready balance', () => {
    assert.deepEqual(
      resolveSmsCreditsViewState({
        status: 'idle',
        balance: 1245,
        configured: true,
        lastUpdated: '2026-10-06T07:30:00.000Z',
        error: null,
        hasLoaded: true,
      }),
      {
        kind: 'ready',
        balance: 1245,
        lastUpdated: '2026-10-06T07:30:00.000Z',
      },
    )
  })
})
