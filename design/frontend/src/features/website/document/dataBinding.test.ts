import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { emptyLayoutByBreakpoint } from '../types'
import type { WebsiteBlock } from '../types'
import {
  collectBoundDatasetIds,
  expandBoundBlocks,
  getDataItemByPath,
  resolveAddonProps,
  resolveBlockDataItem,
  slugifyGroupName,
} from './dataBinding'
import { applyDataItemToBlock } from './slider'
import { emptyWebsiteDocument } from '../types'

function blockWith(id: string, overrides: Partial<WebsiteBlock> = {}): WebsiteBlock {
  return {
    id,
    zIndex: 0,
    layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 16, height: 160 }),
    addons: [],
    children: [],
    ...overrides,
  }
}

describe('slugifyGroupName', () => {
  it('slugifies preset-style names', () => {
    assert.equal(slugifyGroupName('Product Card'), 'product-card')
    assert.equal(slugifyGroupName('  Hello__World  '), 'hello-world')
  })
})

describe('collectBoundDatasetIds', () => {
  it('walks nested blocks', () => {
    const document = emptyWebsiteDocument()
    document.blocks = [
      blockWith('a', {
        dataBinding: { datasetId: 'ds1', itemGroup: 'card' },
        children: [
          blockWith('b', { groupName: 'card' }),
          blockWith('c', {
            dataBinding: { datasetId: 'ds2', itemGroup: 'row' },
            children: [blockWith('d', { groupName: 'row' })],
          }),
        ],
      }),
    ]
    assert.deepEqual(collectBoundDatasetIds(document).sort(), ['ds1', 'ds2'])
  })
})

describe('expandBoundBlocks', () => {
  it('clones the matching group child and keeps other siblings', () => {
    const parent = blockWith('list', {
      dataBinding: { datasetId: 'ds1', itemGroup: 'product-card', itemGap: 8 },
      layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 200 }),
      children: [
        blockWith('header', { groupName: 'static', zIndex: 0 }),
        blockWith('card', {
          groupName: 'product-card',
          zIndex: 1,
          layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 4, top: 8, height: 100 }),
          addons: [
            {
              id: 't1',
              type: 'text',
              zIndex: 0,
              layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 32 }),
              props: {
                textStyleId: '',
                content: 'Title',
                snapshot: { fontFamily: 'inherit', size: 16, color: '#111' },
              },
              dataBinding: { fields: { content: 'name' } },
            },
          ],
        }),
        blockWith('footer', { groupName: 'static-footer', zIndex: 2 }),
      ],
    })

    const items = [{ name: 'A' }, { name: 'B' }, { name: 'C' }]
    const { block, dataItemByBlockId } = expandBoundBlocks(parent, items)
    assert.equal(block.children.length, 5) // header + 3 cards + footer
    assert.equal(block.children[0]?.groupName, 'static')
    assert.equal(block.children[1]?.groupName, 'product-card')
    assert.equal(block.children[3]?.groupName, 'product-card')
    assert.equal(block.children[4]?.groupName, 'static-footer')
    assert.notEqual(block.children[1]?.id, 'card')
    assert.equal(block.children[2]?.layout['2xl'].top, 8 + 100 + 8)
    assert.ok(dataItemByBlockId[block.children[1]!.id])
    assert.equal(dataItemByBlockId[block.children[1]!.id]?.name, 'A')
    assert.equal(dataItemByBlockId[block.children[3]!.id]?.name, 'C')
  })

  it('returns no clones when items are empty', () => {
    const parent = blockWith('list', {
      dataBinding: { datasetId: 'ds1', itemGroup: 'card' },
      children: [blockWith('card', { groupName: 'card' }), blockWith('other', { groupName: 'x', zIndex: 1 })],
    })
    const { block } = expandBoundBlocks(parent, [])
    assert.equal(block.children.length, 1)
    assert.equal(block.children[0]?.groupName, 'x')
  })
})

describe('resolveAddonProps', () => {
  it('resolves text content from a dataset field', () => {
    const addon = {
      id: 't1',
      type: 'text' as const,
      zIndex: 0,
      layout: emptyLayoutByBreakpoint(),
      props: {
        textStyleId: '',
        content: 'fallback',
        snapshot: { fontFamily: 'inherit', size: 16, color: '#111' },
      },
      dataBinding: { fields: { content: 'name' } },
    }
    const resolved = resolveAddonProps(addon, { name: 'Widget' })
    assert.equal(resolved.type, 'text')
    if (resolved.type === 'text') assert.equal(resolved.props.content, 'Widget')
  })

  it('falls back to static props when field missing', () => {
    const addon = {
      id: 't1',
      type: 'text' as const,
      zIndex: 0,
      layout: emptyLayoutByBreakpoint(),
      props: {
        textStyleId: '',
        content: 'fallback',
        snapshot: { fontFamily: 'inherit', size: 16, color: '#111' },
      },
      dataBinding: { fields: { content: 'missing' } },
    }
    const resolved = resolveAddonProps(addon, { name: 'Widget' })
    if (resolved.type === 'text') assert.equal(resolved.props.content, 'fallback')
  })

  it('resolves image media from galleryImages', () => {
    const addon = {
      id: 'i1',
      type: 'image' as const,
      zIndex: 0,
      layout: emptyLayoutByBreakpoint(),
      props: {
        mediaByBreakpoint: {},
        fit: 'cover' as const,
        heightMode: 'auto' as const,
      },
      dataBinding: { fields: { media: 'galleryImages' } },
    }
    const resolved = resolveAddonProps(addon, {
      galleryImages: [{ url: 'https://cdn.example/a.jpg', fileId: 'f1' }],
    })
    if (resolved.type === 'image') {
      assert.equal(resolved.props.mediaByBreakpoint['2xl']?.url, 'https://cdn.example/a.jpg')
    }
  })
})

describe('getDataItemByPath', () => {
  it('reads absolute paths on the parent row', () => {
    assert.equal(getDataItemByPath({ name: 'Widget' }, 'name'), 'Widget')
  })

  it('falls back when an absolute nested path is used on a scoped row', () => {
    assert.equal(
      getDataItemByPath({ url: 'a.jpg', fileId: 'f1' }, 'galleryImages.url'),
      'a.jpg',
    )
  })

  it('resolves relative paths on a scoped gallery row for image media', () => {
    const addon = {
      id: 'img',
      type: 'image' as const,
      zIndex: 0,
      layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 80 }),
      props: {
        mediaByBreakpoint: {},
        fit: 'cover' as const,
        heightMode: 'auto' as const,
      },
      dataBinding: { fields: { media: 'url' } },
    }
    const resolved = resolveAddonProps(addon, { url: 'https://cdn.example/a.jpg', fileId: 'f1' })
    if (resolved.type === 'image') {
      assert.equal(resolved.props.mediaByBreakpoint['2xl']?.url, 'https://cdn.example/a.jpg')
    }
  })

  it('resolves absolute galleryImages.url on a scoped gallery row', () => {
    const addon = {
      id: 'img',
      type: 'image' as const,
      zIndex: 0,
      layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 80 }),
      props: {
        mediaByBreakpoint: {},
        fit: 'cover' as const,
        heightMode: 'auto' as const,
      },
      dataBinding: { fields: { media: 'galleryImages.url' } },
    }
    const resolved = resolveAddonProps(addon, { url: 'https://cdn.example/b.jpg', fileId: 'f2' })
    if (resolved.type === 'image') {
      assert.equal(resolved.props.mediaByBreakpoint['2xl']?.url, 'https://cdn.example/b.jpg')
    }
  })

  it('overwrites every breakpoint so a prior default image cannot stick', () => {
    const addon = {
      id: 'img',
      type: 'image' as const,
      zIndex: 0,
      layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 80 }),
      props: {
        mediaByBreakpoint: {
          sm: { fileId: 'old', url: 'https://cdn.example/old-sm.jpg' },
          md: { fileId: 'old', url: 'https://cdn.example/old-md.jpg' },
          lg: { fileId: 'old', url: 'https://cdn.example/old-lg.jpg' },
          xl: { fileId: 'old', url: 'https://cdn.example/old-xl.jpg' },
          '2xl': { fileId: 'old', url: 'https://cdn.example/old-2xl.jpg' },
        },
        fit: 'cover' as const,
        heightMode: 'auto' as const,
      },
      dataBinding: { fields: { media: 'url' } },
    }
    const resolved = resolveAddonProps(addon, { url: 'https://cdn.example/bound.jpg' })
    if (resolved.type === 'image') {
      for (const bp of ['sm', 'md', 'lg', 'xl', '2xl'] as const) {
        assert.equal(resolved.props.mediaByBreakpoint[bp]?.url, 'https://cdn.example/bound.jpg')
      }
    }
  })

  it('resolves gallery mediaId when url is missing', () => {
    const addon = {
      id: 'img',
      type: 'image' as const,
      zIndex: 0,
      layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 80 }),
      props: {
        mediaByBreakpoint: {},
        fit: 'cover' as const,
        heightMode: 'auto' as const,
      },
      dataBinding: { fields: { media: 'shot' } },
    }
    const resolved = resolveAddonProps(addon, { shot: { mediaId: 'media-1' } })
    if (resolved.type === 'image') {
      assert.equal(resolved.props.mediaByBreakpoint['2xl']?.fileId, 'media-1')
    }
  })

  it('applies nested gallery url onto image addons like text content', () => {
    const card = blockWith('gallery-card', {
      groupName: 'gallery-item',
      addons: [
        {
          id: 'img',
          type: 'image' as const,
          zIndex: 0,
          layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 80 }),
          props: {
            mediaByBreakpoint: {
              '2xl': { fileId: 'sample', url: 'https://cdn.example/default.jpg' },
            },
            fit: 'cover' as const,
            heightMode: 'auto' as const,
          },
          dataBinding: { fields: { media: 'url' } },
        },
        {
          id: 't1',
          type: 'text' as const,
          zIndex: 1,
          layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 32 }),
          props: {
            textStyleId: '',
            content: 'Caption',
            snapshot: { fontFamily: 'inherit', size: 16, color: '#111' },
          },
          dataBinding: { fields: { content: 'fileName' } },
        },
      ],
    })
    const resolved = applyDataItemToBlock(card, {
      url: 'https://cdn.example/gallery-1.jpg',
      fileName: 'gallery-1.jpg',
    })
    const image = resolved.addons.find((addon) => addon.type === 'image')
    const text = resolved.addons.find((addon) => addon.type === 'text')
    assert.equal(image?.type, 'image')
    if (image?.type === 'image') {
      assert.equal(image.props.mediaByBreakpoint['2xl']?.url, 'https://cdn.example/gallery-1.jpg')
      assert.equal(image.props.mediaByBreakpoint.lg?.url, 'https://cdn.example/gallery-1.jpg')
    }
    assert.equal(text?.type, 'text')
    if (text?.type === 'text') {
      assert.equal(text.props.content, 'gallery-1.jpg')
    }
  })
})

describe('resolveBlockDataItem / itemsPath', () => {
  it('scopes to nested object paths', () => {
    const block = blockWith('nested', {
      dataBinding: { datasetId: null, itemsPath: 'offer' },
    })
    const scoped = resolveBlockDataItem(block, {
      name: 'Product',
      offer: { price: 10, label: 'Sale' },
    })
    assert.deepEqual(scoped, { price: 10, label: 'Sale' })
  })

  it('keeps parent row for array paths', () => {
    const block = blockWith('nested', {
      dataBinding: { datasetId: null, itemsPath: 'galleryImages' },
    })
    const parent = { name: 'Product', galleryImages: [{ url: 'a' }] }
    assert.equal(resolveBlockDataItem(block, parent), parent)
  })

  it('expands item groups from inherited itemsPath', () => {
    const parent = blockWith('card', {
      dataBinding: { datasetId: null, itemsPath: 'variants', itemGroup: 'variant', itemGap: 0 },
      children: [blockWith('v1', { groupName: 'variant' })],
    })
    const { block, dataItemByBlockId } = expandBoundBlocks(parent, [
      { sku: 'A' },
      { sku: 'B' },
    ])
    assert.equal(block.children?.length, 2)
    assert.equal(Object.keys(dataItemByBlockId).length >= 2, true)
  })
})
