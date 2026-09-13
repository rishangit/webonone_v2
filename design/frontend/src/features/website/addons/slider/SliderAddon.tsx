import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Button,
  cn,
  FormField,
  Input,
  Switch,
} from '@webonone/ui-kit'
import { nanoid } from 'nanoid'
import { NestedBlockTree } from '../../components/NestedBlockTree'
import {
  applyDataItemToBlock,
  clampSliderItemsPerView,
  createEmptySlideTemplate,
  DEFAULT_SLIDER_DISPLAY_SETTINGS,
  MAX_SLIDER_ITEMS_PER_VIEW,
  MIN_SLIDER_ITEMS_PER_VIEW,
  resolveSliderDisplaySettings,
  resolveSliderItems,
  resolveSliderSlideBlock,
  sliderPageCount,
  sliderPageTrackOffset,
  sliderSlotWidthPx,
  updateSliderDisplaySettings,
} from '../../document/slider'
import { resolveLayoutRect } from '../../document/layout'
import {
  emptyLayoutByBreakpoint,
  MAX_SLIDER_DATA_ITEMS,
  type WebsiteAddon,
} from '../../types'
import type { AddonModule, AddonPropsFieldsProps, AddonRenderProps } from '../types'
import { SliderDataBindingFields } from './SliderDataBindingFields'

const AUTO_SLIDE_INTERVAL_MS = 5000
const ITEM_GAP_PX = 8
const SLIDE_TRANSITION_MS = 320

function SliderAddonRenderer({
  addon,
  breakpoint,
  theme,
  pages,
  currentPageId,
  companyId,
  interactive,
  publish,
  datasetItemsById = {},
  hostBlockId,
  selection,
  canManage,
  parentDataItem = null,
  hostItemsPath = null,
  onSelect,
  onMovePointerDown,
  onResizePointerDown,
  onOpenTemplateBlockSettings,
  onOpenTemplateAddonSettings,
  onLayerTemplateBlock,
  onDeleteTemplateBlock,
  onDuplicateTemplateBlock,
  onLayerTemplateAddon,
  onDeleteTemplateAddon,
  onAddChild,
  onNavigatePage,
}: AddonRenderProps) {
  const { t } = useTranslation('website')
  const viewportRef = useRef<HTMLDivElement>(null)
  const [viewportWidth, setViewportWidth] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  const [activePage, setActivePage] = useState(0)

  const sliderProps = addon.type === 'slider' ? addon.props : null
  const template = sliderProps?.slideTemplate ?? null
  const templateRect = template ? resolveLayoutRect(template.layout, breakpoint) : null
  const addonRect = resolveLayoutRect(addon.layout, breakpoint)
  const display = sliderProps
    ? resolveSliderDisplaySettings(sliderProps, breakpoint)
    : DEFAULT_SLIDER_DISPLAY_SETTINGS
  const itemsPerView = display.itemsPerView

  const items = useMemo(() => {
    if (!sliderProps) return []
    const parentPath = sliderProps.itemsPath?.trim() || hostItemsPath?.trim() || null
    const dataSource =
      sliderProps.dataSource === 'parent' ||
      (parentPath && parentDataItem && sliderProps.dataSource !== 'manual' && !sliderProps.datasetId)
        ? 'parent'
        : sliderProps.dataSource
    return resolveSliderItems({
      dataSource: dataSource === 'parent' ? 'parent' : sliderProps.dataSource === 'manual' ? 'manual' : 'dataset',
      datasetId: sliderProps.datasetId,
      itemsPath: parentPath,
      manualSlides: sliderProps.manualSlides,
      datasetItemsById,
      parentDataItem,
      maxItems: MAX_SLIDER_DATA_ITEMS,
    })
  }, [sliderProps, datasetItemsById, hostItemsPath, parentDataItem])

  const displayItems = useMemo((): Array<Record<string, unknown> | null> => {
    if (!template) return []
    // Edit with no rows: one authoring shell. With rows: all items so nav/auto-slide match Visual.
    if (items.length === 0) return [null]
    return items
  }, [items, template])

  const itemCount = displayItems.length
  const pageCount = items.length === 0 ? 0 : sliderPageCount(items.length, itemsPerView)
  const slideSignature = `${template?.id ?? ''}|${items.length}|${itemsPerView}|${sliderProps?.dataSource ?? ''}|${sliderProps?.datasetId ?? ''}|${breakpoint}|${addonRect.height}`

  useLayoutEffect(() => {
    const node = viewportRef.current
    if (!node) return
    const target = node
    function measure() {
      setViewportWidth(target.clientWidth)
      setViewportHeight(target.clientHeight)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(target)
    return () => observer.disconnect()
  }, [slideSignature, interactive])

  useEffect(() => {
    setActivePage(0)
  }, [slideSignature])

  useEffect(() => {
    if (!display.autoSlide || pageCount < 2) return
    const timer = window.setInterval(() => {
      setActivePage((page) => (page + 1) % pageCount)
    }, AUTO_SLIDE_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [display.autoSlide, pageCount])

  if (addon.type !== 'slider' || !sliderProps) return null

  if (!template || !templateRect) {
    return (
      <div className="flex h-full items-center justify-center border border-dashed border-muted-foreground/40 px-3 text-center text-sm text-muted-foreground">
        {t('sliderEmptyTemplate')}
      </div>
    )
  }

  const safePage = Math.min(activePage, Math.max(0, pageCount - 1))
  const hasDataRows = items.length > 0
  // Empty edit shell stays full-width; data preview (Edit or Visual) uses slot sizing.
  const emptyAuthoringShell = interactive && !hasDataRows
  const slideLayoutBlock = resolveSliderSlideBlock(template, sliderProps.itemGroup, {
    authoring: emptyAuthoringShell,
  })
  const slideLayoutRect = resolveLayoutRect(slideLayoutBlock.layout, breakpoint)
  const itemWidth = emptyAuthoringShell
    ? Math.max(1, viewportWidth || 1)
    : sliderSlotWidthPx(viewportWidth || 1, slideLayoutRect.colSpan, itemsPerView, ITEM_GAP_PX)
  // Frame follows the resized slider addon — not the taller slide-template height.
  const frameHeight = Math.max(viewportHeight || addonRect.height, 80)
  const stride = itemWidth + ITEM_GAP_PX
  const trackOffset = items.length === 0 ? 0 : sliderPageTrackOffset(safePage, itemsPerView, stride)
  const canNavigate = pageCount > 1
  const showNavigation = display.showNavigation && canNavigate
  const showDots = showNavigation && pageCount <= 12

  function goToPage(page: number) {
    if (pageCount <= 0) return
    const next = ((page % pageCount) + pageCount) % pageCount
    setActivePage(next)
  }

  function stopDesignerDrag(event: MouseEvent | PointerEvent) {
    event.stopPropagation()
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={viewportRef} className="h-full w-full overflow-hidden">
        <div
          className="flex h-full items-stretch"
          style={{
            gap: ITEM_GAP_PX,
            width: Math.max(itemWidth, itemCount * stride - ITEM_GAP_PX),
            height: frameHeight,
            transform: `translate3d(${trackOffset}px, 0, 0)`,
            transition: canNavigate ? `transform ${SLIDE_TRANSITION_MS}ms ease` : undefined,
            willChange: canNavigate ? 'transform' : undefined,
          }}
        >
          {displayItems.map((dataItem, itemIndex) => {
            const isAuthoringSlot = interactive && itemIndex === 0
            const isPreviewClone = interactive && itemIndex > 0
            const slideRoot = resolveSliderSlideBlock(template, sliderProps.itemGroup, {
              authoring: isAuthoringSlot,
            })
            const resolvedBlock = applyDataItemToBlock(slideRoot, dataItem)
            return (
              <div
                key={isAuthoringSlot ? template.id : `slide-item-${itemIndex}`}
                className={cn(
                  'relative shrink-0 overflow-hidden',
                  isPreviewClone && 'pointer-events-none select-none',
                )}
                style={{ width: itemWidth, height: frameHeight }}
                aria-hidden={isPreviewClone ? true : undefined}
              >
                <NestedBlockTree
                  block={resolvedBlock}
                  breakpoint={breakpoint}
                  theme={theme}
                  pages={pages}
                  currentPageId={currentPageId}
                  companyId={companyId}
                  publish={publish}
                  interactive={isAuthoringSlot}
                  canManage={canManage}
                  hostBlockId={hostBlockId}
                  sliderAddonId={addon.id}
                  selection={isAuthoringSlot ? selection : null}
                  datasetItemsById={datasetItemsById}
                  parentDataItem={dataItem}
                  onSelect={isAuthoringSlot ? onSelect : undefined}
                  onMovePointerDown={isAuthoringSlot ? onMovePointerDown : undefined}
                  onResizePointerDown={isAuthoringSlot ? onResizePointerDown : undefined}
                  onOpenTemplateBlockSettings={isAuthoringSlot ? onOpenTemplateBlockSettings : undefined}
                  onOpenTemplateAddonSettings={isAuthoringSlot ? onOpenTemplateAddonSettings : undefined}
                  onLayerTemplateBlock={isAuthoringSlot ? onLayerTemplateBlock : undefined}
                  onDeleteTemplateBlock={isAuthoringSlot ? onDeleteTemplateBlock : undefined}
                  onDuplicateTemplateBlock={isAuthoringSlot ? onDuplicateTemplateBlock : undefined}
                  onLayerTemplateAddon={isAuthoringSlot ? onLayerTemplateAddon : undefined}
                  onDeleteTemplateAddon={isAuthoringSlot ? onDeleteTemplateAddon : undefined}
                  onAddChild={isAuthoringSlot ? onAddChild : undefined}
                  onNavigatePage={onNavigatePage}
                />
              </div>
            )
          })}
        </div>
      </div>
      {showNavigation ? (
        <>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            data-addon-control=""
            className="absolute left-2 top-1/2 z-20 size-8 -translate-y-1/2 shadow-md"
            aria-label={t('previousSlide')}
            onPointerDown={stopDesignerDrag}
            onClick={(event) => {
              stopDesignerDrag(event)
              goToPage(safePage - 1)
            }}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            data-addon-control=""
            className="absolute right-2 top-1/2 z-20 size-8 -translate-y-1/2 shadow-md"
            aria-label={t('nextSlide')}
            onPointerDown={stopDesignerDrag}
            onClick={(event) => {
              stopDesignerDrag(event)
              goToPage(safePage + 1)
            }}
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
          {showDots ? (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center pb-3"
              data-addon-control=""
              onPointerDown={stopDesignerDrag}
            >
              <div className="pointer-events-auto flex flex-nowrap items-center gap-1.5">
                {Array.from({ length: pageCount }, (_, index) => {
                  const selected = index === safePage
                  return (
                    <button
                      key={index}
                      type="button"
                      data-addon-control=""
                      aria-label={t('goToSlide', { index: index + 1 })}
                      aria-current={selected ? 'true' : undefined}
                      className={`size-2 rounded-full shadow-sm transition ${
                        selected ? 'bg-primary' : 'bg-background/70 hover:bg-background/90'
                      }`}
                      onClick={(event) => {
                        stopDesignerDrag(event)
                        goToPage(index)
                      }}
                    />
                  )
                })}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function SliderAddonPropsFields({ addon, breakpoint, onChange }: AddonPropsFieldsProps) {
  const { t } = useTranslation('website')

  if (addon.type !== 'slider') return null
  const sliderAddon = addon
  const display = resolveSliderDisplaySettings(sliderAddon.props, breakpoint)

  function patchDisplay(patch: Parameters<typeof updateSliderDisplaySettings>[2]) {
    onChange({
      ...sliderAddon,
      props: updateSliderDisplaySettings(sliderAddon.props, breakpoint, patch),
    })
  }

  return (
    <>
      <p className="text-xs text-muted-foreground">{t('sliderBreakpointHint')}</p>
      <FormField label={t('itemsPerSlide')} htmlFor="slider-items-per-view">
        <Input
          id="slider-items-per-view"
          type="number"
          min={MIN_SLIDER_ITEMS_PER_VIEW}
          max={MAX_SLIDER_ITEMS_PER_VIEW}
          value={display.itemsPerView}
          onChange={(event) => {
            const raw = Number(event.target.value)
            patchDisplay({
              itemsPerView: clampSliderItemsPerView(Number.isFinite(raw) ? raw : 1),
            })
          }}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">{t('itemsPerSlideHint')}</p>
      </FormField>
      <FormField label={t('showNavigation')} htmlFor="slider-show-navigation">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{t('showNavigationHint')}</p>
          <Switch
            id="slider-show-navigation"
            checked={display.showNavigation}
            onCheckedChange={(checked) => patchDisplay({ showNavigation: checked })}
          />
        </div>
      </FormField>
      <FormField label={t('autoSlide')} htmlFor="slider-auto-slide">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{t('autoSlideHint')}</p>
          <Switch
            id="slider-auto-slide"
            checked={display.autoSlide}
            onCheckedChange={(checked) => patchDisplay({ autoSlide: checked })}
          />
        </div>
      </FormField>
    </>
  )
}

function createDefaultSliderAddon(zIndex: number): WebsiteAddon {
  return {
    id: nanoid(10),
    type: 'slider',
    zIndex,
    layout: emptyLayoutByBreakpoint({ top: 8, height: 240, colSpan: 12 }),
    props: {
      slideTemplate: createEmptySlideTemplate(),
      sourcePresetId: null,
      dataSource: 'manual',
      datasetId: null,
      itemGroup: null,
      itemsPath: null,
      manualSlides: [],
      displayByBreakpoint: {
        '2xl': { ...DEFAULT_SLIDER_DISPLAY_SETTINGS },
      },
    },
  }
}

export const sliderAddonModule: AddonModule = {
  type: 'slider',
  labelKey: 'slider',
  descriptionKey: 'sliderDescription',
  createDefaultAddon: createDefaultSliderAddon,
  RenderComponent: SliderAddonRenderer,
  PropsFields: SliderAddonPropsFields,
  DataBindingFields: SliderDataBindingFields,
}
