import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildScheduledSessionInstant,
  resolveSessionControlEnded,
  resolveSessionControlStarted,
} from './sessionControlTiming'

const occurrenceDate = '2026-08-20'
const scheduledStartIso = buildScheduledSessionInstant(occurrenceDate, '10:00')
const scheduledEndIso = buildScheduledSessionInstant(occurrenceDate, '11:00')
const startedAt = '2026-08-20T10:05:00.000Z'
const endedAt = '2026-08-20T11:25:00.000Z'

function baseInput(now: Date) {
  return {
    now,
    language: 'en',
    scheduledStartIso,
    scheduledEndIso,
    startedAt,
    endedAt,
  }
}

describe('resolveSessionControlStarted', () => {
  it('returns due countdown before scheduled start', () => {
    const display = resolveSessionControlStarted({
      ...baseInput(new Date('2026-08-20T09:45:00')),
      runStatus: 'scheduled',
      startedAt: null,
      endedAt: null,
    })
    assert.equal(display.kind, 'due')
    if (display.kind === 'due') {
      assert.equal(display.duration, '15min')
    }
  })

  it('returns delayed duration after scheduled start while still scheduled', () => {
    const display = resolveSessionControlStarted({
      ...baseInput(new Date('2026-08-20T10:15:00')),
      runStatus: 'scheduled',
      startedAt: null,
      endedAt: null,
    })
    assert.equal(display.kind, 'delayed')
    if (display.kind === 'delayed') {
      assert.equal(display.duration, '15min')
    }
  })

  it('returns actual started timestamp when session is started', () => {
    const display = resolveSessionControlStarted({
      ...baseInput(new Date('2026-08-20T10:30:00')),
      runStatus: 'started',
    })
    assert.equal(display.kind, 'actual')
    if (display.kind === 'actual') {
      assert.match(display.text, /2026/)
    }
  })

  it('returns actual started timestamp when session is ended', () => {
    const display = resolveSessionControlStarted({
      ...baseInput(new Date('2026-08-20T12:00:00')),
      runStatus: 'ended',
    })
    assert.equal(display.kind, 'actual')
  })
})

describe('resolveSessionControlEnded', () => {
  it('returns empty before the session starts', () => {
    const display = resolveSessionControlEnded({
      ...baseInput(new Date('2026-08-20T09:45:00')),
      runStatus: 'scheduled',
      startedAt: null,
      endedAt: null,
    })
    assert.equal(display.kind, 'empty')
  })

  it('returns due countdown before scheduled end while started', () => {
    const display = resolveSessionControlEnded({
      ...baseInput(new Date('2026-08-20T10:50:00')),
      runStatus: 'started',
    })
    assert.equal(display.kind, 'due')
    if (display.kind === 'due') {
      assert.equal(display.duration, '10min')
    }
  })

  it('returns delayed duration after scheduled end while still started', () => {
    const display = resolveSessionControlEnded({
      ...baseInput(new Date('2026-08-20T11:20:00')),
      runStatus: 'started',
      endedAt: null,
    })
    assert.equal(display.kind, 'delayed')
    if (display.kind === 'delayed') {
      assert.equal(display.duration, '20min')
    }
  })

  it('returns actual ended timestamp when session is ended', () => {
    const display = resolveSessionControlEnded({
      ...baseInput(new Date('2026-08-20T12:00:00')),
      runStatus: 'ended',
    })
    assert.equal(display.kind, 'actual')
    if (display.kind === 'actual') {
      assert.match(display.text, /2026/)
    }
  })
})

describe('buildScheduledSessionInstant', () => {
  it('combines occurrence date and HH:mm into local ISO', () => {
    assert.equal(
      buildScheduledSessionInstant('2026-08-20', '09:30'),
      '2026-08-20T09:30:00',
    )
  })
})
