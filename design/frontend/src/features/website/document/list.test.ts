import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  collectListDataTree,
  listMainBlock,
  readNestedRows,
  resolveListItems,
  resolveListRowTemplate,
  writeRecordValue,
} from './list'
import { nestedItemsKey } from './templateHost'
import type { WebsiteBlock } from '../types'

function block(partial: Partial<WebsiteBlock> & Pick<WebsiteBlock, 'id'>): WebsiteBlock {
  return {
    zIndex: 0,
    layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 120 } },
    addons: [],
    children: [],
    ...partial,
  }
}

describe('collectListDataTree', () => {
  it('lists text and image fields and a nested repeating block', () => {
    const template = block({
      id: 'shell',
      children: [
        block({
          id: 'card',
          name: 'Card',
          addons: [
            {
              id: 'title',
              type: 'text',
              zIndex: 0,
              layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 40 } },
              props: {
                textStyleId: '',
                content: '',
                snapshot: { fontFamily: 'inherit', size: 16, color: '#111' },
              },
              dataBinding: { fields: { content: 'title' } },
            },
            {
              id: 'photo',
              type: 'image',
              zIndex: 1,
              layout: { '2xl': { col: 1, colSpan: 6, top: 48, height: 80 } },
              props: { mediaByBreakpoint: {}, fit: 'cover', heightMode: 'auto' },
              dataBinding: { fields: { media: 'photo' } },
            },
          ],
          children: [
            block({
              id: 'features',
              name: 'Features',
              dataBinding: { datasetId: null, itemGroup: 'feature', itemsPath: 'features' },
              children: [
                block({
                  id: 'feature-card',
                  groupName: 'feature',
                  addons: [
                    {
                      id: 'label',
                      type: 'text',
                      zIndex: 0,
                      layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 32 } },
                      props: {
                        textStyleId: '',
                        content: '',
                        snapshot: { fontFamily: 'inherit', size: 14, color: '#111' },
                      },
                      dataBinding: { fields: { content: 'label' } },
                    },
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })

    const nodes = collectListDataTree(template)
    assert.deepEqual(
      nodes.map((node) => (node.kind === 'field' ? node.path : node.label)),
      ['title', 'photo', 'Features'],
    )
    const features = nodes.find((node) => node.kind === 'set')
    assert.equal(features?.kind, 'set')
    if (features?.kind !== 'set') return
    assert.equal(features.path, 'features')
    assert.equal(features.nodes[0]?.kind, 'field')
    if (features.nodes[0]?.kind !== 'field') return
    assert.equal(features.nodes[0].path, 'label')
  })
})

describe('resolveListItems', () => {
  it('reads nested rows from the parent item', () => {
    const key = nestedItemsKey('inner')
    const parent = writeRecordValue({}, key, [{ title: 'A' }, { title: 'B' }])
    const rows = resolveListItems({
      addonId: 'inner',
      dataSource: 'parent',
      datasetId: null,
      manualItems: [],
      parentDataItem: parent,
    })
    assert.deepEqual(rows, [{ title: 'A' }, { title: 'B' }])
  })

  it('uses manual items when there is no parent row', () => {
    const rows = resolveListItems({
      addonId: 'list-1',
      dataSource: 'manual',
      datasetId: null,
      manualItems: [{ id: 'a', data: { title: 'One' } }],
    })
    assert.deepEqual(rows, [{ title: 'One' }])
  })
})

describe('listMainBlock / resolveListRowTemplate', () => {
  it('uses the item group child as the row layout', () => {
    const shell = block({
      id: 'shell',
      children: [
        block({ id: 'card', groupName: 'card', name: 'Card' }),
        block({ id: 'other', groupName: 'other' }),
      ],
    })
    assert.equal(listMainBlock(shell, 'card')?.id, 'card')
    assert.equal(resolveListRowTemplate(shell, 'card').id, 'card')
  })

  it('uses the full shell for the authoring row in edit mode', () => {
    const shell = block({
      id: 'shell',
      children: [block({ id: 'card', groupName: 'card' })],
    })
    assert.equal(resolveListRowTemplate(shell, 'card', { authoring: true }).id, 'shell')
  })

  it('uses the sole main block for preview rows when item group is unset', () => {
    const shell = block({
      id: 'shell',
      children: [block({ id: 'card', name: 'Card' })],
    })
    assert.equal(resolveListRowTemplate(shell, null, { authoring: false }).id, 'card')
  })
})

describe('readNestedRows', () => {
  it('reads an array stored on a dotted path', () => {
    const data = writeRecordValue({}, 'gallery.images', [{ url: 'a' }])
    const rows = readNestedRows(data, 'gallery.images')
    assert.equal(rows.length, 1)
    assert.equal(rows[0]?.url, 'a')
    assert.equal(typeof rows[0]?._id, 'string')
  })
})
