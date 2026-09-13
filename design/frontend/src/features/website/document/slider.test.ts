import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { emptyLayoutByBreakpoint, emptyWebsiteDocument } from '../types'
import type { WebsiteBlock } from '../types'
import { collectBoundDatasetIds, resolveAddonProps } from './dataBinding'
import {
  applyDataItemToBlock,
  changeTemplateBlockLayer,
  clampSliderItemsPerView,
  collectBindableFieldsFromTemplate,
  deleteTemplateBlock,
  duplicateTemplateBlock,
  ensureSliderSlideTemplate,
  findBlockInTree,
  findEnclosingSliderItemsPath,
  isSlideShellTemplate,
  resolveSliderDisplaySettings,
  resolveSliderItems,
  resolveSliderSlideBlock,
  resolveTemplateAddon,
  sliderItemWidthPx,
  sliderPageCount,
  sliderPageTrackOffset,
  sliderEditPreviewItems,
  sliderSlotWidthPx,
  snapshotPresetAsSlideTemplate,
  stripNestedSliders,
  updateSliderDisplaySettings,
  updateTemplateAddon,
  updateTemplateBlock,
} from './slider'
import type { WebsiteDocumentV1 } from '../types'

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

describe('resolveSliderItems', () => {
  it('returns manual slide data', () => {
    const items = resolveSliderItems({
      dataSource: 'manual',
      datasetId: null,
      manualSlides: [
        { id: 'a', data: { name: 'One' } },
        { id: 'b', data: { name: 'Two' } },
      ],
    })
    assert.deepEqual(items, [{ name: 'One' }, { name: 'Two' }])
  })

  it('returns dataset rows capped at max', () => {
    const rows = Array.from({ length: 25 }, (_, index) => ({ name: `R${index}` }))
    const items = resolveSliderItems({
      dataSource: 'dataset',
      datasetId: 'ds1',
      manualSlides: [],
      datasetItemsById: { ds1: rows },
      maxItems: 5,
    })
    assert.equal(items.length, 5)
    assert.equal(items[0]?.name, 'R0')
  })
})

describe('sliderItemWidthPx', () => {
  it('sizes items as a fraction of the slider viewport', () => {
    assert.equal(sliderItemWidthPx(1200, 12), 1200)
    assert.equal(sliderItemWidthPx(1200, 4), 400)
    assert.equal(sliderItemWidthPx(1200, 6), 600)
  })
})

describe('itemsPerView helpers', () => {
  it('defaults and clamps itemsPerView', () => {
    assert.equal(clampSliderItemsPerView(undefined), 1)
    assert.equal(clampSliderItemsPerView(null), 1)
    assert.equal(clampSliderItemsPerView(0), 1)
    assert.equal(clampSliderItemsPerView(3), 3)
    assert.equal(clampSliderItemsPerView(9), 6)
    assert.equal(clampSliderItemsPerView(2.8), 2)
  })

  it('computes page count and track offset for multi-item pages', () => {
    assert.equal(sliderPageCount(0, 2), 0)
    assert.equal(sliderPageCount(5, 2), 3)
    assert.equal(sliderPageTrackOffset(0, 2, 100), 0)
    assert.equal(sliderPageTrackOffset(1, 2, 100), -200)
  })

  it('sizes equal slots when itemsPerView > 1', () => {
    assert.equal(sliderSlotWidthPx(620, 12, 2, 20), 300)
  })
})

describe('resolveSliderDisplaySettings', () => {
  const baseProps = {
    slideTemplate: null,
    dataSource: 'manual' as const,
    datasetId: null,
    manualSlides: [],
  }

  it('inherits from 2xl when only 2xl is set', () => {
    const props = {
      ...baseProps,
      displayByBreakpoint: {
        '2xl': { itemsPerView: 3, showNavigation: false, autoSlide: true },
      },
    }
    assert.deepEqual(resolveSliderDisplaySettings(props, 'sm'), {
      itemsPerView: 3,
      showNavigation: false,
      autoSlide: true,
    })
    assert.deepEqual(resolveSliderDisplaySettings(props, 'md'), {
      itemsPerView: 3,
      showNavigation: false,
      autoSlide: true,
    })
  })

  it('uses nearest larger override; larger sizes keep walking past md', () => {
    const props = {
      ...baseProps,
      displayByBreakpoint: {
        md: { itemsPerView: 2, showNavigation: true, autoSlide: false },
        '2xl': { itemsPerView: 4, showNavigation: false, autoSlide: true },
      },
    }
    assert.equal(resolveSliderDisplaySettings(props, 'sm').itemsPerView, 2)
    assert.equal(resolveSliderDisplaySettings(props, 'md').itemsPerView, 2)
    assert.equal(resolveSliderDisplaySettings(props, 'lg').itemsPerView, 4)
  })

  it('falls back to legacy flat props when displayByBreakpoint is empty', () => {
    const props = {
      ...baseProps,
      showNavigation: false,
      autoSlide: true,
      itemsPerView: 5,
    }
    assert.deepEqual(resolveSliderDisplaySettings(props, 'sm'), {
      itemsPerView: 5,
      showNavigation: false,
      autoSlide: true,
    })
  })

  it('uses defaults when nothing is set', () => {
    assert.deepEqual(resolveSliderDisplaySettings(baseProps, 'lg'), {
      itemsPerView: 1,
      showNavigation: true,
      autoSlide: false,
    })
  })
})

describe('updateSliderDisplaySettings', () => {
  it('writes only the edited breakpoint', () => {
    const props = {
      slideTemplate: null,
      dataSource: 'manual' as const,
      datasetId: null,
      manualSlides: [],
      displayByBreakpoint: {
        '2xl': { itemsPerView: 1, showNavigation: true, autoSlide: false },
      },
    }
    const next = updateSliderDisplaySettings(props, 'md', { itemsPerView: 3 })
    assert.deepEqual(next.displayByBreakpoint?.md, {
      itemsPerView: 3,
      showNavigation: true,
      autoSlide: false,
    })
    assert.deepEqual(next.displayByBreakpoint?.['2xl'], {
      itemsPerView: 1,
      showNavigation: true,
      autoSlide: false,
    })
    assert.equal(next.displayByBreakpoint?.sm, undefined)
  })
})

describe('slider slot / page helpers', () => {
  it('keeps colSpan width when itemsPerView is 1', () => {
    assert.equal(sliderSlotWidthPx(1200, 4, 1, 8), 400)
  })

  it('uses equal slots when itemsPerView is greater than 1', () => {
    // (1200 - 8*2) / 3 = 1184/3
    assert.equal(sliderSlotWidthPx(1200, 4, 3, 8), (1200 - 16) / 3)
  })

  it('computes page count from item rows', () => {
    assert.equal(sliderPageCount(0, 3), 0)
    assert.equal(sliderPageCount(7, 3), 3)
    assert.equal(sliderPageCount(6, 3), 2)
    assert.equal(sliderPageCount(5, undefined as unknown as number), 5)
  })

  it('offsets the track by full pages', () => {
    const stride = 100
    assert.equal(sliderPageTrackOffset(0, 3, stride), 0)
    assert.equal(sliderPageTrackOffset(1, 3, stride), -300)
    assert.equal(sliderPageTrackOffset(2, 3, stride), -600)
  })

  it('builds edit preview as the first page only', () => {
    const rows = [{ a: 1 }, { a: 2 }, { a: 3 }, { a: 4 }]
    assert.deepEqual(sliderEditPreviewItems([], 3), [null])
    assert.deepEqual(sliderEditPreviewItems(rows, 3), [{ a: 1 }, { a: 2 }, { a: 3 }])
    assert.deepEqual(sliderEditPreviewItems(rows.slice(0, 2), 3), [{ a: 1 }, { a: 2 }])
    assert.deepEqual(sliderEditPreviewItems(rows, 1), [{ a: 1 }])
  })
})

describe('resolveSliderItems parent path', () => {
  it('reads parent-path array rows', () => {
    const rows = resolveSliderItems({
      dataSource: 'parent',
      datasetId: null,
      itemsPath: 'galleryImages',
      manualSlides: [],
      parentDataItem: {
        name: 'Widget',
        galleryImages: [{ url: 'a.jpg' }, { url: 'b.jpg' }],
      },
    })
    assert.equal(rows.length, 2)
    assert.equal(rows[0]?.url, 'a.jpg')
  })
})

describe('collectBindableFieldsFromTemplate / applyDataItemToBlock', () => {
  it('discovers bound paths and resolves nested addon props', () => {
    const template = blockWith('card', {
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
    })
    const fields = collectBindableFieldsFromTemplate(template)
    assert.deepEqual(fields, [{ path: 'name', propKey: 'content', kind: 'text' }])

    const resolved = applyDataItemToBlock(template, { name: 'Widget' })
    const text = resolved.addons[0]
    assert.equal(text?.type, 'text')
    if (text?.type === 'text') assert.equal(text.props.content, 'Widget')
  })
})

describe('snapshotPresetAsSlideTemplate', () => {
  it('clones the first root and keeps nested parent-path sliders', () => {
    const preset = emptyWebsiteDocument()
    preset.blocks = [
      blockWith('root', {
        addons: [
          {
            id: 'nested-slider',
            type: 'slider',
            zIndex: 0,
            layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 80 }),
            props: {
              slideTemplate: null,
              dataSource: 'parent',
              datasetId: null,
              itemsPath: 'galleryImages',
              manualSlides: [],
              showNavigation: true,
              autoSlide: false,
            },
          },
          {
            id: 't1',
            type: 'text',
            zIndex: 1,
            layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 32 }),
            props: {
              textStyleId: '',
              content: 'Hi',
              snapshot: { fontFamily: 'inherit', size: 16, color: '#111' },
            },
          },
        ],
      }),
    ]
    const template = snapshotPresetAsSlideTemplate(preset)
    assert.ok(template)
    assert.notEqual(template!.id, 'root')
    assert.equal(template!.addons.length, 2)
    assert.equal(template!.addons.some((addon) => addon.type === 'slider'), true)
  })
})

describe('stripNestedSliders', () => {
  it('preserves nested slider addons', () => {
    const block = blockWith('parent', {
      children: [
        blockWith('child', {
          addons: [
            {
              id: 's',
              type: 'slider',
              zIndex: 0,
              layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 40 }),
              props: {
                slideTemplate: null,
                dataSource: 'manual',
                datasetId: null,
                manualSlides: [],
                showNavigation: true,
                autoSlide: false,
              },
            },
          ],
        }),
      ],
    })
    const cleaned = stripNestedSliders(block)
    assert.equal(cleaned.children[0]?.addons.length, 1)
    assert.equal(cleaned.children[0]?.addons[0]?.type, 'slider')
  })
})

describe('collectBoundDatasetIds with slider', () => {
  it('includes slider dataset ids', () => {
    const document = emptyWebsiteDocument()
    document.blocks = [
      blockWith('a', {
        addons: [
          {
            id: 's1',
            type: 'slider',
            zIndex: 0,
            layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 200 }),
            props: {
              slideTemplate: null,
              dataSource: 'dataset',
              datasetId: 'ds-slider',
              manualSlides: [],
              showNavigation: true,
              autoSlide: false,
            },
          },
        ],
      }),
    ]
    assert.deepEqual(collectBoundDatasetIds(document), ['ds-slider'])
  })
})

describe('resolveAddonProps still ignores slider', () => {
  it('returns slider unchanged', () => {
    const addon = {
      id: 's1',
      type: 'slider' as const,
      zIndex: 0,
      layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 200 }),
      props: {
        slideTemplate: null,
        dataSource: 'manual' as const,
        datasetId: null,
        manualSlides: [],
        showNavigation: true,
        autoSlide: false,
      },
      dataBinding: { fields: { content: 'name' } },
    }
    const next = resolveAddonProps(addon, { name: 'X' })
    assert.equal(next.type, 'slider')
  })
})

describe('resolveSliderSlideBlock', () => {
  it('returns the matching item-group child for publish slides', () => {
    const card = blockWith('card', { groupName: 'product-item' })
    const shell = blockWith('shell', { children: [card, blockWith('other', { groupName: 'aside' })] })
    const resolved = resolveSliderSlideBlock(shell, 'product-item')
    assert.equal(resolved.id, 'card')
  })

  it('keeps the full shell while authoring', () => {
    const card = blockWith('card', { groupName: 'product-item' })
    const shell = blockWith('shell', { children: [card] })
    const resolved = resolveSliderSlideBlock(shell, 'product-item', { authoring: true })
    assert.equal(resolved.id, 'shell')
  })
})

describe('ensureSliderSlideTemplate / isSlideShellTemplate', () => {
  it('treats empty roots as slide shells', () => {
    assert.equal(isSlideShellTemplate(blockWith('shell')), true)
    assert.equal(
      isSlideShellTemplate(
        blockWith('product', {
          addons: [
            {
              id: 't1',
              type: 'text',
              zIndex: 0,
              layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 40 }),
              props: { content: 'Hi', textStyleId: null },
              dataBinding: null,
            } as never,
          ],
        }),
      ),
      false,
    )
  })

  it('wraps a preset-as-root slide into a movable shell child', () => {
    const product = blockWith('product', {
      groupName: 'product-item',
      addons: [
        {
          id: 't1',
          type: 'text',
          zIndex: 0,
          layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 40 }),
          props: { content: 'Hi', textStyleId: null },
          dataBinding: null,
        } as never,
      ],
    })
    const document: WebsiteDocumentV1 = emptyWebsiteDocument()
    document.blocks = [
      blockWith('host', {
        addons: [
          {
            id: 's1',
            type: 'slider',
            zIndex: 0,
            layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 240 }),
            props: {
              slideTemplate: product,
              sourcePresetId: null,
              dataSource: 'manual',
              datasetId: null,
              manualSlides: [],
              showNavigation: true,
              autoSlide: false,
            },
          },
        ],
      }),
    ]
    const next = ensureSliderSlideTemplate(document, 'host', 's1')
    const slider = next.blocks[0]?.addons[0]
    assert.equal(slider?.type, 'slider')
    if (slider?.type !== 'slider') return
    const shell = slider.props.slideTemplate
    assert.ok(shell)
    assert.equal(isSlideShellTemplate(shell), true)
    assert.equal(shell?.children?.[0]?.id, 'product')
    assert.equal(shell?.children?.[0]?.groupName, 'product-item')
  })
})

describe('deleteTemplateBlock / changeTemplateBlockLayer / duplicateTemplateBlock', () => {
  function docWithShellAndChildren(children: WebsiteBlock[]): WebsiteDocumentV1 {
    const document = emptyWebsiteDocument()
    document.blocks = [
      blockWith('host', {
        addons: [
          {
            id: 's1',
            type: 'slider',
            zIndex: 0,
            layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 240 }),
            props: {
              slideTemplate: blockWith('shell', { children }),
              sourcePresetId: null,
              dataSource: 'manual',
              datasetId: null,
              manualSlides: [],
              showNavigation: true,
              autoSlide: false,
            },
          },
        ],
      }),
    ]
    return document
  }

  it('refuses to delete the slide shell', () => {
    const document = docWithShellAndChildren([blockWith('a'), blockWith('b')])
    const next = deleteTemplateBlock(document, 'host', 's1', 'shell')
    const slider = next.blocks[0]?.addons[0]
    assert.equal(slider?.type, 'slider')
    if (slider?.type !== 'slider') return
    assert.equal(slider.props.slideTemplate?.id, 'shell')
    assert.equal(slider.props.slideTemplate?.children?.length, 2)
  })

  it('deletes a non-shell template block', () => {
    const document = docWithShellAndChildren([blockWith('a'), blockWith('b')])
    const next = deleteTemplateBlock(document, 'host', 's1', 'a')
    const slider = next.blocks[0]?.addons[0]
    assert.equal(slider?.type, 'slider')
    if (slider?.type !== 'slider') return
    assert.deepEqual(
      (slider.props.slideTemplate?.children ?? []).map((c) => c.id),
      ['b'],
    )
  })

  it('layers sibling template blocks', () => {
    const document = docWithShellAndChildren([
      blockWith('a', { zIndex: 0 }),
      blockWith('b', { zIndex: 1 }),
    ])
    const next = changeTemplateBlockLayer(document, 'host', 's1', 'a', 'up')
    const slider = next.blocks[0]?.addons[0]
    assert.equal(slider?.type, 'slider')
    if (slider?.type !== 'slider') return
    const children = [...(slider.props.slideTemplate?.children ?? [])].sort((x, y) => x.zIndex - y.zIndex)
    assert.equal(children[0]?.id, 'b')
    assert.equal(children[1]?.id, 'a')
  })

  it('duplicates a template block as the next sibling', () => {
    const document = docWithShellAndChildren([
      blockWith('a', {
        groupName: 'card',
        addons: [
          {
            id: 't1',
            type: 'text',
            zIndex: 0,
            layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 40 }),
            props: { content: 'Hi', textStyleId: null },
            dataBinding: null,
          } as never,
        ],
      }),
    ])
    const result = duplicateTemplateBlock(document, 'host', 's1', 'a')
    assert.ok(result)
    const slider = result!.document.blocks[0]?.addons[0]
    assert.equal(slider?.type, 'slider')
    if (slider?.type !== 'slider') return
    assert.equal(slider.props.slideTemplate?.children?.length, 2)
    assert.notEqual(result!.id, 'a')
    assert.equal(slider.props.slideTemplate?.children?.[1]?.groupName, 'card')
  })
})

describe('nested slideTemplate tree walks', () => {
  function nestedDoc(): WebsiteDocumentV1 {
    const galleryCard = blockWith('gallery-card', {
      groupName: 'gallery-item',
      addons: [
        {
          id: 'img',
          type: 'image' as const,
          zIndex: 0,
          layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 80 }),
          props: { mediaByBreakpoint: {}, fit: 'cover' as const, heightMode: 'auto' as const },
        },
      ],
    })
    const innerShell = blockWith('inner-shell', { children: [galleryCard] })
    const imagePreset = blockWith('image-preset', {
      groupName: 'product-image-slider',
      addons: [
        {
          id: 'inner-slider',
          type: 'slider' as const,
          zIndex: 0,
          layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 120 }),
          props: {
            slideTemplate: innerShell,
            dataSource: 'parent' as const,
            datasetId: null,
            itemsPath: 'galleryImages',
            itemGroup: 'gallery-item',
            manualSlides: [],
            showNavigation: true,
            autoSlide: false,
          },
        },
      ],
    })
    const item2 = blockWith('item-2', {
      groupName: 'product-item-2',
      children: [imagePreset],
    })
    const outerShell = blockWith('outer-shell', { children: [item2] })
    return {
      version: 1,
      container: { height: 640 },
      blocks: [
        blockWith('host', {
          addons: [
            {
              id: 'outer-slider',
              type: 'slider' as const,
              zIndex: 0,
              layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 0, height: 240 }),
              props: {
                slideTemplate: outerShell,
                dataSource: 'dataset' as const,
                datasetId: 'ds1',
                itemGroup: 'product-item-2',
                manualSlides: [],
                showNavigation: true,
                autoSlide: false,
              },
            },
          ],
        }),
      ],
    }
  }

  it('finds and updates blocks inside nested slider slideTemplates', () => {
    let document = nestedDoc()
    const outer = document.blocks[0]!.addons[0]
    assert.equal(outer?.type, 'slider')
    if (outer?.type !== 'slider' || !outer.props.slideTemplate) return
    const found = findBlockInTree(outer.props.slideTemplate, 'gallery-card')
    assert.ok(found)
    assert.equal(found?.groupName, 'gallery-item')

    document = updateTemplateBlock(document, 'host', 'outer-slider', 'gallery-card', (block) => ({
      ...block,
      groupName: 'gallery-item-renamed',
    }))
    const updatedOuter = document.blocks[0]!.addons[0]
    assert.equal(updatedOuter?.type, 'slider')
    if (updatedOuter?.type !== 'slider' || !updatedOuter.props.slideTemplate) return
    const after = findBlockInTree(updatedOuter.props.slideTemplate, 'gallery-card')
    assert.equal(after?.groupName, 'gallery-item-renamed')
  })

  it('saves nested template addon data binding', () => {
    let document = nestedDoc()
    const addon = resolveTemplateAddon(document, 'host', 'outer-slider', 'gallery-card', 'img')
    assert.ok(addon)
    assert.equal(addon?.type, 'image')
    if (!addon || addon.type !== 'image') return

    document = updateTemplateAddon(document, 'host', 'outer-slider', 'gallery-card', {
      ...addon,
      dataBinding: { fields: { media: 'url' } },
    })
    const saved = resolveTemplateAddon(document, 'host', 'outer-slider', 'gallery-card', 'img')
    assert.equal(saved?.dataBinding?.fields?.media, 'url')
  })

  it('reports enclosing parent-path itemsPath for nested blocks', () => {
    const document = nestedDoc()
    const slider = document.blocks[0]!.addons[0]
    assert.equal(slider?.type, 'slider')
    if (slider?.type !== 'slider') return
    assert.equal(
      findEnclosingSliderItemsPath(slider.props.slideTemplate!, 'gallery-card'),
      'galleryImages',
    )
    assert.equal(findEnclosingSliderItemsPath(slider.props.slideTemplate!, 'item-2'), null)
  })
})
