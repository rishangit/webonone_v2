import type { PointerEvent as ReactPointerEvent } from 'react'
import { cn } from '@webonone/ui-kit'
import { getAddonModuleByType } from '../addons/registry'
import { chromeBoxStyle, chromeClassName, chromeInlineStyle, pickElementChrome } from '../document/chrome'
import { resolveAddonProps, resolveBlockDataItem } from '../document/dataBinding'
import {
  ADDON_FRAME,
  ADDON_OUTLINE,
  CONTENT_ELEMENT_FRAME,
  CONTENT_ELEMENT_OUTLINE,
} from '../document/selectionOutline'
import { isChromePointerTarget, shouldDeferToSelectedAncestor } from '../document/selectionPointer'
import { resolveLayoutRect, type ResizeHandle } from '../document/layout'
import type {
  DesignerSelection,
  WebsiteAddon,
  WebsiteBlock,
  WebsiteBreakpoint,
  WebsitePage,
  WebsiteTheme,
} from '../types'
import { SelectionChrome } from './SelectionChrome'

export interface NestedBlockTreeProps {
  block: WebsiteBlock
  breakpoint: WebsiteBreakpoint
  theme?: WebsiteTheme | null
  pages?: Pick<WebsitePage, 'id' | 'path' | 'name'>[]
  currentPageId?: string | null
  companyId?: string
  publish?: boolean
  /** When true, this node is the slide root and fills its parent height. */
  root?: boolean
  interactive?: boolean
  canManage?: boolean
  hostBlockId?: string
  sliderAddonId?: string
  selection?: DesignerSelection | null
  datasetItemsById?: Record<string, Record<string, unknown>[]>
  /** Ambient parent row for nested parent-path sliders / scoped bindings. */
  parentDataItem?: Record<string, unknown> | null
  onSelect?: (selection: DesignerSelection) => void
  onMovePointerDown?: (event: ReactPointerEvent, grabbed: DesignerSelection) => void
  onResizePointerDown?: (
    event: ReactPointerEvent,
    handle: ResizeHandle,
    grabbed: DesignerSelection,
  ) => void
  onOpenTemplateBlockSettings?: (templateBlockId: string) => void
  onOpenTemplateAddonSettings?: (templateBlockId: string, templateAddonId: string) => void
  onLayerTemplateBlock?: (templateBlockId: string, direction: 'up' | 'down') => void
  onDeleteTemplateBlock?: (templateBlockId: string) => void
  onDuplicateTemplateBlock?: (templateBlockId: string) => void
  onLayerTemplateAddon?: (templateBlockId: string, templateAddonId: string, direction: 'up' | 'down') => void
  onDeleteTemplateAddon?: (templateBlockId: string, templateAddonId: string) => void
  onAddChild?: () => void
  onNavigatePage?: (path: string) => void
}

/**
 * Renders a content-block tree (e.g. slider slide templates).
 * In interactive designer mode, supports selection chrome and resize.
 * The slide shell (`root`) is a hidden canvas — children are the visible content elements.
 */
export function NestedBlockTree({
  block,
  breakpoint,
  theme,
  pages = [],
  currentPageId = null,
  companyId,
  publish = true,
  root = true,
  interactive = false,
  canManage = true,
  hostBlockId,
  sliderAddonId,
  selection = null,
  datasetItemsById,
  parentDataItem = null,
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
}: NestedBlockTreeProps) {
  const rect = resolveLayoutRect(block.layout, breakpoint)
  const addons = [...block.addons].sort((a, b) => a.zIndex - b.zIndex)
  const children = [...(block.children ?? [])].sort((a, b) => a.zIndex - b.zIndex)
  const selected =
    interactive &&
    !root &&
    selection?.kind === 'templateBlock' &&
    selection.templateBlockId === block.id &&
    selection.sliderAddonId === sliderAddonId
  const childSelected =
    interactive &&
    Boolean(hostBlockId && sliderAddonId) &&
    isTemplateDescendantSelected(block, selection, sliderAddonId)
  const chrome = pickElementChrome(block)
  const localParentItem = resolveBlockDataItem(block, parentDataItem)
  const hostItemsPath = block.dataBinding?.itemsPath ?? null

  return (
    <div
      className={cn(
        root ? 'relative h-full w-full' : undefined,
        // Designer: never clip preset children or their addons.
        interactive ? 'overflow-visible' : null,
        !interactive && !(selected || childSelected) && 'overflow-hidden',
        (selected || childSelected) && 'overflow-visible',
        selected && CONTENT_ELEMENT_OUTLINE,
        chromeClassName(chrome),
      )}
      data-template-block-id={block.id}
      data-slide-shell={root ? '' : undefined}
      style={
        root
          ? {
              ...chromeInlineStyle(chrome),
              // Keep shell under children so presets stay clickable.
              zIndex: 0,
              pointerEvents: interactive ? 'auto' : undefined,
            }
          : {
              ...chromeBoxStyle(rect, chrome),
              ...chromeInlineStyle(chrome),
              zIndex: selected || childSelected ? 10000 + block.zIndex : block.zIndex + 1,
              cursor: interactive ? 'move' : undefined,
              touchAction: interactive ? 'none' : undefined,
              userSelect: interactive ? 'none' : undefined,
            }
      }
      onPointerDown={(event) => {
        if (!interactive || !hostBlockId || !sliderAddonId) return
        if (isChromePointerTarget(event.target)) {
          event.stopPropagation()
          return
        }
        if (
          shouldDeferToSelectedAncestor(selection, event.currentTarget, {
            hostBlockId,
            sliderAddonId,
            templateBlockId: block.id,
          })
        ) {
          return
        }
        // Nested template blocks / addons own their pointer events.
        if (event.target instanceof Element) {
          const selfSelected =
            selection?.kind === 'templateBlock' &&
            selection.templateBlockId === block.id &&
            selection.sliderAddonId === sliderAddonId
          const nestedBlock = event.target.closest('[data-template-block-id]')
          if (
            nestedBlock &&
            nestedBlock !== event.currentTarget &&
            event.currentTarget.contains(nestedBlock) &&
            !selfSelected
          ) {
            return
          }
          const nestedAddon = event.target.closest('[data-template-addon-id]')
          if (nestedAddon && event.currentTarget.contains(nestedAddon) && !selfSelected) {
            return
          }
        }
        event.preventDefault()
        event.stopPropagation()
        // Hidden shell: select/drag the slider addon, not the shell block.
        if (root) {
          const grabbed: DesignerSelection = {
            kind: 'addon',
            blockId: hostBlockId,
            addonId: sliderAddonId,
          }
          onMovePointerDown?.(event, grabbed)
          onSelect?.(grabbed)
          return
        }
        const grabbed: DesignerSelection = {
          kind: 'templateBlock',
          hostBlockId,
          sliderAddonId,
          templateBlockId: block.id,
        }
        onMovePointerDown?.(event, grabbed)
        onSelect?.(grabbed)
      }}
      onClick={(event) => {
        if (!interactive || !hostBlockId || !sliderAddonId) return
        event.stopPropagation()
        if (
          shouldDeferToSelectedAncestor(selection, event.currentTarget, {
            hostBlockId,
            sliderAddonId,
            templateBlockId: block.id,
          })
        ) {
          return
        }
        if (root) {
          onSelect?.({ kind: 'addon', blockId: hostBlockId, addonId: sliderAddonId })
          return
        }
        onSelect?.({
          kind: 'templateBlock',
          hostBlockId,
          sliderAddonId,
          templateBlockId: block.id,
        })
      }}
    >
      {selected ? <div className={CONTENT_ELEMENT_FRAME} /> : null}
      {addons.map((addon) => (
        <NestedAddonView
          key={addon.id}
          addon={addon}
          templateBlockId={block.id}
          breakpoint={breakpoint}
          theme={theme}
          pages={pages}
          currentPageId={currentPageId}
          companyId={companyId}
          publish={publish}
          interactive={interactive}
          canManage={canManage}
          hostBlockId={hostBlockId}
          sliderAddonId={sliderAddonId}
          selection={selection}
          datasetItemsById={datasetItemsById}
          parentDataItem={localParentItem}
          hostItemsPath={hostItemsPath}
          onSelect={onSelect}
          onMovePointerDown={onMovePointerDown}
          onResizePointerDown={onResizePointerDown}
          onOpenTemplateAddonSettings={onOpenTemplateAddonSettings}
          onLayerTemplateAddon={onLayerTemplateAddon}
          onDeleteTemplateAddon={onDeleteTemplateAddon}
          onNavigatePage={onNavigatePage}
        />
      ))}
      {children.map((child) => (
        <NestedBlockTree
          key={child.id}
          block={child}
          breakpoint={breakpoint}
          theme={theme}
          pages={pages}
          currentPageId={currentPageId}
          companyId={companyId}
          publish={publish}
          root={false}
          interactive={interactive}
          canManage={canManage}
          hostBlockId={hostBlockId}
          sliderAddonId={sliderAddonId}
          selection={selection}
          datasetItemsById={datasetItemsById}
          parentDataItem={localParentItem}
          onSelect={onSelect}
          onMovePointerDown={onMovePointerDown}
          onResizePointerDown={onResizePointerDown}
          onOpenTemplateBlockSettings={onOpenTemplateBlockSettings}
          onOpenTemplateAddonSettings={onOpenTemplateAddonSettings}
          onLayerTemplateBlock={onLayerTemplateBlock}
          onDeleteTemplateBlock={onDeleteTemplateBlock}
          onDuplicateTemplateBlock={onDuplicateTemplateBlock}
          onLayerTemplateAddon={onLayerTemplateAddon}
          onDeleteTemplateAddon={onDeleteTemplateAddon}
          onAddChild={onAddChild}
          onNavigatePage={onNavigatePage}
        />
      ))}
      {interactive && selected && !root && hostBlockId && sliderAddonId && onResizePointerDown ? (
        <SelectionChrome
          kind="block"
          grabbed={{
            kind: 'templateBlock',
            hostBlockId,
            sliderAddonId,
            templateBlockId: block.id,
          }}
          canManage={canManage}
          onAddAddon={onAddChild}
          onOpenSettings={() => onOpenTemplateBlockSettings?.(block.id)}
          onDuplicate={
            onDuplicateTemplateBlock ? () => onDuplicateTemplateBlock(block.id) : undefined
          }
          onLayer={(direction) => onLayerTemplateBlock?.(block.id, direction)}
          onDelete={() => onDeleteTemplateBlock?.(block.id)}
          onResizePointerDown={onResizePointerDown}
        />
      ) : null}
    </div>
  )
}

function NestedAddonView({
  addon,
  templateBlockId,
  breakpoint,
  theme,
  pages,
  currentPageId,
  companyId,
  publish,
  interactive,
  canManage,
  hostBlockId,
  sliderAddonId,
  selection,
  datasetItemsById,
  parentDataItem = null,
  hostItemsPath = null,
  onSelect,
  onMovePointerDown,
  onResizePointerDown,
  onOpenTemplateAddonSettings,
  onLayerTemplateAddon,
  onDeleteTemplateAddon,
  onNavigatePage,
}: {
  addon: WebsiteAddon
  templateBlockId: string
  breakpoint: WebsiteBreakpoint
  theme?: WebsiteTheme | null
  pages: Pick<WebsitePage, 'id' | 'path' | 'name'>[]
  currentPageId?: string | null
  companyId?: string
  publish: boolean
  interactive: boolean
  canManage: boolean
  hostBlockId?: string
  sliderAddonId?: string
  selection: DesignerSelection | null
  datasetItemsById?: Record<string, Record<string, unknown>[]>
  parentDataItem?: Record<string, unknown> | null
  hostItemsPath?: string | null
  onSelect?: (selection: DesignerSelection) => void
  onMovePointerDown?: (event: ReactPointerEvent, grabbed: DesignerSelection) => void
  onResizePointerDown?: (
    event: ReactPointerEvent,
    handle: ResizeHandle,
    grabbed: DesignerSelection,
  ) => void
  onOpenTemplateAddonSettings?: (templateBlockId: string, templateAddonId: string) => void
  onLayerTemplateAddon?: (templateBlockId: string, templateAddonId: string, direction: 'up' | 'down') => void
  onDeleteTemplateAddon?: (templateBlockId: string, templateAddonId: string) => void
  onNavigatePage?: (path: string) => void
}) {
  const module = getAddonModuleByType(addon.type)
  const RenderComponent = module?.RenderComponent
  const rect = resolveLayoutRect(addon.layout, breakpoint)
  const selected =
    interactive &&
    selection?.kind === 'templateAddon' &&
    selection.templateAddonId === addon.id &&
    selection.templateBlockId === templateBlockId &&
    selection.sliderAddonId === sliderAddonId
  if (!RenderComponent) return null
  const chrome = pickElementChrome(addon)
  // Same as page-level AddonView: resolve field bindings from the current row.
  const resolvedAddon = resolveAddonProps(addon, parentDataItem ?? null)
  const addonGrabbed: DesignerSelection | null =
    hostBlockId && sliderAddonId
      ? {
          kind: 'templateAddon',
          hostBlockId,
          sliderAddonId,
          templateBlockId,
          templateAddonId: addon.id,
        }
      : null
  return (
    <div
      className={cn(
        interactive || selected ? 'overflow-visible' : 'overflow-hidden',
        selected && ADDON_OUTLINE,
        chromeClassName(chrome),
      )}
      data-template-addon-id={addon.id}
      style={{
        ...chromeBoxStyle(rect, chrome),
        ...chromeInlineStyle(chrome),
        zIndex: selected ? 10000 + addon.zIndex : addon.zIndex + 2,
        cursor: interactive ? 'move' : undefined,
        touchAction: interactive ? 'none' : undefined,
        userSelect: interactive ? 'none' : undefined,
      }}
      onPointerDown={(event) => {
        if (!interactive || !hostBlockId || !sliderAddonId) return
        if (isChromePointerTarget(event.target)) {
          event.stopPropagation()
          return
        }
        if (
          shouldDeferToSelectedAncestor(selection, event.currentTarget, {
            hostBlockId,
            sliderAddonId,
            templateBlockId,
          })
        ) {
          return
        }
        // Parent template block selected — keep dragging the block.
        if (
          selection?.kind === 'templateBlock' &&
          selection.templateBlockId === templateBlockId &&
          selection.sliderAddonId === sliderAddonId
        ) {
          return
        }
        event.preventDefault()
        event.stopPropagation()
        const grabbed: DesignerSelection = {
          kind: 'templateAddon',
          hostBlockId,
          sliderAddonId,
          templateBlockId,
          templateAddonId: addon.id,
        }
        onMovePointerDown?.(event, grabbed)
        onSelect?.(grabbed)
      }}
      onClick={(event) => {
        if (!interactive || !hostBlockId || !sliderAddonId) return
        event.stopPropagation()
        if (
          shouldDeferToSelectedAncestor(selection, event.currentTarget, {
            hostBlockId,
            sliderAddonId,
            templateBlockId,
          })
        ) {
          return
        }
        if (
          selection?.kind === 'templateBlock' &&
          selection.templateBlockId === templateBlockId &&
          selection.sliderAddonId === sliderAddonId
        ) {
          return
        }
        onSelect?.({
          kind: 'templateAddon',
          hostBlockId,
          sliderAddonId,
          templateBlockId,
          templateAddonId: addon.id,
        })
      }}
    >
      <div className={cn('h-full w-full', interactive ? 'overflow-visible' : 'overflow-hidden')}>
        <RenderComponent
          addon={resolvedAddon}
          breakpoint={breakpoint}
          theme={theme}
          pages={pages}
          currentPageId={currentPageId}
          companyId={companyId}
          interactive={false}
          publish={publish}
          datasetItemsById={datasetItemsById}
          parentDataItem={parentDataItem}
          hostItemsPath={hostItemsPath}
          onNavigatePage={onNavigatePage}
        />
      </div>
      {selected ? <div className={ADDON_FRAME} /> : null}
      {interactive && selected && addonGrabbed && onResizePointerDown ? (
        <SelectionChrome
          kind="addon"
          grabbed={addonGrabbed}
          canManage={canManage}
          onOpenSettings={() => onOpenTemplateAddonSettings?.(templateBlockId, addon.id)}
          onLayer={(direction) => onLayerTemplateAddon?.(templateBlockId, addon.id, direction)}
          onDelete={() => onDeleteTemplateAddon?.(templateBlockId, addon.id)}
          onResizePointerDown={onResizePointerDown}
        />
      ) : null}
    </div>
  )
}

function isTemplateDescendantSelected(
  block: WebsiteBlock,
  selection: DesignerSelection | null,
  sliderAddonId?: string,
): boolean {
  if (!selection || !sliderAddonId) return false
  if (selection.kind === 'templateAddon' && selection.sliderAddonId === sliderAddonId) {
    if (selection.templateBlockId === block.id) return true
    return (block.children ?? []).some((child) => isTemplateDescendantSelected(child, selection, sliderAddonId))
  }
  if (selection.kind === 'templateBlock' && selection.sliderAddonId === sliderAddonId) {
    if (selection.templateBlockId === block.id) return false
    return Boolean(findDescendantBlock(block, selection.templateBlockId))
  }
  return false
}

function findDescendantBlock(block: WebsiteBlock, blockId: string): boolean {
  for (const child of block.children ?? []) {
    if (child.id === blockId) return true
    if (findDescendantBlock(child, blockId)) return true
  }
  for (const addon of block.addons ?? []) {
    if (addon.type !== 'slider' || !addon.props.slideTemplate) continue
    if (addon.props.slideTemplate.id === blockId) return true
    if (findDescendantBlock(addon.props.slideTemplate, blockId)) return true
  }
  return false
}
