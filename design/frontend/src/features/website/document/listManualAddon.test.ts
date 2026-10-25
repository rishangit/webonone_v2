import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { emptyLayoutByBreakpoint, type WebsiteBlock, type WebsiteDocumentV1 } from '../types'
import { saveManualListTemplateAddon, stripTemplateAddonRowContent } from './listManualAddon'
import { createEmptySlideTemplate } from './slider'

function docWithList(manualItems: Array<{ id: string; data: Record<string, unknown> }>): WebsiteDocumentV1 {
  const template = createEmptySlideTemplate(200)
  const card: WebsiteBlock = {
    id: 'card',
    zIndex: 1,
    layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 8, height: 160 }),
    addons: [
      {
        id: 'title',
        type: 'text',
        zIndex: 0,
        layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 40 }),
        props: {
          textStyleId: '',
          content: 'Template default',
          snapshot: { fontFamily: 'inherit', size: 16, color: '#111' },
        },
        dataBinding: { fields: { content: 'title' } },
      },
    ],
    children: [],
  }
  template.children = [card]
  return {
    version: 1,
    container: emptyLayoutByBreakpoint({ height: 400 }),
    blocks: [
      {
        id: 'host',
        zIndex: 0,
        layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 400 }),
        addons: [
          {
            id: 'list1',
            type: 'list',
            zIndex: 0,
            layout: emptyLayoutByBreakpoint({ top: 0, height: 320, colSpan: 12 }),
            props: {
              itemTemplate: template,
              sourcePresetId: null,
              dataSource: 'manual',
              datasetId: null,
              itemGroup: null,
              itemsPath: null,
              manualItems,
              itemGap: 12,
            },
          },
        ],
        children: [],
      },
    ],
  }
}

describe('saveManualListTemplateAddon', () => {
  it('stores bound text on the manual row and clears it from the template', () => {
    const document = docWithList([
      { id: 'row-a', data: { title: 'A' } },
      { id: 'row-b', data: { title: 'B' } },
    ])
    const edited = {
      id: 'title',
      type: 'text' as const,
      zIndex: 0,
      layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 40 }),
      props: {
        textStyleId: '',
        content: 'Updated B',
        snapshot: { fontFamily: 'inherit', size: 16, color: '#111' },
      },
      dataBinding: { fields: { content: 'title' } },
    }
    const next = saveManualListTemplateAddon(
      document,
      'host',
      'list1',
      'card',
      edited,
      'row-b',
    )
    const list = next.blocks[0]!.addons[0]!
    assert.equal(list.type, 'list')
    if (list.type !== 'list') return
    assert.equal(list.props.manualItems.find((item) => item.id === 'row-a')?.data.title, 'A')
    assert.equal(list.props.manualItems.find((item) => item.id === 'row-b')?.data.title, 'Updated B')
    const templateTitle = list.props.itemTemplate?.children?.[0]?.addons?.[0]
    assert.equal(templateTitle?.type, 'text')
    if (templateTitle?.type === 'text') {
      assert.equal(templateTitle.props.content, '')
    }
  })
})

describe('stripTemplateAddonRowContent', () => {
  it('clears bound text content on the template add-on', () => {
    const addon = stripTemplateAddonRowContent({
      id: 't',
      type: 'text',
      zIndex: 0,
      layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 40 }),
      props: {
        textStyleId: 'x',
        content: 'Hello',
        snapshot: { fontFamily: 'inherit', size: 16, color: '#111' },
      },
      dataBinding: { fields: { content: 'title' } },
    })
    assert.equal(addon.type, 'text')
    if (addon.type === 'text') assert.equal(addon.props.content, '')
    assert.equal(addon.props.textStyleId, 'x')
  })
})
