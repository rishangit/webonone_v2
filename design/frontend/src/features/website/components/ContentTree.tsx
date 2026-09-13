import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, ChevronDown, ChevronRight, LayoutTemplate } from 'lucide-react'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  cn,
} from '@webonone/ui-kit'
import { getAddonModuleByType } from '../addons/registry'
import { blockTreeLabel, collapseKeysForTemplateSelection } from '../document/contentTreeModel'
import type { DesignerSelection, WebsiteAddon, WebsiteBlock, WebsiteDocumentV1 } from '../types'
import {
  PageSliderAddonTreeNode,
  type TemplateTreeCallbacks,
} from './contentTree/TemplateTreeNodes'
import { ADDON_ICONS, TREE_NEST, TreeNavRow, TreeRowMenu } from './contentTree/treeUi'

interface ContentTreeProps {
  document: WebsiteDocumentV1
  selection: DesignerSelection | null
  canManage?: boolean
  onSelect: (selection: DesignerSelection) => void
  onReorderAddon: (blockId: string, from: number, to: number) => void
  onReorderBlock: (parentBlockId: string | null, from: number, to: number) => void
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
}

type DragState =
  | { kind: 'block'; parentBlockId: string | null; index: number }
  | { kind: 'addon'; blockId: string; index: number }

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
  addon,
  hostBlockId,
  addonIndex,
  selection,
  canManage,
  collapsed,
  setCollapsed,
  drag,
  setDrag,
  onSelect,
  onReorderAddon,
  onLayer,
  onDeleteAddon,
  onDuplicateAddon,
  onOpenAddonSettings,
  templateCallbacks,
}: {
  addon: WebsiteAddon
  hostBlockId: string
  addonIndex: number
  selection: DesignerSelection | null
  canManage: boolean
  collapsed: Record<string, boolean>
  setCollapsed: Dispatch<SetStateAction<Record<string, boolean>>>
  drag: DragState | null
  setDrag: (drag: DragState | null) => void
  onSelect: (selection: DesignerSelection) => void
  onReorderAddon: (blockId: string, from: number, to: number) => void
  onLayer: (target: { blockId: string; addonId?: string }, direction: 'up' | 'down') => void
  onDeleteAddon: (blockId: string, addonId: string) => void
  onDuplicateAddon?: (blockId: string, addonId: string) => void
  onOpenAddonSettings: (blockId: string, addonId: string) => void
  templateCallbacks: TemplateTreeCallbacks
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
        addon={addon}
        hostBlockId={hostBlockId}
        addonIndex={addonIndex}
        context={context}
        drag={drag?.kind === 'addon' ? drag : null}
        setDrag={setDrag}
        onReorderAddon={onReorderAddon}
        onLayer={onLayer}
        onDeleteAddon={onDeleteAddon}
        onDuplicateAddon={onDuplicateAddon}
        onOpenAddonSettings={onOpenAddonSettings}
      />
    )
  }

  const module = getAddonModuleByType(addon.type)
  const label = module ? t(module.labelKey) : addon.type
  const AddonIcon = ADDON_ICONS[addon.type]
  const addonSelected = selection?.kind === 'addon' && selection.addonId === addon.id

  return (
    <TreeNavRow
      treeId={`addon:${addon.id}`}
      icon={AddonIcon}
      label={label}
      active={addonSelected}
      draggable={canManage}
      onSelect={() => onSelect({ kind: 'addon', blockId: hostBlockId, addonId: addon.id })}
      onDragStart={() => setDrag({ kind: 'addon', blockId: hostBlockId, index: addonIndex })}
      onDrop={() => {
        if (drag?.kind === 'addon' && drag.blockId === hostBlockId) {
          onReorderAddon(hostBlockId, drag.index, addonIndex)
        }
        setDrag(null)
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
  )
}

function BlockTreeNode({
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
  onSelect,
  onReorderAddon,
  onReorderBlock,
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
}: {
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
  onSelect: (selection: DesignerSelection) => void
  onReorderAddon: (blockId: string, from: number, to: number) => void
  onReorderBlock: (parentBlockId: string | null, from: number, to: number) => void
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
}) {
  const { t } = useTranslation('website')
  const open = !collapsed[block.id]
  const blockSelected = selection?.kind === 'block' && selection.blockId === block.id
  const addons = [...block.addons].sort((a, b) => a.zIndex - b.zIndex)
  const children = [...(block.children ?? [])].sort((a, b) => a.zIndex - b.zIndex)
  const hasNesting = addons.length > 0 || children.length > 0

  return (
    <div>
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
            label={blockTreeLabel(block, t('block'))}
            active={blockSelected}
            draggable={canManage}
            onSelect={() => onSelect({ kind: 'block', blockId: block.id })}
            onDragStart={() => setDrag({ kind: 'block', parentBlockId, index: blockIndex })}
            onDrop={() => {
              if (drag?.kind === 'block' && drag.parentBlockId === parentBlockId) {
                onReorderBlock(parentBlockId, drag.index, blockIndex)
              }
              setDrag(null)
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
      {open && hasNesting ? (
        <div className={cn('mt-0.5 space-y-0.5', TREE_NEST)}>
          {addons.map((addon, addonIndex) => (
            <AddonTreeNode
              key={addon.id}
              addon={addon}
              hostBlockId={block.id}
              addonIndex={addonIndex}
              selection={selection}
              canManage={canManage}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              drag={drag}
              setDrag={setDrag}
              onSelect={onSelect}
              onReorderAddon={onReorderAddon}
              onLayer={onLayer}
              onDeleteAddon={onDeleteAddon}
              onDuplicateAddon={onDuplicateAddon}
              onOpenAddonSettings={onOpenAddonSettings}
              templateCallbacks={templateCallbacks}
            />
          ))}
          {children.map((child, childIndex) => (
            <BlockTreeNode
              key={child.id}
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
              onSelect={onSelect}
              onReorderAddon={onReorderAddon}
              onReorderBlock={onReorderBlock}
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
  onReorderAddon,
  onReorderBlock,
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
}: ContentTreeProps) {
  const { t } = useTranslation('website')
  const rootRef = useRef<HTMLElement>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [drag, setDrag] = useState<DragState | null>(null)
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
    <nav ref={rootRef} className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2 scrollbar-themed" aria-label={t('contentTree')}>
      <h2 className="sr-only">{t('contentTree')}</h2>
      <TreeNavRow
        treeId="container"
        icon={LayoutTemplate}
        label={t('container')}
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
          onSelect={onSelect}
          onReorderAddon={onReorderAddon}
          onReorderBlock={onReorderBlock}
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
        />
      ))}
    </nav>
  )
}
