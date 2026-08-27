import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { MISSING_DISPLAY_VALUE, buildConfirmDisplayFields } from './confirmDisplay.js'

import type { ToolDefinition } from './registry.js'

const createServiceTool = {
  name: 'create_data_service',
  jsonSchema: {
    type: 'object',
    required: ['name', 'description', 'time_mode'],
    properties: {
      name: { type: 'string', title: 'Name' },
      description: { type: 'string', title: 'Description' },
      time_mode: { type: 'string', title: 'Time mode', enum: ['duration', 'window'] },
      duration_minutes: { type: 'integer', title: 'Duration (minutes)', minimum: 1 },
      start_time: { type: 'string', title: 'Start time' },
      end_time: { type: 'string', title: 'End time' },
      status: { type: 'string', title: 'Status', enum: ['verified', 'pending'] },
      tag_ids: { type: 'array', items: { type: 'string' } },
      tags: { type: 'array', items: { type: 'object' } },
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
  },
  argCompletion: {
    defaults: { status: 'pending' },
    forceByRole: { company_admin: { status: 'pending' } },
  },
  relatedArgs: [
    {
      argKey: 'tag_ids',
      displayKey: 'tags',
      getPath: '/api/v1/tags/:id',
      listPath: '/api/v1/tags',
      createTool: 'create_data_tag',
    },
  ],
} as Pick<ToolDefinition, 'name' | 'jsonSchema' | 'relatedArgs' | 'argCompletion'>

describe('buildConfirmDisplayFields', () => {
  it('lists duration fields and hides window-only fields when time_mode is duration', () => {
    const fields = buildConfirmDisplayFields(createServiceTool, {
      name: 'Dental Checkup and Cleaning',
      description: 'Routine dental examination and cleaning.',
      time_mode: 'duration',
    })
    const duration = fields.find((field) => field.key === 'duration_minutes')
    assert.equal(duration?.label, 'Duration (minutes)')
    assert.equal(duration?.value, MISSING_DISPLAY_VALUE)
    assert.equal(duration?.missing, true)
    assert.equal(duration?.editable, true)
    assert.equal(duration?.inputType, 'number')
    assert.equal(fields.some((field) => field.key === 'start_time'), false)
    assert.equal(fields.some((field) => field.key === 'end_time'), false)
    assert.equal(fields.some((field) => field.key === 'tags'), false)
  })

  it('lists window fields and hides duration when time_mode is window', () => {
    const fields = buildConfirmDisplayFields(createServiceTool, {
      name: 'Morning slot',
      description: 'Bookable morning window.',
      time_mode: 'window',
    })
    assert.equal(fields.some((field) => field.key === 'duration_minutes'), false)
    assert.equal(fields.some((field) => field.key === 'start_time'), true)
    assert.equal(fields.some((field) => field.key === 'end_time'), true)
  })

  it('fills status from defaults and does not allow inline edit on enums', () => {
    const fields = buildConfirmDisplayFields(
      createServiceTool,
      {
        name: 'Dental Checkup and Cleaning',
        description: 'Routine dental examination and cleaning.',
        time_mode: 'duration',
      },
      { role: 'company_admin' },
    )
    const status = fields.find((field) => field.key === 'status')
    assert.equal(status?.value, 'pending')
    assert.equal(status?.missing, false)
    assert.equal(status?.editable, false)
    const timeMode = fields.find((field) => field.key === 'time_mode')
    assert.equal(timeMode?.editable, false)
  })

  it('omits missing fields when omitMissing is set', () => {
    const fields = buildConfirmDisplayFields(
      createServiceTool,
      {
        id: 'space00000000000000001',
        tags: [{ description: 'Dental Care - General healthcare services.' }],
      },
      { omitMissing: true },
    )
    assert.equal(fields.length, 0)
  })
})
