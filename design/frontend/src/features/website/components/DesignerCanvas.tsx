import { useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Button } from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import { AddAddonDialog } from '../addons/components/AddAddonDialog'
import { DocumentRenderer } from './DocumentRenderer'
import { pointerToRect, resolveLayoutRect, writeLayoutRect, type ResizeHandle } from '../document/layout'
import type {
  DesignerMode,
  DesignerSelection,
  WebsiteAddon,
  WebsiteBreakpoint,
  WebsiteDocumentV1,
  WebsitePage,
  WebsiteTheme,
} from '../types'

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

  const scale = viewportWidth > 0 ? Math.min(1, viewportWidth / canvasWidth) : 1
  const logicalHeight =
    (mode === 'visual' && headerDocument ? headerDocument.container.height : 0) +
    document.container.height +
    (mode === 'visual' && footerDocument ? footerDocument.container.height : 0)

  function onHandlePointerDown(event: ReactPointerEvent, handle: ResizeHandle | 'move') {
    if (mode !== 'edit' || !selection || selection.kind === 'container') return
    event.preventDefault()
    event.stopPropagation()
    const startX = event.clientX
    const startY = event.clientY
    const block = document.blocks.find((item) => item.id === selection.blockId)
    if (!block) return
    const addon = selection.kind === 'addon' ? block.addons.find((item) => item.id === selection.addonId) : null
    const startLayout = addon ? addon.layout : block.layout
    const startRect = resolveLayoutRect(startLayout, breakpoint)
    const parentWidth =
      selection.kind === 'addon'
        ? canvasWidth * (resolveLayoutRect(block.layout, breakpoint).colSpan / 12)
        : canvasWidth
    const currentScale = scale

    const currentSelection = selection
    const currentBlock = block
    const addonId = currentSelection.kind === 'addon' ? currentSelection.addonId : undefined

    function onMove(moveEvent: PointerEvent) {
      const nextRect = pointerToRect(
        startRect,
        (moveEvent.clientX - startX) / currentScale,
        (moveEvent.clientY - startY) / currentScale,
        parentWidth,
        handle,
      )
      onChangeDocument({
        ...document,
        blocks: document.blocks.map((item) => {
          if (item.id !== currentBlock.id) return item
          if (currentSelection.kind === 'block') {
            return { ...item, layout: writeLayoutRect(item.layout, breakpoint, nextRect) }
          }
          return {
            ...item,
            addons: item.addons.map((child) =>
              child.id === addonId
                ? { ...child, layout: writeLayoutRect(child.layout, breakpoint, nextRect) }
                : child,
            ),
          }
        }),
      })
    }

    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
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
    <div ref={viewportRef} className="flex w-full min-w-0 justify-center p-6">
      <div
        className="min-w-0 overflow-hidden"
        style={{
          width: canvasWidth * scale,
          height: logicalHeight * scale,
        }}
      >
        <div
          className="relative"
          style={{
            width: canvasWidth,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
      {mode === 'visual' && headerDocument ? (
        <DocumentRenderer
          document={headerDocument}
          breakpoint={breakpoint}
          theme={theme}
          mode="visual"
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
        onMovePointerDown={(event) => onHandlePointerDown(event, 'move')}
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
      {mode === 'visual' && footerDocument ? (
        <DocumentRenderer
          document={footerDocument}
          breakpoint={breakpoint}
          theme={theme}
          mode="visual"
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
