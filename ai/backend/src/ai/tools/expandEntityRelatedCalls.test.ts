import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { ResolvedEntityContext } from '../entityContext/types.js'
import {
  expandEntityRelatedCalls,
  isAttributeUnitIntent,
  isRelatedSuggestionIntent,
  liftEntityRelatedUpdateCall,
  pickRelatedDisplayKey,
} from './expandEntityRelatedCalls.js'
import type { ToolDefinition } from './registry.js'

const updateProduct: ToolDefinition = {
  name: 'update_data_product',
  description: 'Update product',
  jsonSchema: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
      attributes: { type: 'array' },
    },
  },
  riskLevel: 'write',
  requiredRoles: ['company_admin', 'super_admin'],
  requiredPermissions: ['ai:data_catalog:write'],
  service: 'data',
  auth: 'user_jwt',
  invoke: { method: 'PATCH', path: '/api/v1/products/:id' },
  capabilityVersion: '1',
  relatedArgs: [
    {
      argKey: 'attributes',
      displayKey: 'attributes',
      cardinality: 'many',
      itemIdKey: 'attribute_id',
      getPath: '/api/v1/attributes/:id',
      listPath: '/api/v1/attributes',
      createTool: 'create_data_attribute',
    },
  ],
}

const updateAttribute: ToolDefinition = {
  name: 'update_data_attribute',
  description: 'Update attribute',
  jsonSchema: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      unit: { type: 'object' },
    },
  },
  riskLevel: 'write',
  requiredRoles: ['company_admin', 'super_admin'],
  requiredPermissions: ['ai:data_library:write'],
  service: 'data',
  auth: 'user_jwt',
  invoke: { method: 'PATCH', path: '/api/v1/attributes/:id' },
  capabilityVersion: '1',
  relatedArgs: [
    {
      argKey: 'unit_id',
      displayKey: 'unit',
      cardinality: 'one',
      getPath: '/api/v1/units/:id',
      listPath: '/api/v1/units',
      createTool: 'create_data_unit',
    },
  ],
}

const attributeResolved: ResolvedEntityContext[] = [
  {
    ref: { service: 'data', kind: 'attribute', id: 'attr00000000000000001', label: 'Net Weight' },
    record: { id: 'attr00000000000000001', name: 'Net Weight', value_type: 'number' },
  },
]

describe('isRelatedSuggestionIntent', () => {
  it('detects suggest attributes intent', () => {
    assert.equal(
      isRelatedSuggestionIntent('suggest related attributes to add for this product'),
      true,
    )
  })

  it('ignores unrelated messages', () => {
    assert.equal(isRelatedSuggestionIntent('what is the weather'), false)
  })

  it('detects can we have units intent', () => {
    assert.equal(isRelatedSuggestionIntent('can we have units for this'), true)
  })

  it('detects suggest variants intent', () => {
    assert.equal(
      isRelatedSuggestionIntent('suggest market variants for this product'),
      true,
    )
  })
})

describe('attribute unit intent', () => {
  it('detects unit questions on attributes', () => {
    assert.equal(isAttributeUnitIntent('can we have units for this', 'attribute'), true)
    assert.equal(isAttributeUnitIntent('can we have units for this', 'product'), false)
  })

  it('lifts a default unit for net weight when the model only replies in prose', () => {
    const call = liftEntityRelatedUpdateCall({
      content: 'Sure, I can help attach a unit.',
      tools: [updateAttribute],
      userMessage: 'can we have units for this',
      resolved: attributeResolved,
    })
    assert.ok(call)
    assert.equal(call?.name, 'update_data_attribute')
    assert.equal(call?.arguments.name, 'Net Weight')
    assert.deepEqual(call?.arguments.unit, {
      name: 'Gram',
      symbol: 'g',
      description: 'Gram (g) - Unit of mass for weight measurements.',
    })
  })

  it('parses unit mentions from assistant prose', () => {
    const call = liftEntityRelatedUpdateCall({
      content: 'You can use Gram (g) or Kilogram (kg) for this number attribute.',
      tools: [updateAttribute],
      userMessage: 'can we have units for this',
      resolved: attributeResolved,
    })
    assert.ok(call)
    assert.deepEqual(call?.arguments.unit, {
      name: 'Gram',
      symbol: 'g',
      description: 'Gram (g) - Suggested unit of measure.',
    })
  })

  it('expands attribute unit intent without suggest keyword', () => {
    const calls = expandEntityRelatedCalls({
      content: 'Sure, I can help with units.',
      tools: [updateAttribute],
      userMessage: 'can we have units for this',
      resolved: attributeResolved,
      existingCalls: [],
    })
    assert.equal(calls.length, 1)
    assert.equal(calls[0]?.name, 'update_data_attribute')
  })
})

const resolved: ResolvedEntityContext[] = [
  {
    ref: { service: 'data', kind: 'product', id: 'qWKv4UmMr3SAbecPh1mom', label: 'Alveogyl' },
    record: { id: 'qWKv4UmMr3SAbecPh1mom', name: 'Alveogyl', attributes: [] },
  },
]

describe('liftEntityRelatedUpdateCall', () => {
  it('lifts numbered attribute suggestions into update_data_product', () => {
    const content = `For Alveogyl, I suggest:
1. **Active Ingredient** (Text) – Medication components in the dressing.
2. **Net Weight** (Number) – Amount per unit.`
    const call = liftEntityRelatedUpdateCall({
      content,
      tools: [updateProduct],
      userMessage: 'suggest attributes to add',
      resolved,
    })
    assert.ok(call)
    assert.equal(call?.name, 'update_data_product')
    assert.equal(call?.arguments.id, 'qWKv4UmMr3SAbecPh1mom')
    const attributes = call?.arguments.attributes
    assert.ok(Array.isArray(attributes))
    assert.equal(attributes?.length, 2)
    assert.equal((attributes?.[0] as Record<string, unknown>).name, 'Active Ingredient')
    assert.equal((attributes?.[0] as Record<string, unknown>).value_type, 'text')
  })
})

describe('expandEntityRelatedCalls', () => {
  it('appends lifted update call when no write tools exist', () => {
    const content = '1. **Storage Temperature** (Number) – Required storage conditions.'
    const calls = expandEntityRelatedCalls({
      content,
      tools: [updateProduct],
      userMessage: 'suggest attributes to add',
      resolved,
      existingCalls: [],
    })
    assert.equal(calls.length, 1)
    assert.equal(calls[0]?.name, 'update_data_product')
  })

  it('does not add when write tools already exist', () => {
    const calls = expandEntityRelatedCalls({
      content: '1. **Width** (Text) – Product width.',
      tools: [updateProduct],
      userMessage: 'suggest attributes to add',
      resolved,
      existingCalls: [{ id: 'existing', name: 'update_data_product', arguments: { id: 'x' } }],
    })
    assert.equal(calls.length, 1)
    assert.equal(calls[0]?.id, 'existing')
  })
})

describe('pickRelatedDisplayKey', () => {
  it('prefers attributes when user mentions attributes', () => {
    assert.equal(pickRelatedDisplayKey('add missing attributes', updateProduct), 'attributes')
  })

  it('prefers unit when attribute context asks for units', () => {
    assert.equal(
      pickRelatedDisplayKey('can we have units for this', updateAttribute, 'attribute'),
      'unit',
    )
  })
})
