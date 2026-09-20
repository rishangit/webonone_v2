import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Button } from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import { AddAddonDialog } from '../addons/components/AddAddonDialog'
import { DocumentRenderer } from './DocumentRenderer'
import {
  ADDON_LAYOUT_LIMITS,
  CONTENT_BLOCK_LAYOUT_LIMITS,
  documentContentHeight,
  minContainerRowSpanForDesignerKind,
  pinchScaleFromSpans,
  pinchSpansFromPoints,
  pinchToRect,
  pointerToRect,
  resolveLayoutRect,
  ROW_HEIGHT,
  snapRowSpan,
  writeLayoutRect,
  type LayoutLimits,
  type PinchSpans,
  type ResizeHandle,
} from '../document/layout'
import { findBlock, findBlockPath, updateBlockById } from '../document/mutate'
import {
  findBlockInTree,
  findSliderHostContext,
  updateTemplateAddon,
  updateTemplateBlock,
} from '../document/slider'
import type {
  DesignerMode,
  DesignerSelection,
  LayoutRect,
  WebsiteAddon,
  WebsiteBreakpoint,
  WebsiteDesignerKind,
  WebsiteDocumentV1,
  WebsitePage,
  WebsitePreset,
  WebsiteTheme,
} from '../types'

type CanvasDragSession = {
  pointerId: number
  handle: ResizeHandle | 'move' | 'pinch'
  startX: number
  startY: number
  startRect: LayoutRect
  parentWidth: number
  scale: number
  selection: DesignerSelection
  blockId: string
  addonId?: string
  /** When resizing a slide-template node. */
  hostBlockId?: string
  sliderAddonId?: string
  templateBlockId?: string
  templateAddonId?: string
  layoutLimits: LayoutLimits
  startDocument: WebsiteDocumentV1
  isRootBlock: boolean
  pinchStart?: PinchSpans
}

function layoutParentWidth(
  document: WebsiteDocumentV1,
  blockId: string,
  canvasWidth: number,
  breakpoint: WebsiteBreakpoint,
  includeTargetBlock: boolean,
): number {
  const path = findBlockPath(document, blockId)
  if (path.length === 0) return canvasWidth
  const ancestors = includeTargetBlock ? path : path.slice(0, -1)
  let width = canvasWidth
  for (const ancestor of ancestors) {
    width = width * (resolveLayoutRect(ancestor.layout, breakpoint).colSpan / 12)
  }
  return width
}

function makeDragSession(
  document: WebsiteDocumentV1,
  breakpoint: WebsiteBreakpoint,
  canvasWidth: number,
  scale: number,
  handle: ResizeHandle | 'move' | 'pinch',
  grabbed: DesignerSelection,
  pointerId: number,
  clientX: number,
  clientY: number,
): CanvasDragSession | null {
  if (grabbed.kind === 'container') return null

  if (grabbed.kind === 'templateBlock' || grabbed.kind === 'templateAddon') {
    const ctx = findSliderHostContext(document, grabbed.hostBlockId, grabbed.sliderAddonId)
    if (!ctx) return null
    const templateBlock = findBlockInTree(ctx.slideTemplate, grabbed.templateBlockId)
    if (!templateBlock) return null
    if (grabbed.kind === 'templateBlock' && templateBlock.id === ctx.slideTemplate.id) return null
    const templateAddon =
      grabbed.kind === 'templateAddon'
        ? templateBlock.addons.find((item) => item.id === grabbed.templateAddonId)
        : null
    if (grabbed.kind === 'templateAddon' && !templateAddon) return null
    const startLayout = templateAddon ? templateAddon.layout : templateBlock.layout
    const hostWidth = layoutParentWidth(document, grabbed.hostBlockId, canvasWidth, breakpoint, true)
    const sliderRect = resolveLayoutRect(ctx.slider.layout, breakpoint)
    const sliderWidth = hostWidth * (sliderRect.colSpan / 12)
    const parentWidth =
      grabbed.kind === 'templateAddon'
        ? sliderWidth * (resolveLayoutRect(templateBlock.layout, breakpoint).colSpan / 12)
        : sliderWidth
    return {
      pointerId,
      handle,
      startX: clientX,
      startY: clientY,
      startRect: resolveLayoutRect(startLayout, breakpoint),
      parentWidth,
      scale,
      selection: grabbed,
      blockId: grabbed.hostBlockId,
      hostBlockId: grabbed.hostBlockId,
      sliderAddonId: grabbed.sliderAddonId,
      templateBlockId: grabbed.templateBlockId,
      templateAddonId: grabbed.kind === 'templateAddon' ? grabbed.templateAddonId : undefined,
      layoutLimits: grabbed.kind === 'templateAddon' ? ADDON_LAYOUT_LIMITS : CONTENT_BLOCK_LAYOUT_LIMITS,
      startDocument: document,
      isRootBlock: false,
    }
  }

  const block = findBlock(document, grabbed.blockId)
  if (!block) return null
  const addon = grabbed.kind === 'addon' ? block.addons.find((item) => item.id === grabbed.addonId) : null
  if (grabbed.kind === 'addon' && !addon) return null
  const startLayout = addon ? addon.layout : block.layout
  const path = findBlockPath(document, block.id)
  const isRootBlock = path.length === 1
  return {
    pointerId,
    handle,
    startX: clientX,
    startY: clientY,
    startRect: resolveLayoutRect(startLayout, breakpoint),
    parentWidth:
      grabbed.kind === 'addon'
        ? layoutParentWidth(document, block.id, canvasWidth, breakpoint, true)
        : layoutParentWidth(document, block.id, canvasWidth, breakpoint, false),
    scale,
    selection: grabbed,
    blockId: block.id,
    addonId: grabbed.kind === 'addon' ? grabbed.addonId : undefined,
    layoutLimits: grabbed.kind === 'addon' ? ADDON_LAYOUT_LIMITS : CONTENT_BLOCK_LAYOUT_LIMITS,
    startDocument: document,
    isRootBlock: grabbed.kind === 'block' && isRootBlock,
  }
}

function applySessionRect(
  drag: CanvasDragSession,
  nextRect: LayoutRect,
  breakpoint: WebsiteBreakpoint,
): WebsiteDocumentV1 {
  const nextBottom = nextRect.top + nextRect.height
  let nextDocument = drag.startDocument
  if (drag.selection.kind === 'block') {
    nextDocument = updateBlockById(drag.startDocument, drag.blockId, (item) => ({
      ...item,
      layout: writeLayoutRect(item.layout, breakpoint, nextRect, drag.layoutLimits),
    }))
    if (drag.isRootBlock) {
      nextDocument = {
        ...nextDocument,
        container: {
          ...nextDocument.container,
          height: Math.max(nextDocument.container.height, nextBottom + ROW_HEIGHT),
        },
      }
    }
  } else if (drag.selection.kind === 'templateBlock' && drag.hostBlockId && drag.sliderAddonId && drag.templateBlockId) {
    nextDocument = updateTemplateBlock(
      drag.startDocument,
      drag.hostBlockId,
      drag.sliderAddonId,
      drag.templateBlockId,
      (item) => ({
        ...item,
        layout: writeLayoutRect(item.layout, breakpoint, nextRect, drag.layoutLimits),
      }),
    )
  } else if (
    drag.selection.kind === 'templateAddon' &&
    drag.hostBlockId &&
    drag.sliderAddonId &&
    drag.templateBlockId &&
    drag.templateAddonId
  ) {
    const ctx = findSliderHostContext(drag.startDocument, drag.hostBlockId, drag.sliderAddonId)
    const templateBlock = ctx ? findBlockInTree(ctx.slideTemplate, drag.templateBlockId) : null
    const currentAddon = templateBlock?.addons.find((item) => item.id === drag.templateAddonId)
    if (currentAddon) {
      nextDocument = updateTemplateAddon(
        drag.startDocument,
        drag.hostBlockId,
        drag.sliderAddonId,
        drag.templateBlockId,
        {
          ...currentAddon,
          layout: writeLayoutRect(currentAddon.layout, breakpoint, nextRect, drag.layoutLimits),
        },
      )
    }
  } else if (drag.addonId) {
    nextDocument = updateBlockById(drag.startDocument, drag.blockId, (item) => ({
      ...item,
      addons: item.addons.map((child) =>
        child.id === drag.addonId
          ? { ...child, layout: writeLayoutRect(child.layout, breakpoint, nextRect, drag.layoutLimits) }
          : child,
      ),
    }))
  }
  return nextDocument
}

interface DesignerCanvasProps {
  document: WebsiteDocumentV1
  headerDocument?: WebsiteDocumentV1 | null
  footerDocument?: WebsiteDocumentV1 | null
  breakpoint: WebsiteBreakpoint
  canvasWidth: number
  mode: DesignerMode
  selection: DesignerSelection | null
  theme: WebsiteTheme | null
  pages: Pick<WebsitePage, 'id' | 'path' | 'name'>[]
  currentPageId?: string | null
  designerKind?: WebsiteDesignerKind
  canManage?: boolean
  datasetItemsById?: Record<string, Record<string, unknown>[]>
  onSelect: (selection: DesignerSelection) => void
  onChangeDocument: (document: WebsiteDocumentV1) => void
  onResizeContainer: (height: number) => void
  onAddAddon: (type: WebsiteAddon['type']) => void
  onAddPreset?: (preset: WebsitePreset) => void
  presets?: WebsitePreset[]
  onLayer: (direction: 'up' | 'down') => void
  onDeleteSelection: () => void
  onDuplicateSelection?: () => void
  onOpenBlockSettings: () => void
  onOpenAddonSettings: () => void
  onOpenTemplateBlockSettings?: (
    hostBlockId: string,
    sliderAddonId: string,
    templateBlockId: string,
  ) => void
  onOpenTemplateAddonSettings?: (
    hostBlockId: string,
    sliderAddonId: string,
    templateBlockId: string,
    templateAddonId: string,
  ) => void
  onLayerTemplateBlock?: (
    hostBlockId: string,
    sliderAddonId: string,
    templateBlockId: string,
    direction: 'up' | 'down',
  ) => void
  onDeleteTemplateBlock?: (
    hostBlockId: string,
    sliderAddonId: string,
    templateBlockId: string,
  ) => void
  onDuplicateTemplateBlock?: (
    hostBlockId: string,
    sliderAddonId: string,
    templateBlockId: string,
  ) => void
  onLayerTemplateAddon?: (
    hostBlockId: string,
    sliderAddonId: string,
    templateBlockId: string,
    templateAddonId: string,
    direction: 'up' | 'down',
  ) => void
  onDeleteTemplateAddon?: (
    hostBlockId: string,
    sliderAddonId: string,
    templateBlockId: string,
    templateAddonId: string,
  ) => void
  onSaveAsPreset?: () => void
  saveAsPresetDisabled?: boolean
}

export function DesignerCanvas({
  document,
  headerDocument,
  footerDocument,
  breakpoint,
  canvasWidth,
  mode,
  selection,
  theme,
  pages,
  currentPageId = null,
  designerKind,
  canManage = true,
  datasetItemsById = {},
  onSelect,
  onChangeDocument,
  onResizeContainer,
  onAddAddon,
  onAddPreset,
  presets = [],
  onLayer,
  onDeleteSelection,
  onDuplicateSelection,
  onOpenBlockSettings,
  onOpenAddonSettings,
  onOpenTemplateBlockSettings,
  onOpenTemplateAddonSettings,
  onLayerTemplateBlock,
  onDeleteTemplateBlock,
  onDuplicateTemplateBlock,
  onLayerTemplateAddon,
  onDeleteTemplateAddon,
  onSaveAsPreset,
  saveAsPresetDisabled = false,
}: DesignerCanvasProps) {
  const { t } = useTranslation('website')
  const viewportRef = useRef<HTMLDivElement>(null)
  const canvasRootRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<CanvasDragSession | null>(null)
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const documentRef = useRef(document)
  documentRef.current = document
  const selectionRef = useRef(selection)
  selectionRef.current = selection
  const modeRef = useRef(mode)
  modeRef.current = mode
  const canvasWidthRef = useRef(canvasWidth)
  canvasWidthRef.current = canvasWidth
  const scaleRef = useRef(1)
  const changeDocumentRef = useRef(onChangeDocument)
  changeDocumentRef.current = onChangeDocument
  const [addAddonOpen, setAddAddonOpen] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(0)

  const addAddonExcludeTypes = useMemo((): readonly WebsiteAddon['type'][] => {
    if (!selection) return []
    // Adding onto the host block that already owns a top-level slider — avoid a second
    // sibling slider on the same content element (use nested template children instead).
    if (selection.kind === 'addon') {
      const host = findBlock(document, selection.blockId)
      const addon = host?.addons.find((item) => item.id === selection.addonId)
      if (addon?.type === 'slider') return []
    }
    return []
  }, [document, selection])

  useLayoutEffect(() => {
    const node = viewportRef.current
    if (!node) return
    const viewport: HTMLDivElement = node
    function contentWidth() {
      const styles = getComputedStyle(viewport)
      return (
        viewport.clientWidth -
        (Number.parseFloat(styles.paddingLeft) || 0) -
        (Number.parseFloat(styles.paddingRight) || 0)
      )
    }
    const measure = (width: number) => setViewportWidth(width)
    measure(contentWidth())
    const observer = new ResizeObserver((entries) => {
      measure(entries[0]?.contentRect.width ?? contentWidth())
    })
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    function pointerPoints() {
      return [...pointersRef.current.values()]
    }

    function beginPinchFromPointers() {
      if (modeRef.current !== 'edit') return
      const grabbed = selectionRef.current
      if (!grabbed || grabbed.kind === 'container') return
      const points = pointerPoints()
      if (points.length < 2) return
      const spans = pinchSpansFromPoints(points[0], points[1])
      const existing = dragRef.current
      if (existing?.handle === 'pinch') return

      if (existing) {
        const live = makeDragSession(
          documentRef.current,
          breakpoint,
          canvasWidthRef.current,
          scaleRef.current,
          'pinch',
          existing.selection,
          existing.pointerId,
          points[0].x,
          points[0].y,
        )
        if (live) dragRef.current = { ...live, pinchStart: spans }
        return
      }

      const first = points[0]
      const session = makeDragSession(
        documentRef.current,
        breakpoint,
        canvasWidthRef.current,
        scaleRef.current,
        'pinch',
        grabbed,
        -1,
        first.x,
        first.y,
      )
      if (!session) return
      dragRef.current = { ...session, pinchStart: spans }
    }

    function onPointerDown(event: PointerEvent) {
      const root = canvasRootRef.current
      if (!root || !root.contains(event.target as Node)) return
      pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (pointersRef.current.size >= 2) {
        event.preventDefault()
        beginPinchFromPointers()
      }
    }

    function onMove(event: PointerEvent) {
      pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
      const drag = dragRef.current
      if (!drag) return

      if (drag.handle === 'pinch' && drag.pinchStart) {
        const points = pointerPoints()
        if (points.length < 2) return
        event.preventDefault()
        const current = pinchSpansFromPoints(points[0], points[1])
        const { scaleX, scaleY } = pinchScaleFromSpans(drag.pinchStart, current)
        const nextRect = pinchToRect(drag.startRect, scaleX, scaleY, drag.parentWidth, drag.layoutLimits)
        changeDocumentRef.current(applySessionRect(drag, nextRect, breakpoint))
        return
      }

      if (event.pointerId !== drag.pointerId) return
      event.preventDefault()
      const nextRect = pointerToRect(
        drag.startRect,
        (event.clientX - drag.startX) / drag.scale,
        (event.clientY - drag.startY) / drag.scale,
        drag.parentWidth,
        drag.handle === 'pinch' ? 'se' : drag.handle,
        drag.layoutLimits,
      )
      changeDocumentRef.current(applySessionRect(drag, nextRect, breakpoint))
    }

    function swallowClick(event: MouseEvent) {
      event.preventDefault()
      event.stopPropagation()
      window.removeEventListener('click', swallowClick, true)
    }

    function endDrag(event: PointerEvent) {
      pointersRef.current.delete(event.pointerId)
      const drag = dragRef.current
      if (!drag) return

      if (drag.handle === 'pinch') {
        if (pointersRef.current.size >= 2) return
        dragRef.current = null
        try {
          canvasRootRef.current?.releasePointerCapture(drag.pointerId)
        } catch {
          /* capture already released */
        }
        window.addEventListener('click', swallowClick, true)
        return
      }

      if (event.pointerId !== drag.pointerId) return
      const moved =
        Math.abs(event.clientX - drag.startX) > 3 || Math.abs(event.clientY - drag.startY) > 3
      dragRef.current = null
      try {
        canvasRootRef.current?.releasePointerCapture(event.pointerId)
      } catch {
        /* capture already released */
      }
      if (moved) {
        window.addEventListener('click', swallowClick, true)
      }
    }

    window.addEventListener('pointerdown', onPointerDown, { capture: true })
    window.addEventListener('pointermove', onMove, { capture: true, passive: false })
    window.addEventListener('pointerup', endDrag, { capture: true })
    window.addEventListener('pointercancel', endDrag, { capture: true })
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('pointermove', onMove, true)
      window.removeEventListener('pointerup', endDrag, true)
      window.removeEventListener('pointercancel', endDrag, true)
      window.removeEventListener('click', swallowClick, true)
    }
  }, [breakpoint])

  const scale = viewportWidth > 0 ? Math.min(1, viewportWidth / canvasWidth) : 1
  scaleRef.current = scale
  const headerHeight =
    mode === 'visual' && headerDocument ? documentContentHeight(headerDocument, breakpoint) : 0
  const footerHeight =
    mode === 'visual' && footerDocument ? documentContentHeight(footerDocument, breakpoint) : 0
  const logicalHeight = headerHeight + document.container.height + footerHeight

  function onHandlePointerDown(
    event: ReactPointerEvent,
    handle: ResizeHandle | 'move',
    grabbed: DesignerSelection | null = selection,
  ) {
    if (mode !== 'edit' || !grabbed || grabbed.kind === 'container') return
    if (dragRef.current?.handle === 'pinch') return
    event.preventDefault()
    event.stopPropagation()
    const session = makeDragSession(
      document,
      breakpoint,
      canvasWidth,
      scale,
      handle,
      grabbed,
      event.pointerId,
      event.clientX,
      event.clientY,
    )
    if (!session) return
    dragRef.current = session
    try {
      canvasRootRef.current?.setPointerCapture(event.pointerId)
    } catch {
      /* capture requires an active pointer; window listeners still run */
    }
  }

  function onContainerResize(event: ReactPointerEvent) {
    if (mode !== 'edit') return
    event.preventDefault()
    const startY = event.clientY
    const startHeight = document.container.height
    const currentScale = scale
    const minRowSpan = minContainerRowSpanForDesignerKind(designerKind)
    function onMove(moveEvent: PointerEvent) {
      const nextHeight = startHeight + (moveEvent.clientY - startY) / currentScale
      onResizeContainer(snapRowSpan(nextHeight, minRowSpan))
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div ref={viewportRef} className="flex w-full min-w-0 justify-center p-3 sm:p-6">
      <div
        className="min-w-0 overflow-hidden"
        style={{
          width: canvasWidth * scale,
          height: logicalHeight * scale,
        }}
      >
        <div
          ref={canvasRootRef}
          className="relative"
          style={{
            width: canvasWidth,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            touchAction: mode === 'edit' ? 'none' : undefined,
          }}
        >
      {mode === 'visual' && headerDocument && headerHeight > 0 ? (
        <DocumentRenderer
          document={headerDocument}
          breakpoint={breakpoint}
          theme={theme}
          mode="visual"
          fit="content"
          pages={pages}
          currentPageId={currentPageId}
        />
      ) : null}
      <DocumentRenderer
        document={document}
        breakpoint={breakpoint}
        theme={theme}
        mode={mode}
        selection={selection}
        pages={pages}
        currentPageId={currentPageId}
        canManage={canManage}
        datasetItemsById={datasetItemsById}
        onSelect={onSelect}
        onMovePointerDown={(event, grabbed) => onHandlePointerDown(event, 'move', grabbed)}
        onResizePointerDown={(event, handle, grabbed) => onHandlePointerDown(event, handle, grabbed)}
        onAddAddon={() => setAddAddonOpen(true)}
        onOpenBlockSettings={onOpenBlockSettings}
        onDuplicateSelection={onDuplicateSelection}
        onSaveAsPreset={onSaveAsPreset}
        saveAsPresetDisabled={saveAsPresetDisabled}
        onOpenAddonSettings={onOpenAddonSettings}
        onOpenTemplateBlockSettings={onOpenTemplateBlockSettings}
        onOpenTemplateAddonSettings={onOpenTemplateAddonSettings}
        onLayerTemplateBlock={onLayerTemplateBlock}
        onDeleteTemplateBlock={onDeleteTemplateBlock}
        onDuplicateTemplateBlock={onDuplicateTemplateBlock}
        onLayerTemplateAddon={onLayerTemplateAddon}
        onDeleteTemplateAddon={onDeleteTemplateAddon}
        onLayer={onLayer}
        onDeleteSelection={onDeleteSelection}
      />
      {mode === 'edit' ? (
        <Button
          type="button"
          variant="ghost"
          aria-label={t('resizeCanvas')}
          className="absolute bottom-0 left-0 right-0 h-3 w-auto cursor-ns-resize rounded-none bg-primary/20 p-0 hover:bg-primary/30"
          onPointerDown={onContainerResize}
        />
      ) : null}
      {mode === 'visual' && footerDocument && footerHeight > 0 ? (
        <DocumentRenderer
          document={footerDocument}
          breakpoint={breakpoint}
          theme={theme}
          mode="visual"
          fit="content"
          pages={pages}
          currentPageId={currentPageId}
        />
      ) : null}
        </div>
      </div>
      <AddAddonDialog
        open={addAddonOpen}
        designerKind={designerKind}
        presets={presets}
        excludeTypes={addAddonExcludeTypes}
        onOpenChange={setAddAddonOpen}
        onAddonAdded={onAddAddon}
        onPresetAdded={onAddPreset}
      />
    </div>
  )
}
