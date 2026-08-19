import type { PointerEvent as ReactPointerEvent } from 'react'
import { cn } from '@webonone/ui-kit'
import { getAddonModuleByType } from '../addons/registry'
import {
  documentContentHeight,
  resolveLayoutRect,
  rectToStyle,
  type ResizeHandle,
} from '../document/layout'
import {
  ADDON_FRAME,
  ADDON_OUTLINE,
  CONTENT_ELEMENT_FRAME,
  CONTENT_ELEMENT_OUTLINE,
  CONTENT_ELEMENT_PARENT_FRAME,
  CONTENT_ELEMENT_PARENT_OUTLINE,
} from '../document/selectionOutline'
import { SelectionChrome } from './SelectionChrome'
import type {
  DesignerMode,
  DesignerSelection,
  WebsiteAddon,
  WebsiteBlock,
  WebsiteBreakpoint,
  WebsiteDocumentV1,
  WebsitePage,
  WebsiteTheme,
} from '../types'

interface DocumentRendererProps {
  document: WebsiteDocumentV1
  breakpoint: WebsiteBreakpoint
  theme?: WebsiteTheme | null
  mode?: DesignerMode | 'publish'
  /** `content` shrink-wraps header/footer; `page` fills leftover viewport height. */
  fit?: 'canvas' | 'content' | 'page'
  selection?: DesignerSelection | null
  pages?: Pick<WebsitePage, 'id' | 'path' | 'name'>[]
  companyId?: string
  canManage?: boolean
  onSelect?: (selection: DesignerSelection) => void
  onMovePointerDown?: (event: ReactPointerEvent, grabbed: DesignerSelection) => void
  onResizePointerDown?: (event: ReactPointerEvent, handle: ResizeHandle) => void
  onAddAddon?: () => void
  onOpenBlockSettings?: () => void
  onOpenAddonSettings?: () => void
  onLayer?: (direction: 'up' | 'down') => void
  onDeleteSelection?: () => void
  onNavigatePage?: (path: string) => void
}

export function DocumentRenderer({
  document,
  breakpoint,
  theme,
  mode = 'visual',
  fit = 'canvas',
  selection,
  pages = [],
  companyId,
  canManage = true,
  onSelect,
  onMovePointerDown,
  onResizePointerDown,
  onAddAddon,
  onOpenBlockSettings,
  onOpenAddonSettings,
  onLayer,
  onDeleteSelection,
  onNavigatePage,
}: DocumentRendererProps) {
  const interactive = mode === 'edit'
  const publish = mode === 'publish'
  const sortedBlocks = [...document.blocks].sort((a, b) => a.zIndex - b.zIndex)
  const containerSelected = interactive && selection?.kind === 'container'
  const contentHeight = documentContentHeight(document, breakpoint)
  const canvasHeight = document.container.height
  const sizeStyle =
    fit === 'content'
      ? { height: contentHeight }
      : fit === 'page'
        ? { minHeight: `max(100%, ${Math.max(canvasHeight, contentHeight)}px)` }
        : { height: canvasHeight }

  return (
    <div
      className={cn('relative w-full', fit === 'page' && 'flex-1', containerSelected && CONTENT_ELEMENT_OUTLINE)}
      style={{
        ...sizeStyle,
        backgroundColor: document.container.backgroundColor || theme?.pageBackground || '#ffffff',
        color: theme?.bodyTextColor || '#111827',
      }}
      onClick={() => onSelect?.({ kind: 'container' })}
    >
      <div className="pointer-events-none absolute inset-0 grid grid-cols-12">
        {interactive
          ? Array.from({ length: 12 }, (_, index) => (
              <div key={index} className="border-r border-dashed border-black/10 last:border-r-0" />
            ))
          : null}
      </div>
      {sortedBlocks.map((block) => (
        <BlockView
          key={block.id}
          block={block}
          breakpoint={breakpoint}
          theme={theme}
          selection={selection}
          pages={pages}
          companyId={companyId}
          interactive={interactive}
          publish={publish}
          canManage={canManage}
          onSelect={onSelect}
          onMovePointerDown={onMovePointerDown}
          onResizePointerDown={onResizePointerDown}
          onAddAddon={onAddAddon}
          onOpenBlockSettings={onOpenBlockSettings}
          onOpenAddonSettings={onOpenAddonSettings}
          onLayer={onLayer}
          onDeleteSelection={onDeleteSelection}
          onNavigatePage={onNavigatePage}
        />
      ))}
    </div>
  )
}

function BlockView({
  block,
  breakpoint,
  theme,
  selection,
  pages,
  companyId,
  interactive,
  publish,
  canManage,
  onSelect,
  onMovePointerDown,
  onResizePointerDown,
  onAddAddon,
  onOpenBlockSettings,
  onOpenAddonSettings,
  onLayer,
  onDeleteSelection,
  onNavigatePage,
}: {
  block: WebsiteBlock
  breakpoint: WebsiteBreakpoint
  theme?: WebsiteTheme | null
  selection?: DesignerSelection | null
  pages: Pick<WebsitePage, 'id' | 'path' | 'name'>[]
  companyId?: string
  interactive: boolean
  publish: boolean
  canManage: boolean
  onSelect?: (selection: DesignerSelection) => void
  onMovePointerDown?: (event: ReactPointerEvent, grabbed: DesignerSelection) => void
  onResizePointerDown?: (event: ReactPointerEvent, handle: ResizeHandle) => void
  onAddAddon?: () => void
  onOpenBlockSettings?: () => void
  onOpenAddonSettings?: () => void
  onLayer?: (direction: 'up' | 'down') => void
  onDeleteSelection?: () => void
  onNavigatePage?: (path: string) => void
}) {
  const rect = resolveLayoutRect(block.layout, breakpoint)
  const selected = selection?.kind === 'block' && selection.blockId === block.id
  const childSelected = selection?.kind === 'addon' && selection.blockId === block.id
  const addons = [...block.addons].sort((a, b) => a.zIndex - b.zIndex)
  return (
    <div
      className={cn(
        'overflow-hidden',
        interactive && !block.backgroundColor && 'bg-primary/5',
        selected && CONTENT_ELEMENT_OUTLINE,
        childSelected && CONTENT_ELEMENT_PARENT_OUTLINE,
      )}
      style={{
        ...rectToStyle(rect),
        backgroundColor: block.backgroundColor || undefined,
        zIndex: selected || childSelected ? 10000 + block.zIndex : block.zIndex,
        cursor: interactive ? 'move' : undefined,
        touchAction: interactive ? 'none' : undefined,
        userSelect: interactive ? 'none' : undefined,
      }}
      onPointerDown={(event) => {
        if (!interactive) return
        if (event.target instanceof Element && event.target.closest('[data-resize-handle], [data-chrome-action]')) {
          return
        }
        if (!selected && event.target instanceof Element && event.target.closest('[data-addon-node]')) return
        event.preventDefault()
        event.stopPropagation()
        const grabbed: DesignerSelection = { kind: 'block', blockId: block.id }
        onMovePointerDown?.(event, grabbed)
        onSelect?.(grabbed)
      }}
      onClick={(event) => {
        event.stopPropagation()
        if (selected) {
          const addonId = addonIdAtPoint(event.currentTarget, event.clientX, event.clientY)
          if (addonId) {
            onSelect?.({ kind: 'addon', blockId: block.id, addonId })
            return
          }
        }
        onSelect?.({ kind: 'block', blockId: block.id })
      }}
    >
      {interactive ? (
        <div
          data-block-drag=""
          className={cn('absolute inset-0 cursor-move', selected ? 'z-[25]' : 'z-[1]')}
          style={{ touchAction: 'none' }}
        />
      ) : null}
      {interactive ? (
        <div className="pointer-events-none absolute inset-0 z-[2] grid grid-cols-12">
          {Array.from({ length: 12 }, (_, index) => (
            <div key={index} className="border-r border-dashed border-primary/25 last:border-r-0" />
          ))}
        </div>
      ) : null}
      {selected ? <div className={CONTENT_ELEMENT_FRAME} /> : null}
      {childSelected ? <div className={CONTENT_ELEMENT_PARENT_FRAME} /> : null}
      {addons.map((addon) => (
        <AddonView
          key={addon.id}
          blockId={block.id}
          addon={addon}
          breakpoint={breakpoint}
          theme={theme}
          selected={selection?.kind === 'addon' && selection.addonId === addon.id}
          blockSelected={selected}
          pages={pages}
          companyId={companyId}
          interactive={interactive}
          publish={publish}
          canManage={canManage}
          onSelect={onSelect}
          onMovePointerDown={onMovePointerDown}
          onResizePointerDown={onResizePointerDown}
          onOpenAddonSettings={onOpenAddonSettings}
          onLayer={onLayer}
          onDeleteSelection={onDeleteSelection}
          onNavigatePage={onNavigatePage}
        />
      ))}
      {interactive && selected && onResizePointerDown ? (
        <SelectionChrome
          kind="block"
          canManage={canManage}
          onAddAddon={onAddAddon}
          onOpenSettings={() => onOpenBlockSettings?.()}
          onLayer={(direction) => onLayer?.(direction)}
          onDelete={() => onDeleteSelection?.()}
          onResizePointerDown={onResizePointerDown}
        />
      ) : null}
    </div>
  )
}

function AddonView({
  blockId,
  addon,
  breakpoint,
  theme,
  selected,
  blockSelected,
  pages,
  companyId,
  interactive,
  publish,
  canManage,
  onSelect,
  onMovePointerDown,
  onResizePointerDown,
  onOpenAddonSettings,
  onLayer,
  onDeleteSelection,
  onNavigatePage,
}: {
  blockId: string
  addon: WebsiteAddon
  breakpoint: WebsiteBreakpoint
  theme?: WebsiteTheme | null
  selected: boolean
  blockSelected: boolean
  pages: Pick<WebsitePage, 'id' | 'path' | 'name'>[]
  companyId?: string
  interactive: boolean
  publish: boolean
  canManage: boolean
  onSelect?: (selection: DesignerSelection) => void
  onMovePointerDown?: (event: ReactPointerEvent, grabbed: DesignerSelection) => void
  onResizePointerDown?: (event: ReactPointerEvent, handle: ResizeHandle) => void
  onOpenAddonSettings?: () => void
  onLayer?: (direction: 'up' | 'down') => void
  onDeleteSelection?: () => void
  onNavigatePage?: (path: string) => void
}) {
  const module = getAddonModuleByType(addon.type)
  const RenderComponent = module?.RenderComponent
  const rect = resolveLayoutRect(addon.layout, breakpoint)
  return (
    <div
      className={cn(selected && ADDON_OUTLINE)}
      data-addon-node=""
      data-addon-id={addon.id}
      style={{
        ...rectToStyle(rect),
        zIndex: selected ? 10000 + addon.zIndex : addon.zIndex + 2,
        overflow: 'visible',
        cursor: interactive && !blockSelected ? 'move' : undefined,
        touchAction: interactive && !blockSelected ? 'none' : undefined,
        userSelect: interactive ? 'none' : undefined,
        pointerEvents: blockSelected ? 'none' : undefined,
      }}
      onPointerDown={(event) => {
        if (!interactive || blockSelected) return
        if (event.target instanceof Element && event.target.closest('[data-resize-handle], [data-chrome-action]')) {
          return
        }
        event.preventDefault()
        event.stopPropagation()
        const grabbed: DesignerSelection = { kind: 'addon', blockId, addonId: addon.id }
        onMovePointerDown?.(event, grabbed)
        onSelect?.(grabbed)
      }}
      onClick={(event) => {
        event.stopPropagation()
        onSelect?.({ kind: 'addon', blockId, addonId: addon.id })
      }}
    >
      <div className="h-full w-full overflow-hidden">
        {RenderComponent ? (
          <RenderComponent
            addon={addon}
            breakpoint={breakpoint}
            theme={theme}
            pages={pages}
            companyId={companyId}
            interactive={interactive}
            publish={publish}
            onNavigatePage={onNavigatePage}
          />
        ) : null}
      </div>
      {selected ? <div className={ADDON_FRAME} /> : null}
      {interactive && selected && onResizePointerDown ? (
        <SelectionChrome
          kind="addon"
          canManage={canManage}
          onOpenSettings={() => onOpenAddonSettings?.()}
          onLayer={(direction) => onLayer?.(direction)}
          onDelete={() => onDeleteSelection?.()}
          onResizePointerDown={onResizePointerDown}
        />
      ) : null}
    </div>
  )
}

function addonIdAtPoint(blockEl: HTMLElement, clientX: number, clientY: number) {
  const nodes = blockEl.querySelectorAll<HTMLElement>('[data-addon-id]')
  let hitId: string | null = null
  let hitZ = -Infinity
  for (const node of nodes) {
    const rect = node.getBoundingClientRect()
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) continue
    const z = Number.parseFloat(node.style.zIndex || '0')
    if (z >= hitZ) {
      hitZ = z
      hitId = node.dataset.addonId ?? null
    }
  }
  return hitId
}
