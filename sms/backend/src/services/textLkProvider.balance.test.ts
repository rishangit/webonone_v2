import assert from 'node:assert/strict'
import { afterEach, describe, it, mock } from 'node:test'
import {
  fetchTextLkBalance,
  parseTextLkBalanceBody,
} from './textLkProvider.service.js'

describe('parseTextLkBalanceBody', () => {
  it('reads data.balance', () => {
    assert.equal(parseTextLkBalanceBody({ status: 'success', data: { balance: 1245 } }), 1245)
  })

  it('reads top-level balance and string numbers', () => {
    assert.equal(parseTextLkBalanceBody({ balance: '8,420' }), 8420)
  })

  it('reads numeric data', () => {
    assert.equal(parseTextLkBalanceBody({ data: 100 }), 100)
  })

  it('rejects error status and malformed bodies', () => {
    assert.equal(parseTextLkBalanceBody({ status: 'error', message: 'nope' }), null)
    assert.equal(parseTextLkBalanceBody({ data: { foo: 1 } }), null)
    assert.equal(parseTextLkBalanceBody(null), null)
  })
})

describe('fetchTextLkBalance', () => {
  afterEach(() => {
    mock.restoreAll()
  })

  it('returns balance on success', async () => {
    mock.method(globalThis, 'fetch', async () =>
      new Response(JSON.stringify({ status: 'success', data: { balance: 42 } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const result = await fetchTextLkBalance('token')
    assert.deepEqual(result, { ok: true, balance: 42 })
  })

  it('maps invalid credentials', async () => {
    mock.method(globalThis, 'fetch', async () =>
      new Response(JSON.stringify({ status: 'error', message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const result = await fetchTextLkBalance('bad')
    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.equal(result.retryable, false)
      assert.match(result.error, /rejected|Unauthorized/i)
    }
  })

  it('maps provider HTTP failure', async () => {
    mock.method(globalThis, 'fetch', async () =>
      new Response(JSON.stringify({ status: 'error', message: 'Unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const result = await fetchTextLkBalance('token')
    assert.equal(result.ok, false)
    if (!result.ok) assert.equal(result.retryable, true)
  })

  it('maps network failure', async () => {
    mock.method(globalThis, 'fetch', async () => {
      throw new Error('ECONNRESET')
    })
    const result = await fetchTextLkBalance('token')
    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.equal(result.retryable, true)
      assert.match(result.error, /network/i)
    }
  })

  it('maps timeout via AbortError', async () => {
    mock.method(globalThis, 'fetch', async () => {
      const err = new Error('Aborted')
      err.name = 'AbortError'
      throw err
    })
    const result = await fetchTextLkBalance('token')
    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.equal(result.retryable, true)
      assert.match(result.error, /timed out/i)
    }
  })

  it('rejects malformed success body', async () => {
    mock.method(globalThis, 'fetch', async () =>
      new Response(JSON.stringify({ status: 'success', data: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const result = await fetchTextLkBalance('token')
    assert.equal(result.ok, false)
    if (!result.ok) assert.match(result.error, /malformed/i)
  })
})
