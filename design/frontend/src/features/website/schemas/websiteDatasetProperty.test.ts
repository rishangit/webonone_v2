import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  createWebsiteDatasetSchema,
  defaultSelectedFields,
  nodeCheckState,
  normalizeSelectedFields,
  resolveSelectedFields,
  togglePropertySelection,
  type DatasetPropertyNode,
} from './websiteDatasetSchemas.ts'

describe('dataset selectedFields schema', () => {
  it('requires at least one selected field', () => {
    const result = createWebsiteDatasetSchema.safeParse({
      name: 'Catalog',
      sourceType: 'products',
      selectedFields: [],
    })
    assert.equal(result.success, false)
  })

  it('accepts defaults for products', () => {
    const selectedFields = defaultSelectedFields('products')
    const result = createWebsiteDatasetSchema.safeParse({
      name: 'Catalog',
      sourceType: 'products',
      selectedFields,
    })
    assert.equal(result.success, true)
  })

  it('accepts defaults for services', () => {
    const selectedFields = defaultSelectedFields('services')
    assert.ok(selectedFields.includes('timeMode'))
    const result = createWebsiteDatasetSchema.safeParse({
      name: 'Services',
      sourceType: 'services',
      selectedFields,
    })
    assert.equal(result.success, true)
  })

  it('tolerates invalid source types when resolving defaults', () => {
    assert.deepEqual(defaultSelectedFields(undefined as never), defaultSelectedFields('products'))
  })

  it('parses selected fields from JSON strings', () => {
    assert.deepEqual(normalizeSelectedFields('["id","name"]'), ['id', 'name'])
    assert.deepEqual(resolveSelectedFields('services', '["id","name"]'), ['id', 'name'])
  })
})

describe('togglePropertySelection', () => {
  const gallery: DatasetPropertyNode = {
    path: 'galleryImages',
    label: 'Gallery',
    children: [
      { path: 'galleryImages.url', label: 'URL' },
      { path: 'galleryImages.fileId', label: 'File ID' },
    ],
  }

  it('checks parent and descendants together', () => {
    const next = togglePropertySelection([], gallery, true)
    assert.deepEqual(next.sort(), ['galleryImages', 'galleryImages.fileId', 'galleryImages.url'])
    assert.equal(nodeCheckState(new Set(next), gallery), true)
  })

  it('clears parent and descendants together', () => {
    const selected = ['galleryImages', 'galleryImages.url', 'galleryImages.fileId', 'name']
    const next = togglePropertySelection(selected, gallery, false)
    assert.deepEqual(next, ['name'])
  })

  it('reports indeterminate when only some children are selected', () => {
    assert.equal(nodeCheckState(new Set(['galleryImages.url']), gallery), 'indeterminate')
  })
})
