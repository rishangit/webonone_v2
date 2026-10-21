import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { documentReferencesId } from './websiteDeleteReferences.js'

describe('documentReferencesId', () => {
  it('finds a page link nested in a menu', () => {
    const document = {
      blocks: [{ addons: [{ type: 'menu', props: { items: [{ linkPageId: 'page-1', children: [] }] } }] }],
    }
    assert.equal(documentReferencesId(document, 'linkPageId', 'page-1'), true)
    assert.equal(documentReferencesId(document, 'linkPageId', 'page-2'), false)
  })

  it('finds a preset used by a slider', () => {
    const document = { blocks: [{ addons: [{ type: 'slider', props: { sourcePresetId: 'preset-1' } }] }] }
    assert.equal(documentReferencesId(document, 'sourcePresetId', 'preset-1'), true)
  })
})
