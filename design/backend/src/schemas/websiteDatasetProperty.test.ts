import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  defaultSelectedFields,
  pickPublicFields,
  projectSelectedFields,
  propertyTreeForSource,
} from './websiteDatasetFilters.schema.ts'

describe('dataset property selection', () => {
  it('builds a product property tree with nested gallery paths', () => {
    const tree = propertyTreeForSource('products')
    const gallery = tree.find((node) => node.path === 'galleryImages')
    assert.ok(gallery?.children?.some((child) => child.path === 'galleryImages.url'))
    assert.ok(defaultSelectedFields('products').includes('name'))
    assert.ok(defaultSelectedFields('products').includes('galleryImages.url'))
  })

  it('projects only selected top-level and nested paths', () => {
    const item = {
      id: '1',
      name: 'Widget',
      description: 'Nice',
      galleryImages: [{ url: 'https://cdn.example/a.jpg', fileId: 'f1', mimeType: 'image/jpeg' }],
      secret: 'nope',
    }
    const projected = projectSelectedFields(item, ['name', 'galleryImages.url'])
    assert.deepEqual(Object.keys(projected).sort(), ['galleryImages', 'name'])
    assert.equal(projected.name, 'Widget')
    assert.deepEqual(projected.galleryImages, [{ url: 'https://cdn.example/a.jpg' }])
  })

  it('pickPublicFields intersects whitelist with selected fields', () => {
    const item = {
      id: '1',
      name: 'Widget',
      description: 'Nice',
      listPrice: 10,
      galleryImages: [],
      internal: true,
    }
    const picked = pickPublicFields('products', item, ['name', 'listPrice'])
    assert.deepEqual(picked, { name: 'Widget', listPrice: 10 })
  })
})
