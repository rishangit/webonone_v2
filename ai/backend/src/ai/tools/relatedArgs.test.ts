import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  applyRelatedSelections,
  buildRelatedTree,
  displayCreateArguments,
  looksLikeRecordId,
  materializeRelatedTree,
  parseRelatedNameHint,
  publicConfirmRecord,
  relatedCreateArgs,
  resolveRelatedForArgs,
  schemaPropertyArgs,
} from './relatedArgs.js'
import type { ToolDefinition, ToolResult } from './registry.js'

const createUnit: Pick<ToolDefinition, 'name' | 'jsonSchema' | 'argCompletion'> = {
  name: 'create_data_unit',
  jsonSchema: {
    type: 'object',
    required: ['name', 'symbol', 'description'],
    properties: {
      name: { type: 'string' },
      symbol: { type: 'string' },
      description: { type: 'string' },
      status: { type: 'string', enum: ['verified', 'pending'] },
      is_base: { type: 'boolean' },
    },
  },
  argCompletion: {
    defaults: { status: 'pending' },
  },
}

describe('related confirm display', () => {
  it('does not treat a unit name as an id', () => {
    assert.equal(looksLikeRecordId('6Ne4z-tQPBxZuMhHB-yCD'), true)
    assert.equal(looksLikeRecordId('Milligram'), false)
    assert.equal(looksLikeRecordId('LabResultGlucose'), false)
    assert.equal(looksLikeRecordId('MilligramPerDecilitre'), false)
  })

  it('parses related name and symbol without an id', () => {
    assert.deepEqual(parseRelatedNameHint('Milligram (mg)'), { name: 'Milligram', symbol: 'mg' })
    assert.equal(parseRelatedNameHint('6Ne4z-tQPBxZuMhHB-yCD'), null)
  })

  it('hides ids and nested ids on confirm records', () => {
    assert.deepEqual(
      publicConfirmRecord({
        id: 'abc',
        name: 'Milligram',
        symbol: 'mg',
        unit_id: 'hidden',
      }),
      { name: 'Milligram', symbol: 'mg' },
    )
  })

  it('replaces unit_id with nested unit properties', () => {
    const display = displayCreateArguments(
      {
        name: 'Dosage Amount',
        status: 'pending',
        unit_id: '6Ne4z-tQPBxZuMhHB-yCD',
        value_type: 'number',
        description: 'Amount of medication to administer.',
      },
      [
        {
          displayKey: 'unit',
          record: { id: '6Ne4z-tQPBxZuMhHB-yCD', name: 'Milligram', symbol: 'mg', description: 'One thousandth of a gram.' },
        },
      ],
    )
    assert.equal(display.unit_id, undefined)
    assert.deepEqual(display.unit, {
      name: 'Milligram',
      symbol: 'mg',
      description: 'One thousandth of a gram.',
    })
    assert.equal(display.name, 'Dosage Amount')
  })

  it('seeds a related create from a name hint', () => {
    const args = relatedCreateArgs(createUnit, { name: 'Milligram (mg)' }, 'super_admin')
    assert.equal(args.name, 'Milligram')
    assert.equal(args.symbol, 'mg')
    assert.match(String(args.description), /Milligram/)
  })

  it('does not send an invalid related status such as active', () => {
    const args = relatedCreateArgs(
      createUnit,
      { name: 'Grams per deciliter', symbol: 'g/dL', status: 'active' },
      'super_admin',
    )
    assert.equal(args.status, 'pending')
    assert.equal(args.symbol, 'g/dL')
    assert.equal(args.name, 'Grams per deciliter')
  })

  it('maps camelCase args and enum casing onto schema properties', () => {
    const mapped = schemaPropertyArgs(
      {
        properties: {
          value_type: { type: 'string', enum: ['number', 'text'] },
          name: { type: 'string' },
        },
      },
      { name: 'LabResultGlucose', valueType: 'Number' },
    )
    assert.equal(mapped.value_type, 'number')
    assert.equal(mapped.name, 'LabResultGlucose')
  })

  it('does not treat the create name as a missing related record', async () => {
    const resolved = await resolveRelatedForArgs(
      {
        jsonSchema: {
          properties: {
            name: { type: 'string' },
            unit_id: { type: 'string' },
          },
        },
        relatedArgs: [
          {
            argKey: 'unit_id',
            displayKey: 'unit',
            getPath: '/api/v1/units/:id',
            listPath: '/api/v1/units',
            createTool: 'create_data_unit',
          },
        ],
      },
      { name: 'LabResultGlucose', unit_id: 'LabResultGlucose', value_type: 'number' },
      async () => null,
    )
    assert.equal(resolved.arguments.unit_id, undefined)
    assert.equal(resolved.related[0]?.missingHint, null)
  })

  it('nests a missing unit under the parent instead of treating it as exists', async () => {
    const unitDef: ToolDefinition = {
      name: 'create_data_unit',
      description: 'create unit',
      jsonSchema: createUnit.jsonSchema,
      riskLevel: 'write',
      requiredRoles: ['super_admin'],
      requiredPermissions: ['ai:data_library:write'],
      service: 'data',
      auth: 'user_jwt',
      invoke: { method: 'POST', path: '/api/v1/units' },
      capabilityVersion: '1',
      argCompletion: createUnit.argCompletion,
    }
    const tree = await buildRelatedTree(
      {
        name: 'create_data_attribute',
        jsonSchema: { properties: { name: { type: 'string' }, unit_id: { type: 'string' } } },
        relatedArgs: [
          {
            argKey: 'unit_id',
            displayKey: 'unit',
            getPath: '/api/v1/units/:id',
            listPath: '/api/v1/units',
            createTool: 'create_data_unit',
          },
        ],
      },
      {
        name: 'Hemoglobin Level',
        unit: { name: 'Grams per deciliter', symbol: 'g/dL', status: 'active' },
      },
      {
        getTool: (name) => (name === 'create_data_unit' ? unitDef : undefined),
        lookup: async () => null,
        role: 'super_admin',
      },
    )
    assert.equal(tree.length, 1)
    assert.equal(tree[0]?.exists, false)
    assert.equal(tree[0]?.displayKey, 'unit')
    assert.equal(tree[0]?.record.name, 'Grams per deciliter')
    assert.equal(tree[0]?.record.status, 'pending')
    assert.equal(/required for this create/i.test(String(tree[0]?.record.description)), false)
  })

  it('marks an existing related record so the checkbox can be disabled', async () => {
    const tree = await buildRelatedTree(
      {
        name: 'create_data_attribute',
        jsonSchema: { properties: {} },
        relatedArgs: [
          {
            argKey: 'unit_id',
            displayKey: 'unit',
            getPath: '/api/v1/units/:id',
            listPath: '/api/v1/units',
            createTool: 'create_data_unit',
          },
        ],
      },
      { name: 'HeartRate', unit: { name: 'Beats per minute' } },
      {
        getTool: () => undefined,
        lookup: async () => ({
          id: 'unit00000000000000001',
          name: 'Beats per minute',
          symbol: 'bpm',
          status: 'verified',
        }),
        role: 'super_admin',
      },
    )
    assert.equal(tree[0]?.exists, true)
    assert.equal(tree[0]?.recordId, 'unit00000000000000001')
    assert.equal(tree[0]?.selected, true)
    assert.equal(tree[0]?.children, undefined)
  })

  it('skips unchecked related creates when materializing', async () => {
    const created: string[] = []
    const tree = applyRelatedSelections(
      [
        {
          path: 'unit/0',
          displayKey: 'unit',
          exists: false,
          selected: true,
          record: { name: 'Percent' },
          createTool: 'create_data_unit',
          createArgs: { name: 'Percent', symbol: '%', description: 'Percent - Suggested related record.' },
        },
      ],
      { 'unit/0': false },
    )
    const result = await materializeRelatedTree(
      {
        relatedArgs: [
          {
            argKey: 'unit_id',
            displayKey: 'unit',
            getPath: '/api/v1/units/:id',
            listPath: '/api/v1/units',
            createTool: 'create_data_unit',
          },
        ],
      },
      { name: 'OxygenSaturation', unit: { name: 'Percent' } },
      tree,
      {
        getTool: () => undefined,
        createdIds: new Map(),
        execute: async (call) => {
          created.push(call.name)
          return { toolCallId: 'x', name: call.name, ok: true, output: { data: { id: 'unit00000000000000001' } } } satisfies ToolResult
        },
      },
    )
    assert.equal(created.length, 0)
    assert.equal(result.arguments.unit_id, undefined)
  })
})
