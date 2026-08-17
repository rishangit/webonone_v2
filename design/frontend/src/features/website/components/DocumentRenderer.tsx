import type { PointerEvent as ReactPointerEvent } from 'react'
import { getAddonModuleByType } from '../addons/registry'
import { resolveLayoutRect, rectToStyle, type ResizeHandle } from '../document/layout'
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
  selection?: DesignerSelection | null
  pages?: Pick<WebsitePage, 'id' | 'path' | 'name'>[]
  companyId?: string
  canManage?: boolean
  onSelect?: (selection: DesignerSelection) => void
  onMovePointerDown?: (event: ReactPointerEvent) => void
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

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        height: document.container.height,
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
  onMovePointerDown?: (event: ReactPointerEvent) => void
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
      className={selected ? 'ring-2 ring-primary' : undefined}
      style={{
        ...rectToStyle(rect),
        backgroundColor: block.backgroundColor || 'transparent',
        zIndex: selected || childSelected ? 10000 + block.zIndex : block.zIndex,
        cursor: interactive ? (selected ? 'move' : 'pointer') : undefined,
      }}
      onPointerDown={(event) => {
        if (!interactive) return
        event.stopPropagation()
        if (selected) onMovePointerDown?.(event)
      }}
      onClick={(event) => {
        event.stopPropagation()
        onSelect?.({ kind: 'block', blockId: block.id })
      }}
    >
      {interactive ? (
        <div className="pointer-events-none absolute inset-0 grid grid-cols-12">
          {Array.from({ length: 12 }, (_, index) => (
            <div key={index} className="border-r border-dashed border-primary/25 last:border-r-0" />
          ))}
        </div>
      ) : null}
      {addons.map((addon) => (
        <AddonView
          key={addon.id}
          blockId={block.id}
          addon={addon}
          breakpoint={breakpoint}
          theme={theme}
          selected={selection?.kind === 'addon' && selection.addonId === addon.id}
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
  pages: Pick<WebsitePage, 'id' | 'path' | 'name'>[]
  companyId?: string
  interactive: boolean
  publish: boolean
  canManage: boolean
  onSelect?: (selection: DesignerSelection) => void
  onMovePointerDown?: (event: ReactPointerEvent) => void
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
      className={selected ? 'ring-2 ring-primary' : undefined}
      style={{
        ...rectToStyle(rect),
        zIndex: selected ? 10000 + addon.zIndex : addon.zIndex,
        overflow: 'visible',
        cursor: interactive && selected ? 'move' : interactive ? 'pointer' : undefined,
      }}
      onPointerDown={(event) => {
        if (!interactive) return
        event.stopPropagation()
        if (selected) onMovePointerDown?.(event)
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
