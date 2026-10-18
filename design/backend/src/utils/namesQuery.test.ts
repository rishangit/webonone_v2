import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { namedListWindow, parseNamesParam, readNamesQuery } from './namesQuery.js'

describe('parseNamesParam', () => {
  it('splits comma-separated names and drops blanks', () => {
    assert.deepEqual(parseNamesParam('Inter, Open Sans,,Lato'), ['Inter', 'Open Sans', 'Lato'])
  })

  it('accepts repeated values', () => {
    assert.deepEqual(parseNamesParam(['Home', 'About, Contact']), ['Home', 'About', 'Contact'])
  })
})

describe('readNamesQuery', () => {
  it('ignores non-strings', () => {
    assert.equal(readNamesQuery(undefined), undefined)
    assert.equal(readNamesQuery({ names: 'Inter' }), undefined)
  })
})

describe('namedListWindow', () => {
  it('returns the first page large enough for a names lookup', () => {
    const window = namedListWindow({ page: 3, pageSize: 20, names: 'A, B, C' }, 20)
    assert.equal(window.page, 1)
    assert.equal(window.pageSize, 20)
    assert.deepEqual(window.names, ['A', 'B', 'C'])
  })
})
