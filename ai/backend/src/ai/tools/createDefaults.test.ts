import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { completeCreateArgs, missingConditionalArgs, missingRequiredArgs, pickHexColor } from './createDefaults.js'
import type { ToolDefinition } from './registry.js'

const palette = ['#4F46E5', '#059669'] as const

const createTag: Pick<ToolDefinition, 'name' | 'jsonSchema' | 'argCompletion'> = {
  name: 'create_data_tag',
  jsonSchema: {
    type: 'object',
    required: ['name', 'description', 'status'],
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      color: { type: 'string', enum: [...palette] },
      status: { type: 'string', enum: ['verified', 'pending'] },
    },
  },
  argCompletion: {
    allowedKeys: ['name', 'description', 'color', 'status'],
    defaults: { status: 'pending' },
    forceByRole: { company_admin: { status: 'pending' } },
    pascalCaseKeys: ['name'],
  },
}

describe('pickHexColor', () => {
  it('uses the same random index method as the tag create form', () => {
    assert.equal(pickHexColor(palette, () => 0), '#4F46E5')
    assert.equal(pickHexColor(palette, () => 0.99), '#059669')
  })
})

describe('completeCreateArgs', () => {
  it('does not invent a name when the model omitted it', () => {
    const args = completeCreateArgs(createTag, {}, 'company_admin')
    assert.equal(args.name, undefined)
    assert.equal(args.status, 'pending')
    assert.equal(typeof args.color, 'string')
    assert.equal(palette.includes(args.color as (typeof palette)[number]), true)
    assert.deepEqual(missingRequiredArgs(createTag.jsonSchema, args), ['name', 'description'])
  })

  it('fills a random palette color when the model omitted color', () => {
    const args = completeCreateArgs(
      createTag,
      { name: 'Clinic', description: 'Medical facility labels.' },
      'company_admin',
    )
    assert.equal(args.name, 'Clinic')
    assert.equal(palette.includes(args.color as (typeof palette)[number]), true)
    assert.deepEqual(missingRequiredArgs(createTag.jsonSchema, args), [])
  })

  it('keeps a valid palette color the user already chose', () => {
    const args = completeCreateArgs(
      createTag,
      { name: 'Clinic', description: 'Medical facility labels.', color: '#059669' },
      'company_admin',
    )
    assert.equal(args.color, '#059669')
  })

  it('capitalizes the first letter of pascalCaseKeys', () => {
    const args = completeCreateArgs(
      createTag,
      { name: 'pharmacyInventory', description: 'Pharmacy Inventory - Medication stock.' },
      'company_admin',
    )
    assert.equal(args.name, 'PharmacyInventory')
  })

  it('drops invalid status values then applies the pending default', () => {
    const args = completeCreateArgs(
      createTag,
      { name: 'Clinic', description: 'Medical facility labels.', status: 'active' },
      'company_admin',
    )
    assert.equal(args.status, 'pending')
  })
})

const createServiceSchema = {
  type: 'object',
  required: ['name', 'description', 'time_mode'],
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    time_mode: { type: 'string', enum: ['duration', 'window'] },
    duration_minutes: { type: 'integer' },
    start_time: { type: 'string' },
    end_time: { type: 'string' },
  },
  allOf: [
    {
      if: { properties: { time_mode: { const: 'duration' } } },
      then: { required: ['duration_minutes'] },
    },
    {
      if: { properties: { time_mode: { const: 'window' } } },
      then: { required: ['start_time', 'end_time'] },
    },
  ],
}

describe('missingConditionalArgs', () => {
  it('requires duration_minutes when time_mode is duration', () => {
    assert.deepEqual(
      missingConditionalArgs(createServiceSchema, {
        name: 'Dental Checkup and Cleaning',
        description: 'Routine dental examination and cleaning.',
        time_mode: 'duration',
      }),
      ['duration_minutes'],
    )
  })

  it('requires window times when time_mode is window', () => {
    assert.deepEqual(
      missingConditionalArgs(createServiceSchema, {
        name: 'Morning Clinic',
        description: 'Morning clinic window.',
        time_mode: 'window',
      }),
      ['start_time', 'end_time'],
    )
  })
})
