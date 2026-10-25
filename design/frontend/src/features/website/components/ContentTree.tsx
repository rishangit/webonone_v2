import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, ChevronDown, ChevronRight, LayoutTemplate } from 'lucide-react'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  cn,
} from '@webonone/ui-kit'
import { getAddonModuleByType } from '../addons/registry'
import { TreeHoverProvider } from '../document/canvasHighlight'
import { findBlockPath } from '../document/blockTree'
import { collapseKeysForTemplateSelection, elementTreeTitle } from '../document/contentTreeModel'
import {
  addonDropMove,
  blockDropMove,
  hintForAddonRow,
  hintForBlockRow,
  type TreeDrag,
  type TreeDropHint,
  type TreeDropPlacement,
  type TreeMove,
} from '../document/treeDrop'
import type { DesignerSelection, WebsiteAddon, WebsiteBlock, WebsiteDocumentV1 } from '../types'
import {
  PageSliderAddonTreeNode,
  type TemplateTreeCallbacks,
} from './contentTree/TemplateTreeNodes'
import { CopyCanvasElementToAiMenuItem } from './CopyCanvasElementToAiMenuItem'
import { ADDON_ICONS, TREE_NEST, TreeDropFrame, TreeNavRow, TreeRowMenu } from './contentTree/treeUi'

interface ContentTreeProps {
  document: WebsiteDocumentV1
  selection: DesignerSelection | null
  canManage?: boolean
  onSelect: (selection: DesignerSelection) => void
  onMoveAddon: (fromBlockId: string, addonId: string, toBlockId: string, toIndex: number) => void
  onMoveBlock: (blockId: string, toParentId: string | null, toIndex: number) => void
  onLayer: (target: { blockId: string; addonId?: string }, direction: 'up' | 'down') => void
  onDeleteBlock: (blockId: string) => void
  onDeleteAddon: (blockId: string, addonId: string) => void
  onDuplicateBlock?: (blockId: string) => void
  onDuplicateAddon?: (blockId: string, addonId: string) => void
  onOpenContainerSettings: () => void
  onOpenBlockSettings: (blockId: string) => void
  onOpenAddonSettings: (blockId: string, addonId: string) => void
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
  onSaveAsPreset?: (blockId: string) => void
  saveAsPresetDisabled?: boolean
  onCopyToAi?: (selection: DesignerSelection) => void
  onHover?: (selection: DesignerSelection | null) => void
}

type DragState = TreeDrag

function blockIsInsideDrag(document: WebsiteDocumentV1, dragBlockId: string, blockId: string | null) {
  if (!blockId) return false
  return findBlockPath(document, blockId).some((block) => block.id === dragBlockId)
}

function applyTreeMove(
  move: TreeMove | null,
  onMoveAddon: ContentTreeProps['onMoveAddon'],
  onMoveBlock: ContentTreeProps['onMoveBlock'],
  setCollapsed: Dispatch<SetStateAction<Record<string, boolean>>>,
  setDrag: (drag: DragState | null) => void,
  setDropHint: (hint: TreeDropHint | null) => void,
) {
  if (move?.kind === 'addon') {
    onMoveAddon(move.fromBlockId, move.addonId, move.toBlockId, move.toIndex)
    setCollapsed((current) => ({ ...current, [move.toBlockId]: false }))
  } else if (move?.kind === 'block') {
    onMoveBlock(move.blockId, move.toParentId, move.toIndex)
    if (move.toParentId) {
      const parentId = move.toParentId
      setCollapsed((current) => ({ ...current, [parentId]: false }))
    }
  }
  setDrag(null)
  setDropHint(null)
}

function treeItemId(selection: DesignerSelection) {
  if (selection.kind === 'container') return 'container'
  if (selection.kind === 'block') return `block:${selection.blockId}`
  if (selection.kind === 'templateBlock') return `template-block:${selection.templateBlockId}`
  if (selection.kind === 'templateAddon') return `template-addon:${selection.templateAddonId}`
  return `addon:${selection.addonId}`
}

function buildTemplateContext(
  hostBlockId: string,
  hostAddonId: string,
  selection: DesignerSelection | null,
  canManage: boolean,
  collapsed: Record<string, boolean>,
  setCollapsed: Dispatch<SetStateAction<Record<string, boolean>>>,
  callbacks: TemplateTreeCallbacks,
) {
  return {
    hostBlockId,
    hostAddonId,
    selection,
    canManage,
    collapsed,
    setCollapsed,
    ...callbacks,
  }
}

function AddonTreeNode({
  document,
  addon,
  hostBlockId,
  addonIndex,
  selection,
  canManage,
  collapsed,
  setCollapsed,
  drag,
  setDrag,
  dropHint,
  setDropHint,
  onSelect,
  onMoveAddon,
  onMoveBlock,
  onLayer,
  onDeleteAddon,
  onDuplicateAddon,
  onOpenAddonSettings,
  templateCallbacks,
  onCopyToAi,
}: {
  document: WebsiteDocumentV1
  addon: WebsiteAddon
  hostBlockId: string
  addonIndex: number
  selection: DesignerSelection | null
  canManage: boolean
  collapsed: Record<string, boolean>
  setCollapsed: Dispatch<SetStateAction<Record<string, boolean>>>
  drag: DragState | null
  setDrag: (drag: DragState | null) => void
  dropHint: TreeDropHint | null
  setDropHint: (hint: TreeDropHint | null) => void
  onSelect: (selection: DesignerSelection) => void
  onMoveAddon: (fromBlockId: string, addonId: string, toBlockId: string, toIndex: number) => void
  onMoveBlock: (blockId: string, toParentId: string | null, toIndex: number) => void
  onLayer: (target: { blockId: string; addonId?: string }, direction: 'up' | 'down') => void
  onDeleteAddon: (blockId: string, addonId: string) => void
  onDuplicateAddon?: (blockId: string, addonId: string) => void
  onOpenAddonSettings: (blockId: string, addonId: string) => void
  templateCallbacks: TemplateTreeCallbacks
  onCopyToAi?: (selection: DesignerSelection) => void
}) {
  const { t } = useTranslation('website')

  if (addon.type === 'slider') {
    const context = buildTemplateContext(
      hostBlockId,
      addon.id,
      selection,
      canManage,
      collapsed,
      setCollapsed,
      templateCallbacks,
    )
    return (
      <PageSliderAddonTreeNode
        document={document}
        addon={addon}
        hostBlockId={hostBlockId}
        addonIndex={addonIndex}
        context={context}
        drag={drag}
        setDrag={setDrag}
        dropHint={dropHint}
        setDropHint={setDropHint}
        onMoveAddon={onMoveAddon}
        onMoveBlock={onMoveBlock}
        onLayer={onLayer}
        onDeleteAddon={onDeleteAddon}
        onDuplicateAddon={onDuplicateAddon}
        onOpenAddonSettings={onOpenAddonSettings}
      />
    )
  }

  const module = getAddonModuleByType(addon.type)
  const typeLabel = module ? t(module.labelKey) : addon.type
  const label = elementTreeTitle(addon.name, typeLabel)
  const AddonIcon = ADDON_ICONS[addon.type]
  const addonSelected = selection?.kind === 'addon' && selection.addonId === addon.id
  const rowPlacement = dropHint?.treeId === `addon:${addon.id}` ? dropHint.placement : null

  function hoverAddon(zone: TreeDropPlacement) {
    if (!drag) return
    setDropHint(
      hintForAddonRow({
        drag,
        zone,
        addonId: addon.id,
        addonIndex,
        hostBlockId,
        hostIsInsideDrag: drag.kind === 'block' && blockIsInsideDrag(document, drag.blockId, hostBlockId),
      }),
    )
  }

  function dropAddon(zone: TreeDropPlacement) {
    const move = drag
      ? addonDropMove({
          drag,
          zone,
          addonId: addon.id,
          addonIndex,
          hostBlockId,
          hostIsInsideDrag: drag.kind === 'block' && blockIsInsideDrag(document, drag.blockId, hostBlockId),
        })
      : null
    applyTreeMove(move, onMoveAddon, onMoveBlock, setCollapsed, setDrag, setDropHint)
  }

  return (
    <TreeDropFrame
      placement={rowPlacement === 'inside' ? null : rowPlacement}
      onDragHover={canManage && drag ? hoverAddon : undefined}
      onDrop={canManage && drag ? dropAddon : undefined}
    >
    <TreeNavRow
      treeId={`addon:${addon.id}`}
      icon={AddonIcon}
      label={label}
      subtitle={typeLabel}
      hoverTarget={{ kind: 'addon', blockId: hostBlockId, addonId: addon.id }}
      active={addonSelected}
      draggable={canManage}
      onSelect={() => onSelect({ kind: 'addon', blockId: hostBlockId, addonId: addon.id })}
      onDragStart={() => setDrag({ kind: 'addon', blockId: hostBlockId, addonId: addon.id, index: addonIndex })}
      onDragEnd={() => {
        setDrag(null)
        setDropHint(null)
      }}
      menu={
        canManage ? (
          <TreeRowMenu ariaLabel={t('actionsFor', { name: label })}>
            <DropdownMenuItem
              onClick={() => {
                onSelect({ kind: 'addon', blockId: hostBlockId, addonId: addon.id })
                onOpenAddonSettings(hostBlockId, addon.id)
              }}
            >
              {t('openSettings')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                onSelect({ kind: 'addon', blockId: hostBlockId, addonId: addon.id })
                onDuplicateAddon?.(hostBlockId, addon.id)
              }}
            >
              {t('duplicate')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onLayer({ blockId: hostBlockId, addonId: addon.id }, 'up')}>
              {t('layerUp')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onLayer({ blockId: hostBlockId, addonId: addon.id }, 'down')}>
              {t('layerDown')}
            </DropdownMenuItem>
            {onCopyToAi ? (
              <CopyCanvasElementToAiMenuItem
                onCopy={() => onCopyToAi({ kind: 'addon', blockId: hostBlockId, addonId: addon.id })}
              />
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDeleteAddon(hostBlockId, addon.id)}
            >
              {t('deleteAddon')}
            </DropdownMenuItem>
          </TreeRowMenu>
        ) : null
      }
    />
    </TreeDropFrame>
  )
}

function BlockTreeNode({
  document,
  block,
  parentBlockId,
  blockIndex,
  depth,
  selection,
  canManage,
  collapsed,
  setCollapsed,
  drag,
  setDrag,
  dropHint,
  setDropHint,
  onSelect,
  onMoveAddon,
  onMoveBlock,
  onLayer,
  onDeleteBlock,
  onDeleteAddon,
  onDuplicateBlock,
  onDuplicateAddon,
  onOpenBlockSettings,
  onOpenAddonSettings,
  templateCallbacks,
  onSaveAsPreset,
  saveAsPresetDisabled,
  onCopyToAi,
}: {
  document: WebsiteDocumentV1
  block: WebsiteBlock
  parentBlockId: string | null
  blockIndex: number
  depth: number
  selection: DesignerSelection | null
  canManage: boolean
  collapsed: Record<string, boolean>
  setCollapsed: Dispatch<SetStateAction<Record<string, boolean>>>
  drag: DragState | null
  setDrag: (drag: DragState | null) => void
  dropHint: TreeDropHint | null
  setDropHint: (hint: TreeDropHint | null) => void
  onSelect: (selection: DesignerSelection) => void
  onMoveAddon: (fromBlockId: string, addonId: string, toBlockId: string, toIndex: number) => void
  onMoveBlock: (blockId: string, toParentId: string | null, toIndex: number) => void
  onLayer: (target: { blockId: string; addonId?: string }, direction: 'up' | 'down') => void
  onDeleteBlock: (blockId: string) => void
  onDeleteAddon: (blockId: string, addonId: string) => void
  onDuplicateBlock?: (blockId: string) => void
  onDuplicateAddon?: (blockId: string, addonId: string) => void
  onOpenBlockSettings: (blockId: string) => void
  onOpenAddonSettings: (blockId: string, addonId: string) => void
  templateCallbacks: TemplateTreeCallbacks
  onSaveAsPreset?: (blockId: string) => void
  saveAsPresetDisabled?: boolean
  onCopyToAi?: (selection: DesignerSelection) => void
}) {
  const { t } = useTranslation('website')
  const open = !collapsed[block.id]
  const blockSelected = selection?.kind === 'block' && selection.blockId === block.id
  const addons = [...block.addons].sort((a, b) => a.zIndex - b.zIndex)
  const children = [...(block.children ?? [])].sort((a, b) => a.zIndex - b.zIndex)
  const hasNesting = addons.length > 0 || children.length > 0
  const rowPlacement = dropHint?.treeId === `block:${block.id}` ? dropHint.placement : null

  function dragFlags() {
    if (drag?.kind !== 'block') return { parentIsInsideDrag: false, blockIsInsideDrag: false }
    return {
      parentIsInsideDrag: blockIsInsideDrag(document, drag.blockId, parentBlockId),
      blockIsInsideDrag: blockIsInsideDrag(document, drag.blockId, block.id),
    }
  }

  function hoverBlock(zone: TreeDropPlacement) {
    if (!drag) return
    setDropHint(
      hintForBlockRow({
        drag,
        zone,
        blockId: block.id,
        parentBlockId,
        blockIndex,
        ...dragFlags(),
      }),
    )
  }

  function dropBlock(zone: TreeDropPlacement) {
    const move = drag
      ? blockDropMove({
          drag,
          zone,
          blockId: block.id,
          parentBlockId,
          blockIndex,
          childCount: children.length,
          addonCount: addons.length,
          ...dragFlags(),
        })
      : null
    applyTreeMove(move, onMoveAddon, onMoveBlock, setCollapsed, setDrag, setDropHint)
  }

  return (
    <div>
      <TreeDropFrame
        placement={rowPlacement}
        nestable
        onDragHover={canManage && drag ? hoverBlock : undefined}
        onDrop={canManage && drag ? dropBlock : undefined}
      >
      <div className="flex items-center">
        {hasNesting ? (
          <button
            type="button"
            className="flex h-7 w-4 shrink-0 items-center justify-center text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={open}
            aria-label={open ? t('collapse') : t('expand')}
            onClick={() => setCollapsed((current) => ({ ...current, [block.id]: !current[block.id] }))}
          >
            {open ? <ChevronDown className="h-3.5 w-3.5" aria-hidden /> : <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
          </button>
        ) : (
          <span className="w-4 shrink-0" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <TreeNavRow
            treeId={`block:${block.id}`}
            icon={Box}
            label={elementTreeTitle(block.name, block.groupName?.trim() || t('block'))}
            subtitle={t('block')}
            hoverTarget={{ kind: 'block', blockId: block.id }}
            active={blockSelected}
            draggable={canManage}
            onSelect={() => onSelect({ kind: 'block', blockId: block.id })}
            onDragStart={() => setDrag({ kind: 'block', blockId: block.id, parentBlockId, index: blockIndex })}
            onDragEnd={() => {
              setDrag(null)
              setDropHint(null)
            }}
            menu={
              canManage ? (
                <TreeRowMenu ariaLabel={t('actionsFor', { name: t('block') })}>
                  <DropdownMenuItem
                    onClick={() => {
                      onSelect({ kind: 'block', blockId: block.id })
                      onOpenBlockSettings(block.id)
                    }}
                  >
                    {t('openSettings')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      onSelect({ kind: 'block', blockId: block.id })
                      onDuplicateBlock?.(block.id)
                    }}
                  >
                    {t('duplicate')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={saveAsPresetDisabled || !onSaveAsPreset}
                    title={saveAsPresetDisabled ? t('saveAsPresetDisabled') : undefined}
                    onClick={() => onSaveAsPreset?.(block.id)}
                  >
                    {t('saveAsPreset')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onLayer({ blockId: block.id }, 'up')}>
                    {t('layerUp')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onLayer({ blockId: block.id }, 'down')}>
                    {t('layerDown')}
                  </DropdownMenuItem>
                  {onCopyToAi ? (
                    <CopyCanvasElementToAiMenuItem
                      onCopy={() => onCopyToAi({ kind: 'block', blockId: block.id })}
                    />
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDeleteBlock(block.id)}
                  >
                    {t('deleteBlock')}
                  </DropdownMenuItem>
                </TreeRowMenu>
              ) : null
            }
          />
        </div>
      </div>
      </TreeDropFrame>
      {open && hasNesting ? (
        <div className={cn('mt-0.5 space-y-0.5', TREE_NEST)}>
          {addons.map((addon, addonIndex) => (
            <AddonTreeNode
              key={addon.id}
              document={document}
              addon={addon}
              hostBlockId={block.id}
              addonIndex={addonIndex}
              selection={selection}
              canManage={canManage}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              drag={drag}
              setDrag={setDrag}
              dropHint={dropHint}
              setDropHint={setDropHint}
              onSelect={onSelect}
              onMoveAddon={onMoveAddon}
              onMoveBlock={onMoveBlock}
              onLayer={onLayer}
              onDeleteAddon={onDeleteAddon}
              onDuplicateAddon={onDuplicateAddon}
              onOpenAddonSettings={onOpenAddonSettings}
              templateCallbacks={templateCallbacks}
              onCopyToAi={onCopyToAi}
            />
          ))}
          {children.map((child, childIndex) => (
            <BlockTreeNode
              key={child.id}
              document={document}
              block={child}
              parentBlockId={block.id}
              blockIndex={childIndex}
              depth={depth + 1}
              selection={selection}
              canManage={canManage}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              drag={drag}
              setDrag={setDrag}
              dropHint={dropHint}
              setDropHint={setDropHint}
              onSelect={onSelect}
              onMoveAddon={onMoveAddon}
              onMoveBlock={onMoveBlock}
              onLayer={onLayer}
              onDeleteBlock={onDeleteBlock}
              onDeleteAddon={onDeleteAddon}
              onDuplicateBlock={onDuplicateBlock}
              onDuplicateAddon={onDuplicateAddon}
              onOpenBlockSettings={onOpenBlockSettings}
              onOpenAddonSettings={onOpenAddonSettings}
              templateCallbacks={templateCallbacks}
              onSaveAsPreset={onSaveAsPreset}
              saveAsPresetDisabled={saveAsPresetDisabled}
              onCopyToAi={onCopyToAi}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function ContentTree({
  document,
  selection,
  canManage = true,
  onSelect,
  onMoveAddon,
  onMoveBlock,
  onLayer,
  onDeleteBlock,
  onDeleteAddon,
  onDuplicateBlock,
  onDuplicateAddon,
  onOpenContainerSettings,
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
  onCopyToAi,
  onHover,
}: ContentTreeProps) {
  const { t } = useTranslation('website')
  const rootRef = useRef<HTMLElement>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [drag, setDrag] = useState<DragState | null>(null)
  const [dropHint, setDropHintState] = useState<TreeDropHint | null>(null)
  const setDropHint = useCallback((hint: TreeDropHint | null) => {
    setDropHintState((current) => {
      if (current?.treeId === hint?.treeId && current?.placement === hint?.placement) return current
      return hint
    })
  }, [])
  const blocks = [...document.blocks].sort((a, b) => a.zIndex - b.zIndex)

  const templateCallbacks: TemplateTreeCallbacks = {
    onSelect,
    onOpenTemplateBlockSettings,
    onOpenTemplateAddonSettings,
    onLayerTemplateBlock,
    onDeleteTemplateBlock,
    onDuplicateTemplateBlock,
    onLayerTemplateAddon,
    onDeleteTemplateAddon,
    onCopyToAi,
  }

  useEffect(() => {
    if (!selection) return
    if (selection.kind === 'addon' || selection.kind === 'block') {
      setCollapsed((current) => ({ ...current, [selection.blockId]: false }))
      return
    }
    if (selection.kind === 'templateBlock' || selection.kind === 'templateAddon') {
      const keys = collapseKeysForTemplateSelection(document, selection)
      setCollapsed((current) => {
        const next = { ...current, [selection.hostBlockId]: false }
        for (const key of keys) {
          next[key] = false
        }
        return next
      })
    }
  }, [document, selection])

  useEffect(() => {
    if (!selection) return
    const node = rootRef.current?.querySelector(`[data-tree-id="${treeItemId(selection)}"]`)
    node?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [selection])

  return (
    <TreeHoverProvider onHover={onHover}>
    <nav
      ref={rootRef}
      className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2 scrollbar-themed"
      aria-label={t('contentTree')}
      onDragLeave={(event) => {
        const next = event.relatedTarget
        if (next instanceof Node && event.currentTarget.contains(next)) return
        setDropHint(null)
      }}
    >
      <h2 className="sr-only">{t('contentTree')}</h2>
      <TreeNavRow
        treeId="container"
        icon={LayoutTemplate}
        label={t('container')}
        hoverTarget={{ kind: 'container' }}
        active={selection?.kind === 'container'}
        onSelect={() => onSelect({ kind: 'container' })}
        menu={
          canManage ? (
            <TreeRowMenu ariaLabel={t('actionsFor', { name: t('container') })}>
              <DropdownMenuItem
                onClick={() => {
                  onSelect({ kind: 'container' })
                  onOpenContainerSettings()
                }}
              >
                {t('openSettings')}
              </DropdownMenuItem>
            </TreeRowMenu>
          ) : null
        }
      />
      {blocks.map((block, blockIndex) => (
        <BlockTreeNode
          key={block.id}
          document={document}
          block={block}
          parentBlockId={null}
          blockIndex={blockIndex}
          depth={0}
          selection={selection}
          canManage={canManage}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          drag={drag}
          setDrag={setDrag}
          dropHint={dropHint}
          setDropHint={setDropHint}
          onSelect={onSelect}
          onMoveAddon={onMoveAddon}
          onMoveBlock={onMoveBlock}
          onLayer={onLayer}
          onDeleteBlock={onDeleteBlock}
          onDeleteAddon={onDeleteAddon}
          onDuplicateBlock={onDuplicateBlock}
          onDuplicateAddon={onDuplicateAddon}
          onOpenBlockSettings={onOpenBlockSettings}
          onOpenAddonSettings={onOpenAddonSettings}
          templateCallbacks={templateCallbacks}
          onSaveAsPreset={onSaveAsPreset}
          saveAsPresetDisabled={saveAsPresetDisabled}
          onCopyToAi={onCopyToAi}
        />
      ))}
    </nav>
    </TreeHoverProvider>
  )
}
