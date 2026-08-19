import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Button } from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import { AddAddonDialog } from '../addons/components/AddAddonDialog'
import { DocumentRenderer } from './DocumentRenderer'
import {
  ADDON_LAYOUT_LIMITS,
  CONTENT_BLOCK_LAYOUT_LIMITS,
  documentContentHeight,
  pointerToRect,
  resolveLayoutRect,
  writeLayoutRect,
  type LayoutLimits,
  type ResizeHandle,
} from '../document/layout'
import type {
  DesignerMode,
  DesignerSelection,
  LayoutRect,
  WebsiteAddon,
  WebsiteBreakpoint,
  WebsiteDocumentV1,
  WebsitePage,
  WebsiteTheme,
} from '../types'

type CanvasDragSession = {
  pointerId: number
  handle: ResizeHandle | 'move'
  startX: number
  startY: number
  startRect: LayoutRect
  parentWidth: number
  scale: number
  selection: DesignerSelection
  blockId: string
  addonId?: string
  layoutLimits: LayoutLimits
  startDocument: WebsiteDocumentV1
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
  canManage?: boolean
  onSelect: (selection: DesignerSelection) => void
  onChangeDocument: (document: WebsiteDocumentV1) => void
  onResizeContainer: (height: number) => void
  onAddAddon: (type: WebsiteAddon['type']) => void
  onLayer: (direction: 'up' | 'down') => void
  onDeleteSelection: () => void
  onOpenBlockSettings: () => void
  onOpenAddonSettings: () => void
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
  canManage = true,
  onSelect,
  onChangeDocument,
  onResizeContainer,
  onAddAddon,
  onLayer,
  onDeleteSelection,
  onOpenBlockSettings,
  onOpenAddonSettings,
}: DesignerCanvasProps) {
  const { t } = useTranslation('website')
  const viewportRef = useRef<HTMLDivElement>(null)
  const canvasRootRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<CanvasDragSession | null>(null)
  const changeDocumentRef = useRef(onChangeDocument)
  changeDocumentRef.current = onChangeDocument
  const [addAddonOpen, setAddAddonOpen] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(0)

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
    function onMove(event: PointerEvent) {
      const drag = dragRef.current
      if (!drag || event.pointerId !== drag.pointerId) return
      event.preventDefault()
      const nextRect = pointerToRect(
        drag.startRect,
        (event.clientX - drag.startX) / drag.scale,
        (event.clientY - drag.startY) / drag.scale,
        drag.parentWidth,
        drag.handle,
        drag.layoutLimits,
      )
      const nextBottom = nextRect.top + nextRect.height
      changeDocumentRef.current({
        ...drag.startDocument,
        container:
          drag.selection.kind === 'block'
            ? {
                ...drag.startDocument.container,
                height: Math.max(drag.startDocument.container.height, nextBottom + 16),
              }
            : drag.startDocument.container,
        blocks: drag.startDocument.blocks.map((item) => {
          if (item.id !== drag.blockId) return item
          if (drag.selection.kind === 'block') {
            return { ...item, layout: writeLayoutRect(item.layout, breakpoint, nextRect, drag.layoutLimits) }
          }
          return {
            ...item,
            addons: item.addons.map((child) =>
              child.id === drag.addonId
                ? { ...child, layout: writeLayoutRect(child.layout, breakpoint, nextRect, drag.layoutLimits) }
                : child,
            ),
          }
        }),
      })
    }

    function swallowClick(event: MouseEvent) {
      event.preventDefault()
      event.stopPropagation()
      window.removeEventListener('click', swallowClick, true)
    }

    function endDrag(event: PointerEvent) {
      const drag = dragRef.current
      if (!drag || event.pointerId !== drag.pointerId) return
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

    window.addEventListener('pointermove', onMove, { capture: true, passive: false })
    window.addEventListener('pointerup', endDrag, { capture: true })
    return () => {
      window.removeEventListener('pointermove', onMove, true)
      window.removeEventListener('pointerup', endDrag, true)
      window.removeEventListener('click', swallowClick, true)
    }
  }, [breakpoint])

  const scale = viewportWidth > 0 ? Math.min(1, viewportWidth / canvasWidth) : 1
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
    event.preventDefault()
    event.stopPropagation()
    const block = document.blocks.find((item) => item.id === grabbed.blockId)
    if (!block) return
    const addon = grabbed.kind === 'addon' ? block.addons.find((item) => item.id === grabbed.addonId) : null
    const startLayout = addon ? addon.layout : block.layout
    dragRef.current = {
      pointerId: event.pointerId,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startRect: resolveLayoutRect(startLayout, breakpoint),
      parentWidth:
        grabbed.kind === 'addon'
          ? canvasWidth * (resolveLayoutRect(block.layout, breakpoint).colSpan / 12)
          : canvasWidth,
      scale,
      selection: grabbed,
      blockId: block.id,
      addonId: grabbed.kind === 'addon' ? grabbed.addonId : undefined,
      layoutLimits: grabbed.kind === 'addon' ? ADDON_LAYOUT_LIMITS : CONTENT_BLOCK_LAYOUT_LIMITS,
      startDocument: document,
    }
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
    function onMove(moveEvent: PointerEvent) {
      onResizeContainer(Math.max(160, Math.round(startHeight + (moveEvent.clientY - startY) / currentScale)))
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
        />
      ) : null}
      <DocumentRenderer
        document={document}
        breakpoint={breakpoint}
        theme={theme}
        mode={mode}
        selection={selection}
        pages={pages}
        canManage={canManage}
        onSelect={onSelect}
        onMovePointerDown={(event, grabbed) => onHandlePointerDown(event, 'move', grabbed)}
        onResizePointerDown={(event, handle) => onHandlePointerDown(event, handle)}
        onAddAddon={() => setAddAddonOpen(true)}
        onOpenBlockSettings={onOpenBlockSettings}
        onOpenAddonSettings={onOpenAddonSettings}
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
        />
      ) : null}
        </div>
      </div>
      <AddAddonDialog
        open={addAddonOpen}
        onOpenChange={setAddAddonOpen}
        onAddonAdded={onAddAddon}
      />
    </div>
  )
}
