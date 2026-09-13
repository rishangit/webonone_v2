import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  emptyWebsiteDocument,
  websiteDocumentSchema,
} from './websiteDocument.schema.ts'

describe('websiteDocumentSchema', () => {
  it('accepts an empty document', () => {
    const parsed = websiteDocumentSchema.parse(emptyWebsiteDocument())
    assert.equal(parsed.version, 1)
    assert.equal(parsed.blocks.length, 0)
    assert.ok(parsed.container.height >= 64)
  })

  it('rejects a block that overflows the 12-column grid', () => {
    const result = websiteDocumentSchema.safeParse({
      version: 1,
      container: { height: 640 },
      blocks: [
        {
          id: 'b1',
          zIndex: 0,
          layout: { '2xl': { col: 10, colSpan: 4, top: 0, height: 80 } },
          addons: [],
        },
      ],
    })
    assert.equal(result.success, false)
  })

  it('accepts a document with a menu addon', () => {
    const parsed = websiteDocumentSchema.parse({
      version: 1,
      container: { height: 640 },
      blocks: [
        {
          id: 'b1',
          zIndex: 0,
          layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 48 } },
          addons: [
            {
              id: 'm1',
              type: 'menu',
              zIndex: 0,
              layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 48 } },
              props: {
                displayByBreakpoint: {
                  '2xl': { mode: 'inline', align: 'start' },
                  sm: { mode: 'hamburger', align: 'start', panelSide: 'left' },
                },
                items: [
                  {
                    id: 'i1',
                    label: 'Home',
                    textStyleId: 'ts1',
                    linkPageId: 'p1',
                    children: [
                      {
                        id: 's1',
                        label: 'About',
                        textStyleId: 'ts2',
                        linkPageId: 'p2',
                        children: [],
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ],
    })
    assert.equal(parsed.blocks[0]?.addons[0]?.type, 'menu')
    assert.deepEqual(parsed.blocks[0]?.children, [])
  })

  it('defaults missing children and accepts nested content elements', () => {
    const parsed = websiteDocumentSchema.parse({
      version: 1,
      container: { height: 640 },
      blocks: [
        {
          id: 'parent',
          zIndex: 0,
          layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 200 } },
          addons: [],
          children: [
            {
              id: 'child',
              zIndex: 0,
              layout: { '2xl': { col: 1, colSpan: 6, top: 8, height: 80 } },
              addons: [],
            },
          ],
        },
      ],
    })
    assert.equal(parsed.blocks[0]?.children.length, 1)
    assert.deepEqual(parsed.blocks[0]?.children[0]?.children, [])
  })

  it('accepts groupName and dataBinding on blocks and addons', () => {
    const parsed = websiteDocumentSchema.parse({
      version: 1,
      container: { height: 640 },
      blocks: [
        {
          id: 'list',
          zIndex: 0,
          groupName: 'product-list',
          dataBinding: {
            datasetId: 'ds_abc12345678901234',
            itemGroup: 'product-card',
            itemGap: 16,
          },
          layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 400 } },
          addons: [],
          children: [
            {
              id: 'card',
              zIndex: 0,
              groupName: 'product-card',
              layout: { '2xl': { col: 1, colSpan: 4, top: 8, height: 160 } },
              addons: [
                {
                  id: 't1',
                  type: 'text',
                  zIndex: 0,
                  layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 32 } },
                  props: { content: 'Title', textStyleId: '', snapshot: {} },
                  dataBinding: { fields: { content: 'name' } },
                },
              ],
            },
          ],
        },
      ],
    })
    assert.equal(parsed.blocks[0]?.groupName, 'product-list')
    assert.equal(parsed.blocks[0]?.dataBinding?.itemGroup, 'product-card')
    assert.equal(parsed.blocks[0]?.children[0]?.groupName, 'product-card')
    const addon = parsed.blocks[0]?.children[0]?.addons[0]
    assert.equal(addon?.type, 'text')
    assert.equal(addon?.dataBinding?.fields.content, 'name')
  })

  it('accepts shared chrome fields on blocks and addons', () => {
    const parsed = websiteDocumentSchema.parse({
      version: 1,
      container: { height: 640 },
      blocks: [
        {
          id: 'b1',
          zIndex: 0,
          backgroundColor: '#FFFFFF',
          borderColor: '#111827',
          borderRadius: 'lg',
          boxShadow: 'md',
          padding: 2,
          margin: 3,
          layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 120 } },
          addons: [
            {
              id: 'a1',
              type: 'text',
              zIndex: 0,
              backgroundColor: '#F3F4F6',
              borderColor: '#D1D5DB',
              borderRadius: 'sm',
              boxShadow: 'sm',
              padding: 1,
              margin: 1,
              layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 32 } },
              props: { content: 'Hi', textStyleId: '', snapshot: {} },
            },
          ],
          children: [],
        },
      ],
    })
    const block = parsed.blocks[0]
    assert.equal(block?.backgroundColor, '#FFFFFF')
    assert.equal(block?.borderColor, '#111827')
    assert.equal(block?.borderRadius, 'lg')
    assert.equal(block?.boxShadow, 'md')
    assert.equal(block?.padding, 2)
    assert.equal(block?.margin, 3)
    const addon = block?.addons[0]
    assert.equal(addon?.borderRadius, 'sm')
    assert.equal(addon?.boxShadow, 'sm')
    assert.equal(addon?.padding, 1)
    assert.equal(addon?.margin, 1)
  })

  it('accepts a slider addon with a preset slide template', () => {
    const parsed = websiteDocumentSchema.parse({
      version: 1,
      container: { height: 640 },
      blocks: [
        {
          id: 'b1',
          zIndex: 0,
          layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 240 } },
          addons: [
            {
              id: 's1',
              type: 'slider',
              zIndex: 0,
              layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 240 } },
              props: {
                dataSource: 'manual',
                datasetId: null,
                showNavigation: true,
                autoSlide: false,
                sourcePresetId: 'preset1',
                manualSlides: [{ id: 'ms1', data: { name: 'Alpha' } }],
                slideTemplate: {
                  id: 'tpl',
                  zIndex: 0,
                  layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 160 } },
                  addons: [
                    {
                      id: 't1',
                      type: 'text',
                      zIndex: 0,
                      layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 32 } },
                      props: { content: 'Title', textStyleId: '', snapshot: {} },
                      dataBinding: { fields: { content: 'name' } },
                    },
                  ],
                  children: [],
                },
              },
            },
          ],
          children: [],
        },
      ],
    })
    const addon = parsed.blocks[0]?.addons[0]
    assert.equal(addon?.type, 'slider')
    if (addon?.type === 'slider') {
      assert.equal(addon.props.slideTemplate?.addons[0]?.type, 'text')
      assert.equal(addon.props.manualSlides[0]?.data.name, 'Alpha')
    }
  })

  it('accepts a slider template that contains a nested parent-path slider', () => {
    const result = websiteDocumentSchema.safeParse({
      version: 1,
      container: { height: 640 },
      blocks: [
        {
          id: 'b1',
          zIndex: 0,
          layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 240 } },
          addons: [
            {
              id: 's1',
              type: 'slider',
              zIndex: 0,
              layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 240 } },
              props: {
                dataSource: 'manual',
                datasetId: null,
                manualSlides: [],
                slideTemplate: {
                  id: 'tpl',
                  zIndex: 0,
                  layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 160 } },
                  addons: [
                    {
                      id: 'nested',
                      type: 'slider',
                      zIndex: 0,
                      layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 80 } },
                      props: {
                        dataSource: 'parent',
                        datasetId: null,
                        itemsPath: 'galleryImages',
                        manualSlides: [],
                        slideTemplate: null,
                        showNavigation: true,
                        autoSlide: false,
                      },
                    },
                  ],
                  children: [],
                },
              },
            },
          ],
          children: [],
        },
      ],
    })
    assert.equal(result.success, true)
  })
})
