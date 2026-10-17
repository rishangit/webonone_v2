import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { websiteDocumentSchema } from '../schemas/websiteDocument.schema.ts'
import { detachCompanyDocumentRefs } from './websiteLibraryDocument.ts'

describe('detachCompanyDocumentRefs', () => {
  it('clears page links and dataset ids and assigns new block ids', () => {
    const source = websiteDocumentSchema.parse({
      version: 1,
      container: { height: 640 },
      blocks: [
        {
          id: 'block-original',
          zIndex: 0,
          dataBinding: { datasetId: 'ds_company_dataset_01' },
          layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 80 } },
          addons: [
            {
              id: 'button-1',
              type: 'button',
              zIndex: 0,
              layout: { '2xl': { col: 1, colSpan: 4, top: 0, height: 40 } },
              props: {
                label: 'Home',
                linkPageId: 'page_company_aaaaaaa',
                snapshot: {},
              },
            },
            {
              id: 'menu-1',
              type: 'menu',
              zIndex: 0,
              layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 48 } },
              props: {
                items: [
                  {
                    id: 'item-1',
                    label: 'Home',
                    linkPageId: 'page_company_aaaaaaa',
                    children: [{ id: 'child-1', label: 'About', linkPageId: 'page_company_bbbbbbb', children: [] }],
                  },
                ],
              },
            },
          ],
        },
      ],
    })

    const copied = detachCompanyDocumentRefs(source)
    const block = copied.blocks[0]
    assert.ok(block)
    assert.notEqual(block.id, 'block-original')
    assert.equal(block.dataBinding?.datasetId, null)
    const button = block.addons.find((addon) => addon.type === 'button')
    const menu = block.addons.find((addon) => addon.type === 'menu')
    assert.equal(button?.type === 'button' ? button.props.linkPageId : 'missing', null)
    assert.equal(menu?.type === 'menu' ? menu.props.items[0]?.linkPageId : 'missing', null)
    assert.equal(menu?.type === 'menu' ? menu.props.items[0]?.children[0]?.linkPageId : 'missing', null)
  })
})
