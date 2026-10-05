import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { displayKindFromToolName } from './createToolDisplay.js'

describe('displayKindFromToolName', () => {
  it('derives library kind labels from create tool tokens', () => {
    assert.equal(displayKindFromToolName('create_data_tag'), 'Tag')
    assert.equal(displayKindFromToolName('create_data_product'), 'Product')
    assert.equal(displayKindFromToolName('create_data_unit'), 'Unit')
    assert.equal(displayKindFromToolName('create_catalog_item'), 'Item')
    assert.equal(displayKindFromToolName('update_data_service'), 'Service')
  })
})
