import type { PointerEvent as ReactPointerEvent } from 'react'
import { useMemo } from 'react'
import { cn } from '@webonone/ui-kit'
import { getAddonModuleByType } from '../addons/registry'
import { chromeBoxStyle, chromeClassName, chromeInlineStyle, pickElementChrome } from '../document/chrome'
import {
  documentContentHeight,
  resolveLayoutRect,
  ROW_HEIGHT,
  type ResizeHandle,
} from '../document/layout'
import { expandDocumentForPublish, resolveAddonProps, resolveBlockDataItem } from '../document/dataBinding'
import {
  ADDON_FRAME,
  ADDON_OUTLINE,
  CONTENT_CONTAINER_EDGE,
  CONTENT_CONTAINER_FRAME,
  CONTENT_ELEMENT_FRAME,
  CONTENT_ELEMENT_OUTLINE,
} from '../document/selectionOutline'
import { isChromePointerTarget, shouldDeferToSelectedAncestor } from '../document/selectionPointer'
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
  currentPageId?: string | null
  companyId?: string
  canManage?: boolean
  /** Dataset rows keyed by dataset id — used in publish mode for bound lists. */
  datasetItemsById?: Record<string, Record<string, unknown>[]>
  onSelect?: (selection: DesignerSelection) => void
  onMovePointerDown?: (event: ReactPointerEvent, grabbed: DesignerSelection) => void
  onResizePointerDown?: (
    event: ReactPointerEvent,
    handle: ResizeHandle,
    grabbed: DesignerSelection,
  ) => void
  onAddAddon?: () => void
  onOpenBlockSettings?: () => void
  onDuplicateSelection?: () => void
  onSaveAsPreset?: () => void
  saveAsPresetDisabled?: boolean
  onOpenAddonSettings?: () => void
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
  currentPageId = null,
  companyId,
  canManage = true,
  datasetItemsById = {},
  onSelect,
  onMovePointerDown,
  onResizePointerDown,
  onAddAddon,
  onOpenBlockSettings,
  onDuplicateSelection,
  onSaveAsPreset,
  saveAsPresetDisabled = false,
  onOpenAddonSettings,
  onOpenTemplateBlockSettings,
  onOpenTemplateAddonSettings,
  onLayerTemplateBlock,
  onDeleteTemplateBlock,
  onDuplicateTemplateBlock,
  onLayerTemplateAddon,
  onDeleteTemplateAddon,
  onLayer,
  onDeleteSelection,
  onNavigatePage,
}: DocumentRendererProps) {
  const interactive = mode === 'edit'
  const publish = mode === 'publish'
  const { renderDocument, dataItemByBlockId } = useMemo(() => {
    if (!publish) {
      return {
        renderDocument: document,
        dataItemByBlockId: {} as Record<string, Record<string, unknown>>,
      }
    }
    const expanded = expandDocumentForPublish(document, datasetItemsById, breakpoint)
    return {
      renderDocument: expanded.document,
      dataItemByBlockId: expanded.dataItemByBlockId,
    }
  }, [breakpoint, datasetItemsById, document, publish])

  const sortedBlocks = [...renderDocument.blocks].sort((a, b) => a.zIndex - b.zIndex)
  const containerSelected = interactive && selection?.kind === 'container'
  const contentHeight = documentContentHeight(renderDocument, breakpoint)
  const canvasHeight = renderDocument.container.height
  const overlayHeight =
    fit === 'content' ? contentHeight : fit === 'page' ? Math.max(canvasHeight, contentHeight) : canvasHeight
  const sizeStyle =
    fit === 'content'
      ? { height: contentHeight }
      : fit === 'page'
        ? { minHeight: `max(100%, ${Math.max(canvasHeight, contentHeight)}px)` }
        : { height: canvasHeight }

  return (
    <div
      className={cn('relative w-full', fit === 'page' && 'flex-1')}
      style={{
        ...sizeStyle,
        backgroundColor: renderDocument.container.backgroundColor || theme?.pageBackground || '#ffffff',
        color: theme?.bodyTextColor || '#111827',
      }}
      onClick={() => onSelect?.({ kind: 'container' })}
    >
      {interactive ? (
        <>
          <div className="pointer-events-none absolute inset-0 grid grid-cols-12">
            {Array.from({ length: 12 }, (_, index) => (
              <div key={index} className="border-r border-dashed border-black/10 last:border-r-0" />
            ))}
          </div>
          <RowGridOverlay height={overlayHeight} lineClassName="border-black/10" />
        </>
      ) : null}
      {sortedBlocks.map((block) => (
        <BlockView
          key={block.id}
          block={block}
          breakpoint={breakpoint}
          theme={theme}
          selection={selection}
          pages={pages}
          currentPageId={currentPageId}
          companyId={companyId}
          interactive={interactive}
          publish={publish}
          canManage={canManage}
          dataItemByBlockId={dataItemByBlockId}
          datasetItemsById={datasetItemsById}
          onSelect={onSelect}
          onMovePointerDown={onMovePointerDown}
          onResizePointerDown={onResizePointerDown}
          onAddAddon={onAddAddon}
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
          onNavigatePage={onNavigatePage}
        />
      ))}
      {/* Paint above blocks so flush-to-edge content cannot hide the container border. */}
      {interactive ? <div className={CONTENT_CONTAINER_EDGE} aria-hidden /> : null}
      {containerSelected ? <div className={CONTENT_CONTAINER_FRAME} aria-hidden /> : null}
    </div>
  )
}

function BlockView({
  block,
  breakpoint,
  theme,
  selection,
  pages,
  currentPageId = null,
  companyId,
  interactive,
  publish,
  canManage,
  dataItemByBlockId = {},
  datasetItemsById = {},
  onSelect,
  onMovePointerDown,
  onResizePointerDown,
  onAddAddon,
  onOpenBlockSettings,
  onDuplicateSelection,
  onSaveAsPreset,
  saveAsPresetDisabled = false,
  onOpenAddonSettings,
  onOpenTemplateBlockSettings,
  onOpenTemplateAddonSettings,
  onLayerTemplateBlock,
  onDeleteTemplateBlock,
  onDuplicateTemplateBlock,
  onLayerTemplateAddon,
  onDeleteTemplateAddon,
  onLayer,
  onDeleteSelection,
  onNavigatePage,
}: {
  block: WebsiteBlock
  breakpoint: WebsiteBreakpoint
  theme?: WebsiteTheme | null
  selection?: DesignerSelection | null
  pages: Pick<WebsitePage, 'id' | 'path' | 'name'>[]
  currentPageId?: string | null
  companyId?: string
  interactive: boolean
  publish: boolean
  canManage: boolean
  dataItemByBlockId?: Record<string, Record<string, unknown>>
  datasetItemsById?: Record<string, Record<string, unknown>[]>
  onSelect?: (selection: DesignerSelection) => void
  onMovePointerDown?: (event: ReactPointerEvent, grabbed: DesignerSelection) => void
  onResizePointerDown?: (
    event: ReactPointerEvent,
    handle: ResizeHandle,
    grabbed: DesignerSelection,
  ) => void
  onAddAddon?: () => void
  onOpenBlockSettings?: () => void
  onDuplicateSelection?: () => void
  onSaveAsPreset?: () => void
  saveAsPresetDisabled?: boolean
  onOpenAddonSettings?: () => void
  onOpenTemplateBlockSettings?: DocumentRendererProps['onOpenTemplateBlockSettings']
  onOpenTemplateAddonSettings?: DocumentRendererProps['onOpenTemplateAddonSettings']
  onLayerTemplateBlock?: DocumentRendererProps['onLayerTemplateBlock']
  onDeleteTemplateBlock?: DocumentRendererProps['onDeleteTemplateBlock']
  onDuplicateTemplateBlock?: DocumentRendererProps['onDuplicateTemplateBlock']
  onLayerTemplateAddon?: DocumentRendererProps['onLayerTemplateAddon']
  onDeleteTemplateAddon?: DocumentRendererProps['onDeleteTemplateAddon']
  onLayer?: (direction: 'up' | 'down') => void
  onDeleteSelection?: () => void
  onNavigatePage?: (path: string) => void
}) {
  const rect = resolveLayoutRect(block.layout, breakpoint)
  const selected = selection?.kind === 'block' && selection.blockId === block.id
  const blockGrabbed: DesignerSelection = { kind: 'block', blockId: block.id }
  const childSelected =
    (selection?.kind === 'addon' && selection.blockId === block.id) ||
    ((selection?.kind === 'templateBlock' || selection?.kind === 'templateAddon') &&
      selection.hostBlockId === block.id) ||
    (selection?.kind === 'block' &&
      selection.blockId !== block.id &&
      (block.children ?? []).some((child) => isBlockOrDescendantSelected(child, selection)))
  const addons = [...block.addons].sort((a, b) => a.zIndex - b.zIndex)
  const children = [...(block.children ?? [])].sort((a, b) => a.zIndex - b.zIndex)
  const hasChildren = children.length > 0
  const rawDataItem = dataItemByBlockId[block.id] ?? null
  const dataItem = resolveBlockDataItem(block, rawDataItem)
  const chrome = pickElementChrome(block)
  return (
    <div
      className={cn(
        interactive && !block.backgroundColor && 'bg-primary/5',
        selected || childSelected ? 'overflow-visible' : 'overflow-hidden',
        selected && CONTENT_ELEMENT_OUTLINE,
        chromeClassName(chrome),
      )}
      style={{
        ...chromeBoxStyle(rect, chrome),
        ...chromeInlineStyle(chrome),
        zIndex: selected || childSelected ? 10000 + block.zIndex : block.zIndex,
        cursor: interactive ? 'move' : undefined,
        touchAction: interactive ? 'none' : undefined,
        userSelect: interactive ? 'none' : undefined,
      }}
      onPointerDown={(event) => {
        if (!interactive) return
        if (isChromePointerTarget(event.target)) {
          event.stopPropagation()
          return
        }
        if (
          shouldDeferToSelectedAncestor(selection, event.currentTarget, {
            blockId: block.id,
            hostBlockId: block.id,
          })
        ) {
          return
        }
        // Nested block / addon elements own the event when they are the true target.
        if (event.target instanceof Element) {
          const targetBlock = event.target.closest('[data-block-id]')
          if (targetBlock && targetBlock !== event.currentTarget && !selected) return
          const targetAddon = event.target.closest('[data-addon-node]')
          if (targetAddon) {
            const owningBlock = targetAddon.closest('[data-block-id]')
            // When this block is selected, nested addons defer so we can drag the block.
            if (owningBlock === event.currentTarget && !selected) return
          }
        }
        event.preventDefault()
        event.stopPropagation()
        const grabbed: DesignerSelection = { kind: 'block', blockId: block.id }
        onMovePointerDown?.(event, grabbed)
        onSelect?.(grabbed)
      }}
      onClick={(event) => {
        event.stopPropagation()
        if (event.target instanceof Element) {
          const targetBlock = event.target.closest('[data-block-id]')
          if (targetBlock && targetBlock !== event.currentTarget) return
          if (selected) {
            const addonNode = event.target.closest<HTMLElement>('[data-addon-id]')
            if (addonNode) {
              const owningBlock = addonNode.closest('[data-block-id]')
              const addonId = addonNode.dataset.addonId
              if (owningBlock === event.currentTarget && addonId) {
                onSelect?.({ kind: 'addon', blockId: block.id, addonId })
                return
              }
            }
          }
        }
        onSelect?.({ kind: 'block', blockId: block.id })
      }}
      data-block-node=""
      data-block-id={block.id}
    >
      {interactive ? (
        <div
          data-block-drag=""
          className={cn(
            'absolute inset-0 cursor-move',
            selected ? 'z-[25]' : 'z-[1]',
            // Keep children / nested presets clickable above the wrapper drag layer.
            hasChildren && 'pointer-events-none',
          )}
          style={{ touchAction: 'none' }}
        />
      ) : null}
      {interactive ? (
        <>
          <div className="pointer-events-none absolute inset-0 z-[2] grid grid-cols-12">
            {Array.from({ length: 12 }, (_, index) => (
              <div key={index} className="border-r border-dashed border-primary/25 last:border-r-0" />
            ))}
          </div>
          <RowGridOverlay height={rect.height} lineClassName="border-primary/25" className="z-[2]" />
        </>
      ) : null}
      {selected ? <div className={CONTENT_ELEMENT_FRAME} /> : null}
      {addons.map((addon) => (
        <AddonView
          key={addon.id}
          blockId={block.id}
          addon={resolveAddonProps(addon, dataItem)}
          breakpoint={breakpoint}
          theme={theme}
          selected={selection?.kind === 'addon' && selection.addonId === addon.id}
          blockSelected={selected}
          pages={pages}
          currentPageId={currentPageId}
          companyId={companyId}
          interactive={interactive}
          publish={publish}
          canManage={canManage}
          datasetItemsById={datasetItemsById}
          parentDataItem={dataItem}
          hostItemsPath={block.dataBinding?.itemsPath ?? null}
          selection={selection}
          onSelect={onSelect}
          onMovePointerDown={onMovePointerDown}
          onResizePointerDown={onResizePointerDown}
          onOpenAddonSettings={onOpenAddonSettings}
          onAddAddon={onAddAddon}
          onOpenTemplateBlockSettings={onOpenTemplateBlockSettings}
          onOpenTemplateAddonSettings={onOpenTemplateAddonSettings}
          onLayerTemplateBlock={onLayerTemplateBlock}
          onDeleteTemplateBlock={onDeleteTemplateBlock}
          onDuplicateTemplateBlock={onDuplicateTemplateBlock}
          onLayerTemplateAddon={onLayerTemplateAddon}
          onDeleteTemplateAddon={onDeleteTemplateAddon}
          onLayer={onLayer}
          onDeleteSelection={onDeleteSelection}
          onNavigatePage={onNavigatePage}
          onDuplicateSelection={onDuplicateSelection}
        />
      ))}
      {children.map((child) => (
        <BlockView
          key={child.id}
          block={child}
          breakpoint={breakpoint}
          theme={theme}
          selection={selection}
          pages={pages}
          currentPageId={currentPageId}
          companyId={companyId}
          interactive={interactive}
          publish={publish}
          canManage={canManage}
          dataItemByBlockId={dataItemByBlockId}
          datasetItemsById={datasetItemsById}
          onSelect={onSelect}
          onMovePointerDown={onMovePointerDown}
          onResizePointerDown={onResizePointerDown}
          onAddAddon={onAddAddon}
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
          onNavigatePage={onNavigatePage}
        />
      ))}
      {interactive && selected && onResizePointerDown ? (
        <SelectionChrome
          kind="block"
          grabbed={blockGrabbed}
          canManage={canManage}
          onAddAddon={onAddAddon}
          onOpenSettings={() => onOpenBlockSettings?.()}
          onDuplicate={onDuplicateSelection}
          onSaveAsPreset={onSaveAsPreset}
          saveAsPresetDisabled={saveAsPresetDisabled}
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
  currentPageId = null,
  companyId,
  interactive,
  publish,
  canManage,
  datasetItemsById = {},
  parentDataItem = null,
  hostItemsPath = null,
  selection = null,
  onSelect,
  onMovePointerDown,
  onResizePointerDown,
  onOpenAddonSettings,
  onAddAddon,
  onOpenTemplateBlockSettings,
  onOpenTemplateAddonSettings,
  onLayerTemplateBlock,
  onDeleteTemplateBlock,
  onDuplicateTemplateBlock,
  onLayerTemplateAddon,
  onDeleteTemplateAddon,
  onLayer,
  onDeleteSelection,
  onNavigatePage,
  onDuplicateSelection,
}: {
  blockId: string
  addon: WebsiteAddon
  breakpoint: WebsiteBreakpoint
  theme?: WebsiteTheme | null
  selected: boolean
  blockSelected: boolean
  pages: Pick<WebsitePage, 'id' | 'path' | 'name'>[]
  currentPageId?: string | null
  companyId?: string
  interactive: boolean
  publish: boolean
  canManage: boolean
  datasetItemsById?: Record<string, Record<string, unknown>[]>
  parentDataItem?: Record<string, unknown> | null
  hostItemsPath?: string | null
  selection?: DesignerSelection | null
  onSelect?: (selection: DesignerSelection) => void
  onMovePointerDown?: (event: ReactPointerEvent, grabbed: DesignerSelection) => void
  onResizePointerDown?: (
    event: ReactPointerEvent,
    handle: ResizeHandle,
    grabbed: DesignerSelection,
  ) => void
  onOpenAddonSettings?: () => void
  onAddAddon?: () => void
  onOpenTemplateBlockSettings?: DocumentRendererProps['onOpenTemplateBlockSettings']
  onOpenTemplateAddonSettings?: DocumentRendererProps['onOpenTemplateAddonSettings']
  onLayerTemplateBlock?: DocumentRendererProps['onLayerTemplateBlock']
  onDeleteTemplateBlock?: DocumentRendererProps['onDeleteTemplateBlock']
  onDuplicateTemplateBlock?: DocumentRendererProps['onDuplicateTemplateBlock']
  onLayerTemplateAddon?: DocumentRendererProps['onLayerTemplateAddon']
  onDeleteTemplateAddon?: DocumentRendererProps['onDeleteTemplateAddon']
  onLayer?: (direction: 'up' | 'down') => void
  onDeleteSelection?: () => void
  onNavigatePage?: (path: string) => void
  onDuplicateSelection?: () => void
}) {
  const module = getAddonModuleByType(addon.type)
  const RenderComponent = module?.RenderComponent
  const rect = resolveLayoutRect(addon.layout, breakpoint)
  const hostSelected = selection?.kind === 'addon' && selection.addonId === addon.id
  const templateChildSelected =
    (selection?.kind === 'templateBlock' || selection?.kind === 'templateAddon') &&
    selection.sliderAddonId === addon.id
  const chrome = pickElementChrome(addon)
  const addonGrabbed: DesignerSelection = { kind: 'addon', blockId, addonId: addon.id }
  // Sliders stay interactive under a selected host so nested presets remain clickable
  // after the host is deselected; while the host is selected they defer pointer events.
  const blockLocksPointers = blockSelected && addon.type !== 'slider'
  // Keep slider chrome (dots/arrows) clipped to the resized addon frame unless a nested
  // template item is selected and needs visible selection chrome.
  const clipSliderFrame = addon.type === 'slider' && !templateChildSelected
  return (
    <div
      className={cn(hostSelected && ADDON_OUTLINE, chromeClassName(chrome))}
      data-addon-node=""
      data-addon-id={addon.id}
      style={{
        ...chromeBoxStyle(rect, chrome),
        ...chromeInlineStyle(chrome),
        zIndex: selected || templateChildSelected ? 10000 + addon.zIndex : addon.zIndex + 2,
        overflow: clipSliderFrame ? 'hidden' : 'visible',
        cursor: interactive && !blockLocksPointers ? 'move' : undefined,
        touchAction: interactive && !blockLocksPointers ? 'none' : undefined,
        userSelect: interactive ? 'none' : undefined,
        pointerEvents: blockLocksPointers ? 'none' : undefined,
      }}
      onPointerDown={(event) => {
        if (!interactive || blockLocksPointers) return
        if (isChromePointerTarget(event.target)) {
          event.stopPropagation()
          return
        }
        // Host page block is selected — bubble so the block keeps the drag.
        if (selection?.kind === 'block' && selection.blockId === blockId) return
        const onTemplateChild =
          event.target instanceof Element &&
          Boolean(event.target.closest('[data-template-block-id], [data-template-addon-id]'))
        // Dive into slide content only when this slider is not already selected.
        if (onTemplateChild && !hostSelected) return
        event.preventDefault()
        event.stopPropagation()
        const grabbed: DesignerSelection = { kind: 'addon', blockId, addonId: addon.id }
        onMovePointerDown?.(event, grabbed)
        onSelect?.(grabbed)
      }}
      onClick={(event) => {
        event.stopPropagation()
        if (selection?.kind === 'block' && selection.blockId === blockId) return
        if (
          event.target instanceof Element &&
          event.target.closest('[data-template-block-id], [data-template-addon-id]') &&
          !hostSelected
        ) {
          return
        }
        onSelect?.({ kind: 'addon', blockId, addonId: addon.id })
      }}
    >
      <div
        className={cn(
          'h-full w-full',
          clipSliderFrame
            ? 'overflow-hidden'
            : addon.type === 'slider' || templateChildSelected
              ? 'overflow-visible'
              : 'overflow-hidden',
        )}
      >
        {RenderComponent ? (
          <RenderComponent
            addon={addon}
            breakpoint={breakpoint}
            theme={theme}
            pages={pages}
            currentPageId={currentPageId}
            companyId={companyId}
            interactive={interactive}
            publish={publish}
            datasetItemsById={datasetItemsById}
            parentDataItem={parentDataItem}
            hostItemsPath={hostItemsPath}
            hostBlockId={blockId}
            selection={selection}
            canManage={canManage}
            onSelect={onSelect}
            onMovePointerDown={onMovePointerDown}
            onResizePointerDown={onResizePointerDown}
            onOpenTemplateBlockSettings={(templateBlockId) =>
              onOpenTemplateBlockSettings?.(blockId, addon.id, templateBlockId)
            }
            onOpenTemplateAddonSettings={(templateBlockId, templateAddonId) =>
              onOpenTemplateAddonSettings?.(blockId, addon.id, templateBlockId, templateAddonId)
            }
            onLayerTemplateBlock={(templateBlockId, direction) =>
              onLayerTemplateBlock?.(blockId, addon.id, templateBlockId, direction)
            }
            onDeleteTemplateBlock={(templateBlockId) =>
              onDeleteTemplateBlock?.(blockId, addon.id, templateBlockId)
            }
            onDuplicateTemplateBlock={(templateBlockId) =>
              onDuplicateTemplateBlock?.(blockId, addon.id, templateBlockId)
            }
            onLayerTemplateAddon={(templateBlockId, templateAddonId, direction) =>
              onLayerTemplateAddon?.(blockId, addon.id, templateBlockId, templateAddonId, direction)
            }
            onDeleteTemplateAddon={(templateBlockId, templateAddonId) =>
              onDeleteTemplateAddon?.(blockId, addon.id, templateBlockId, templateAddonId)
            }
            onAddChild={addon.type === 'slider' ? onAddAddon : undefined}
            onNavigatePage={onNavigatePage}
          />
        ) : null}
      </div>
      {hostSelected && !templateChildSelected ? <div className={ADDON_FRAME} /> : null}
      {interactive && hostSelected && !templateChildSelected && onResizePointerDown ? (
        <SelectionChrome
          kind="addon"
          grabbed={addonGrabbed}
          canManage={canManage}
          onAddAddon={addon.type === 'slider' ? onAddAddon : undefined}
          onOpenSettings={() => onOpenAddonSettings?.()}
          onDuplicate={onDuplicateSelection}
          onLayer={(direction) => onLayer?.(direction)}
          onDelete={() => onDeleteSelection?.()}
          onResizePointerDown={onResizePointerDown}
        />
      ) : null}
    </div>
  )
}

function RowGridOverlay({
  height,
  lineClassName,
  className,
}: {
  height: number
  lineClassName: string
  className?: string
}) {
  const rowCount = Math.max(1, Math.ceil(height / ROW_HEIGHT))
  return (
    <div className={cn('pointer-events-none absolute inset-0', className)}>
      {Array.from({ length: rowCount }, (_, index) => (
        <div
          key={index}
          className={cn('absolute left-0 right-0 border-b border-dashed', lineClassName)}
          style={{ top: index * ROW_HEIGHT, height: ROW_HEIGHT }}
        />
      ))}
    </div>
  )
}

function isBlockOrDescendantSelected(block: WebsiteBlock, selection: DesignerSelection): boolean {
  if (selection.kind === 'block' && selection.blockId === block.id) return true
  if (selection.kind === 'addon' && selection.blockId === block.id) return true
  return (block.children ?? []).some((child) => isBlockOrDescendantSelected(child, selection))
}
