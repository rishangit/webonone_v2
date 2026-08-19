import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  expandCreateCalls,
  extractRecordsFromText,
  liftCreateCallsFromText,
  normalizeHeaderKey,
  pickCreateTool,
  remainingCreateCallsPrompt,
  remainingItemsTablePrompt,
  requestedItemCount,
  resolveCreateTool,
} from './extractCreateItems.js'
import type { ToolDefinition } from './registry.js'

const createTag: ToolDefinition = {
  name: 'create_data_tag',
  description: 'Create a Data library tag.',
  jsonSchema: {
    type: 'object',
    required: ['name', 'description', 'status'],
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      status: { type: 'string' },
    },
  },
  riskLevel: 'write',
  requiredRoles: ['company_admin'],
  requiredPermissions: ['ai:data_library:write'],
  service: 'data',
  auth: 'user_jwt',
  invoke: { method: 'POST', path: '/api/v1/tags' },
  capabilityVersion: '1',
  argCompletion: {
    allowedKeys: ['name', 'description', 'color', 'status'],
    defaults: { status: 'pending' },
    pascalCaseKeys: ['name'],
  },
}

const createCatalog: ToolDefinition = {
  name: 'create_catalog_item',
  description: 'Create a company catalog item.',
  jsonSchema: {
    type: 'object',
    required: ['name', 'description'],
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
    },
  },
  riskLevel: 'write',
  requiredRoles: ['company_admin'],
  requiredPermissions: ['ai:catalog:write'],
  service: 'webonone',
  auth: 'user_jwt',
  invoke: { method: 'POST', path: '/api/v1/company/me/catalog/:kind/custom' },
  capabilityVersion: '1',
}

const createUnit: ToolDefinition = {
  name: 'create_data_unit',
  description: 'Create a Data library unit.',
  jsonSchema: {
    type: 'object',
    required: ['name', 'symbol', 'description'],
    properties: {
      name: { type: 'string' },
      symbol: { type: 'string' },
      description: { type: 'string' },
      is_base: { type: 'boolean' },
      base_unit_id: { type: 'string' },
      status: { type: 'string' },
    },
  },
  riskLevel: 'write',
  requiredRoles: ['company_admin'],
  requiredPermissions: ['ai:data_library:write'],
  service: 'data',
  auth: 'user_jwt',
  invoke: { method: 'POST', path: '/api/v1/units' },
  capabilityVersion: '1',
  relatedArgs: [
    {
      argKey: 'base_unit_id',
      displayKey: 'base_unit',
      getPath: '/api/v1/units/:id',
      listPath: '/api/v1/units',
      createTool: 'create_data_unit',
    },
  ],
}

const medicalTable = `
Here's the complete list of the 10 tags you can add to the Data Library:

| # | Tag Name (camelCase) | Description (Spaced Name – details) |
|---|---------------------|--------------------------------------|
| 1 | **GeneralPractice** | General Practice – Primary-care services. |
| 2 | **Pediatrics** | Pediatrics – Care for infants, children, and adolescents. |
| 3 | **Radiology** | Radiology – Diagnostic imaging services. |
`

const medicalUnitTable = `
| name | symbol | description | is_base | base_unit_id | status |
|------|--------|-------------|---------|--------------|--------|
| Milligram | mg | Milligram - One-thousandth of a gram for small medication dosages. | false | RtxUMRE5AoLlxkmYmbBsX | pending |
| Liter | L | Liter - Base unit for liquid volume in infusions and solutions. | true | - | pending |
| Milliliter | mL | Milliliter - One-thousandth of a liter for liquid medication volumes. | false | - | pending |
| Microgram | mcg | Microgram - One-millionth of a gram for very small drug doses. | false | - | pending |
| InternationalUnit | IU | International Unit - Biological activity measure for vitamins and hormones. | true | - | pending |
| Milliequivalent | mEq | Milliequivalent - Electrolyte concentration in IV fluids. | false | - | pending |
| Drop | gtt | Drop - Approximate liquid volume for eye and ear medications. | true | - | pending |
| Unit | U | Unit - Insulin and other biologic dosing. | true | - | pending |
| Millimole | mmol | Millimole - Amount of substance in lab values and infusions. | false | - | pending |
| Microliter | uL | Microliter - Very small liquid volume for lab samples. | false | - | pending |
`

describe('normalizeHeaderKey', () => {
  it('maps tag name headers to name', () => {
    assert.equal(normalizeHeaderKey('Tag Name (camelCase)'), 'name')
    assert.equal(normalizeHeaderKey('Description (Spaced Name – details)'), 'description')
    assert.equal(normalizeHeaderKey('#'), null)
  })
})

describe('extractRecordsFromText', () => {
  it('parses a markdown tag table', () => {
    const records = extractRecordsFromText(medicalTable)
    assert.equal(records.length, 3)
    assert.equal(records[0]?.name, 'GeneralPractice')
    assert.match(String(records[0]?.description), /Primary-care/)
    assert.equal(records[1]?.name, 'Pediatrics')
  })

  it('parses numbered name and description lines', () => {
    const records = extractRecordsFromText(
      '1. **Pharmacy** – Pharmacy – In-house medication dispensing.\n2. Cardiology: Heart-care services.',
    )
    assert.equal(records.length, 2)
    assert.equal(records[0]?.name, 'Pharmacy')
    assert.equal(records[1]?.name, 'Cardiology')
  })

  it('parses a JSON array of records', () => {
    const records = extractRecordsFromText(
      JSON.stringify([
        { name: 'UrgentCare', description: 'Walk-in medical services.' },
        { name: 'DentalCare', description: 'Oral-health services.' },
      ]),
    )
    assert.equal(records.length, 2)
    assert.equal(records[0]?.name, 'UrgentCare')
  })
})

describe('pickCreateTool', () => {
  it('picks the tag create tool when the hint mentions tags', () => {
    const records = extractRecordsFromText(medicalTable)
    const tool = pickCreateTool(
      [createTag, createCatalog],
      records,
      'company_admin',
      'Add 10 Data library tags for a medical-center catalog',
    )
    assert.equal(tool?.name, 'create_data_tag')
  })

  it('returns null when two create tools match and the hint is ambiguous', () => {
    const records = [{ name: 'Clinic', description: 'A clinic label.' }]
    const tool = pickCreateTool([createTag, createCatalog], records, 'company_admin', 'please handle these')
    assert.equal(tool, null)
  })

  it('does not pick a unit tool when symbol is missing', () => {
    const records = extractRecordsFromText(medicalTable)
    const tool = pickCreateTool([createUnit], records, 'company_admin', 'add units')
    assert.equal(tool, null)
  })

  it('picks a unit tool when symbol is present', () => {
    const records = extractRecordsFromText(medicalUnitTable)
    const tool = pickCreateTool([createUnit], records, 'company_admin', 'add 10 units')
    assert.equal(tool?.name, 'create_data_unit')
  })
})

describe('liftCreateCallsFromText', () => {
  it('synthesizes one create call per table row', () => {
    const lifted = liftCreateCallsFromText({
      content: medicalTable,
      tools: [createTag, createCatalog],
      userMessage: 'Add 10 Data library tags for a medical-center catalog',
      role: 'company_admin',
    })
    assert.equal(lifted?.tool.name, 'create_data_tag')
    assert.equal(lifted?.calls.length, 3)
    assert.equal(lifted?.calls[0]?.arguments.name, 'GeneralPractice')
    assert.equal(lifted?.calls[0]?.arguments.status, 'pending')
  })

  it('capitalizes the first letter of tag names', () => {
    const lifted = liftCreateCallsFromText({
      content: '| name | description |\n| pharmacyInventory | Pharmacy Inventory - Medication stock. |',
      tools: [createTag],
      userMessage: 'Add a Data library tag',
      role: 'company_admin',
    })
    assert.equal(lifted?.calls[0]?.arguments.name, 'PharmacyInventory')
  })

  it('returns null when there are no extractable records', () => {
    const lifted = liftCreateCallsFromText({
      content: 'I can help with that.',
      tools: [createTag],
      userMessage: 'hello',
      role: 'company_admin',
    })
    assert.equal(lifted, null)
  })

  it('synthesizes one create_data_unit call per unit table row', () => {
    const lifted = liftCreateCallsFromText({
      content: medicalUnitTable,
      tools: [createUnit, createTag],
      userMessage: 'add around 10 unit of measures to the library related to medical field',
      role: 'company_admin',
    })
    assert.equal(lifted?.tool.name, 'create_data_unit')
    assert.equal(lifted?.calls.length, 10)
    assert.equal(lifted?.calls[0]?.arguments.name, 'Milligram')
    assert.equal(lifted?.calls[0]?.arguments.symbol, 'mg')
    assert.equal(lifted?.calls[0]?.arguments.is_base, false)
    assert.equal(lifted?.calls[0]?.arguments.base_unit_id, 'RtxUMRE5AoLlxkmYmbBsX')
    assert.equal(lifted?.calls[1]?.arguments.symbol, 'L')
    assert.equal(lifted?.calls[1]?.arguments.is_base, true)
    assert.equal(lifted?.calls[1]?.arguments.base_unit_id, undefined)
  })
})

describe('remainingItemsTablePrompt', () => {
  it('asks for the remaining rows and excludes names already listed', () => {
    const prompt = remainingItemsTablePrompt(10, ['ClinicHours'], createTag)
    assert.match(prompt, /exactly 9 items/)
    assert.match(prompt, /ClinicHours/)
    assert.match(prompt, /PharmacyInventory/)
    assert.match(prompt, /markdown table/)
    assert.match(prompt, /name \| description \| status/)
  })

  it('asks for every unit schema column including optional related names', () => {
    const prompt = remainingItemsTablePrompt(10, ['Milligram', 'Liter'], createUnit)
    assert.match(prompt, /exactly 8 items/)
    assert.match(prompt, /name \| symbol \| description \| is_base \| base_unit \| status/)
    assert.match(prompt, /base_unit/)
    assert.doesNotMatch(prompt, /base_unit_id/)
    assert.match(prompt, /Milligram/)
    assert.doesNotMatch(prompt, /PharmacyInventory/)
  })
})

describe('remainingCreateCallsPrompt', () => {
  it('asks for every unit schema field on each create call', () => {
    const prompt = remainingCreateCallsPrompt(10, createUnit)
    assert.match(prompt, /create_data_unit/)
    assert.match(prompt, /symbol/)
    assert.match(prompt, /is_base/)
    assert.match(prompt, /base_unit/)
    assert.match(prompt, /10 items/)
  })
})

describe('resolveCreateTool', () => {
  it('prefers an existing create tool call', () => {
    const tool = resolveCreateTool({
      tools: [createTag, createUnit],
      existingCalls: [{ id: 'c1', name: 'create_data_unit', arguments: { name: 'Liter' } }],
      userMessage: 'add tags',
    })
    assert.equal(tool?.name, 'create_data_unit')
  })

  it('picks a unit tool from the user message when there are no calls yet', () => {
    const tool = resolveCreateTool({
      tools: [createTag, createUnit],
      existingCalls: [],
      userMessage: 'add around 10 unit of measures to the library related to medical field',
    })
    assert.equal(tool?.name, 'create_data_unit')
  })
})

describe('requestedItemCount', () => {
  it('reads a requested tag count from the user message', () => {
    assert.equal(requestedItemCount('need to add 10 tag to the data library related to medical clinic'), 10)
    assert.equal(requestedItemCount('Add 10 Data library tags'), 10)
    assert.equal(requestedItemCount('add around 10 unit of measures to the library related to medical feild'), 10)
    assert.equal(requestedItemCount('hello'), null)
  })
})

describe('expandCreateCalls', () => {
  it('keeps an existing create and adds listed names from the reply', () => {
    const expanded = expandCreateCalls({
      content: medicalTable,
      tools: [createTag, createCatalog],
      userMessage: 'need to add 10 tag to the data library related to medical clinic',
      role: 'company_admin',
      existingCalls: [
        {
          id: 'toolcall0000000000100',
          name: 'create_data_tag',
          arguments: {
            name: 'ClinicHours',
            description: 'Clinic Hours - Opening times.',
            status: 'pending',
          },
        },
      ],
    })
    assert.equal(expanded.length, 4)
    assert.deepEqual(
      expanded.map((call) => call.arguments.name),
      ['ClinicHours', 'GeneralPractice', 'Pediatrics', 'Radiology'],
    )
  })

  it('keeps two unit creates and adds remaining rows from a unit table', () => {
    const expanded = expandCreateCalls({
      content: medicalUnitTable,
      tools: [createUnit, createTag],
      userMessage: 'add around 10 unit of measures to the library related to medical field',
      role: 'company_admin',
      existingCalls: [
        {
          id: 'toolcall0000000000200',
          name: 'create_data_unit',
          arguments: {
            name: 'Milligram',
            symbol: 'mg',
            description: 'Milligram - One-thousandth of a gram.',
          },
        },
        {
          id: 'toolcall0000000000201',
          name: 'create_data_unit',
          arguments: {
            name: 'Liter',
            symbol: 'L',
            description: 'Liter - Base unit for liquid volume.',
          },
        },
      ],
    })
    assert.equal(expanded.length, 10)
    assert.equal(expanded[0]?.arguments.symbol, 'mg')
    assert.equal(expanded[2]?.arguments.name, 'Milliliter')
    assert.equal(expanded[2]?.arguments.symbol, 'mL')
  })
})
