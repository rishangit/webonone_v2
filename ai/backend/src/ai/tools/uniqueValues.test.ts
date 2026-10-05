import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { ToolCall, ToolDefinition } from './registry.js'
import {
  collectUniqueLookupGroups,
  dropCreateCallsWithExistingNames,
  partitionUniquePendingWrites,
  type PendingWrite,
} from './uniqueValues.js'

const createTag: ToolDefinition = {
  name: 'create_data_tag',
  description: 'create',
  jsonSchema: { type: 'object', properties: {} },
  riskLevel: 'write',
  requiredRoles: ['company_admin'],
  requiredPermissions: ['ai:data_library:write'],
  service: 'data',
  auth: 'user_jwt',
  invoke: { method: 'POST', path: '/api/v1/tags' },
  capabilityVersion: '1',
  argCompletion: {
    uniqueBy: 'name',
    uniqueLookup: { method: 'GET', path: '/api/v1/tags', queryParam: 'names' },
  },
}

function write(id: string, name: string): PendingWrite {
  return {
    call: { id, name: 'create_data_tag', arguments: { name } },
    output: {
      name: 'create_data_tag',
      riskLevel: 'write',
      arguments: { name, description: `${name} description`, status: 'pending' },
      summary: `create_data_tag ${name}`,
    },
  }
}

function call(id: string, name: string): ToolCall {
  return { id, name: 'create_data_tag', arguments: { name } }
}

describe('dropCreateCallsWithExistingNames', () => {
  it('keeps new names and drops ones already in the library', () => {
    const calls = [call('1', 'Healthcare'), call('2', 'Medicine'), call('3', 'FirstAid')]
    const existing = new Map([['create_data_tag', new Set(['healthcare'])]])
    const result = dropCreateCallsWithExistingNames(calls, () => createTag, existing)
    assert.deepEqual(
      result.kept.map((item) => item.arguments.name),
      ['Medicine', 'FirstAid'],
    )
    assert.deepEqual(result.skippedExisting, ['Healthcare'])
  })

  it('groups unique lookup values by tool for batch existing checks', () => {
    const groups = collectUniqueLookupGroups(
      [call('1', 'Healthcare'), call('2', 'Medicine')],
      () => createTag,
    )
    assert.equal(groups.size, 1)
    assert.deepEqual(groups.get('create_data_tag')?.values, ['Healthcare', 'Medicine'])
  })
})

describe('partitionUniquePendingWrites', () => {
  it('keeps names that are not in the library and drops existing and in-batch duplicates', () => {
    const writes = [
      write('1', 'Healthcare'),
      write('2', 'Medicine'),
      write('3', 'medicine'),
      write('4', 'FirstAid'),
    ]
    const existing = new Map([['create_data_tag', new Set(['healthcare'])]])
    const result = partitionUniquePendingWrites(writes, () => createTag, existing)
    assert.deepEqual(
      result.keep.map((item) => item.call.id),
      ['2', '4'],
    )
    assert.deepEqual(result.skippedExisting, ['Healthcare'])
    assert.deepEqual(result.skippedDuplicates, ['medicine'])
  })

  it('keeps writes when the tool has no uniqueLookup', () => {
    const other: ToolDefinition = { ...createTag, argCompletion: undefined }
    const writes = [write('1', 'Healthcare'), write('2', 'Healthcare')]
    const result = partitionUniquePendingWrites(writes, () => other, new Map())
    assert.equal(result.keep.length, 2)
    assert.equal(result.skippedExisting.length, 0)
  })
})
