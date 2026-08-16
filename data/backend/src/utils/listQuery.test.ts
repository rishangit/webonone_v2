import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { bulkListPaging, parseListQuery, parseNamesParam } from './listQuery.js'

describe('parseNamesParam', () => {
  it('splits comma-separated names and dedupes', () => {
    assert.deepEqual(parseNamesParam('Healthcare,Medicine,Healthcare'), ['Healthcare', 'Medicine'])
  })

  it('accepts repeated query values', () => {
    assert.deepEqual(parseNamesParam(['Clinic', 'Hospital']), ['Clinic', 'Hospital'])
  })

  it('caps at 100 names', () => {
    const names = Array.from({ length: 120 }, (_, index) => `Name${index}`)
    assert.equal(parseNamesParam(names).length, 100)
  })
})

describe('bulkListPaging', () => {
  it('forces page 1 and grows pageSize to cover the unique set', () => {
    const parsed = parseListQuery({ page: 3, pageSize: 20 })
    const paging = bulkListPaging(parsed, ['a', 'b', 'c'])
    assert.equal(paging.page, 1)
    assert.equal(paging.pageSize, 20)
    const wide = bulkListPaging(parsed, Array.from({ length: 40 }, (_, index) => `n${index}`))
    assert.equal(wide.pageSize, 40)
  })

  it('keeps normal paging when no bulk set is present', () => {
    const parsed = parseListQuery({ page: 3, pageSize: 20 })
    const paging = bulkListPaging(parsed, [])
    assert.equal(paging.page, 3)
    assert.equal(paging.pageSize, 20)
  })
})
