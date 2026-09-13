import { useEffect, type Dispatch, type SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, Box } from 'lucide-react'
import { DropdownMenuItem, DropdownMenuSeparator, cn } from '@webonone/ui-kit'
import { getAddonModuleByType } from '../../addons/registry'
import {
  addonCollapseKey,
  blockTreeLabel,
  listSlideTemplateTreeChildren,
  templateCollapseKey,
} from '../../document/contentTreeModel'
import type { DesignerSelection, WebsiteAddon, WebsiteBlock } from '../../types'
import { ADDON_ICONS, TREE_NEST, TreeNavRow, TreeRowMenu } from './treeUi'

export type TemplateTreeCallbacks = {
  onSelect: (selection: DesignerSelection) => void
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
}

type TemplateTreeContext = TemplateTreeCallbacks & {
  hostBlockId: string
  hostAddonId: string
  selection: DesignerSelection | null
  canManage: boolean
  collapsed: Record<string, boolean>
  setCollapsed: Dispatch<SetStateAction<Record<string, boolean>>>
}

/** Expandable branch under a slider slide template (shell hidden). */
export function SlideTemplateTreeBranch({
  slideTemplate,
  context,
}: {
  slideTemplate: WebsiteBlock
  context: TemplateTreeContext
}) {
  const { legacyShellAddons, blocks } = listSlideTemplateTreeChildren(slideTemplate)

  return (
    <div className={cn('mt-0.5 space-y-0.5', TREE_NEST)}>
      {legacyShellAddons.map((shellAddon) => (
        <TemplateContextAddonTreeNode
          key={shellAddon.id}
          addon={shellAddon}
          parentTemplateBlockId={slideTemplate.id}
          context={context}
        />
      ))}
      {blocks.map((child) => (
        <TemplateBlockTreeNode key={child.id} block={child} depth={0} context={context} />
      ))}
    </div>
  )
}

/** Addon row inside a slider slide template — expands nested sliders recursively. */
export function TemplateContextAddonTreeNode({
  addon,
  parentTemplateBlockId,
  context,
  collapseKeyPrefix = 'template-slider',
}: {
  addon: WebsiteAddon
  parentTemplateBlockId: string
  context: TemplateTreeContext
  collapseKeyPrefix?: string
}) {
  const { t } = useTranslation('website')
  const {
    hostBlockId,
    hostAddonId,
    selection,
    canManage,
    collapsed,
    setCollapsed,
    onSelect,
    onOpenTemplateAddonSettings,
    onLayerTemplateAddon,
    onDeleteTemplateAddon,
  } = context

  const module = getAddonModuleByType(addon.type)
  const label = module ? t(module.labelKey) : addon.type
  const AddonIcon = ADDON_ICONS[addon.type]
  const slideTemplate = addon.type === 'slider' ? addon.props.slideTemplate : null
  const hasTemplate = slideTemplate != null
  const collapseKey = `${collapseKeyPrefix}:${addon.id}`
  const open = !collapsed[collapseKey]

  const addonSelected =
    selection?.kind === 'templateAddon' &&
    selection.templateAddonId === addon.id &&
    selection.sliderAddonId === hostAddonId &&
    selection.templateBlockId === parentTemplateBlockId

  const templateSelected =
    hasTemplate &&
    (selection?.kind === 'templateBlock' || selection?.kind === 'templateAddon') &&
    selection.sliderAddonId === hostAddonId

  useEffect(() => {
    if ((!addonSelected && !templateSelected) || !hasTemplate || !slideTemplate) return
    setCollapsed((current) => ({
      ...current,
      [collapseKey]: false,
      [templateCollapseKey(slideTemplate.id)]: false,
    }))
  }, [addonSelected, collapseKey, hasTemplate, setCollapsed, slideTemplate, templateSelected])

  return (
    <div>
      <div className="flex items-center">
        {hasTemplate ? (
          <button
            type="button"
            className="flex h-7 w-4 shrink-0 items-center justify-center text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={open}
            aria-label={open ? t('collapse') : t('expand')}
            onClick={() => setCollapsed((current) => ({ ...current, [collapseKey]: !current[collapseKey] }))}
          >
            {open ? (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            )}
          </button>
        ) : (
          <span className="w-4 shrink-0" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <TreeNavRow
            treeId={`template-addon:${addon.id}`}
            icon={AddonIcon}
            label={label}
            active={addonSelected}
            onSelect={() =>
              onSelect({
                kind: 'templateAddon',
                hostBlockId,
                sliderAddonId: hostAddonId,
                templateBlockId: parentTemplateBlockId,
                templateAddonId: addon.id,
              })
            }
            menu={
              canManage ? (
                <TreeRowMenu ariaLabel={t('actionsFor', { name: label })}>
                  <DropdownMenuItem
                    onClick={() => {
                      onSelect({
                        kind: 'templateAddon',
                        hostBlockId,
                        sliderAddonId: hostAddonId,
                        templateBlockId: parentTemplateBlockId,
                        templateAddonId: addon.id,
                      })
                      onOpenTemplateAddonSettings?.(
                        hostBlockId,
                        hostAddonId,
                        parentTemplateBlockId,
                        addon.id,
                      )
                    }}
                  >
                    {t('openSettings')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      onLayerTemplateAddon?.(hostBlockId, hostAddonId, parentTemplateBlockId, addon.id, 'up')
                    }
                  >
                    {t('layerUp')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      onLayerTemplateAddon?.(hostBlockId, hostAddonId, parentTemplateBlockId, addon.id, 'down')
                    }
                  >
                    {t('layerDown')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() =>
                      onDeleteTemplateAddon?.(hostBlockId, hostAddonId, parentTemplateBlockId, addon.id)
                    }
                  >
                    {t('deleteAddon')}
                  </DropdownMenuItem>
                </TreeRowMenu>
              ) : null
            }
          />
        </div>
      </div>
      {open && hasTemplate && slideTemplate ? (
        <SlideTemplateTreeBranch slideTemplate={slideTemplate} context={context} />
      ) : null}
    </div>
  )
}

/** Nested content block inside a slider slide template. */
export function TemplateBlockTreeNode({
  block,
  depth,
  context,
}: {
  block: WebsiteBlock
  depth: number
  context: TemplateTreeContext
}) {
  const { t } = useTranslation('website')
  const {
    hostBlockId,
    hostAddonId,
    selection,
    canManage,
    collapsed,
    setCollapsed,
    onSelect,
    onOpenTemplateBlockSettings,
    onLayerTemplateBlock,
    onDeleteTemplateBlock,
    onDuplicateTemplateBlock,
  } = context

  const collapseKey = templateCollapseKey(block.id)
  const open = !collapsed[collapseKey]
  const blockSelected =
    selection?.kind === 'templateBlock' &&
    selection.templateBlockId === block.id &&
    selection.sliderAddonId === hostAddonId

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
            onClick={() => setCollapsed((current) => ({ ...current, [collapseKey]: !current[collapseKey] }))}
          >
            {open ? (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            )}
          </button>
        ) : (
          <span className="w-4 shrink-0" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <TreeNavRow
            treeId={`template-block:${block.id}`}
            icon={Box}
            label={blockTreeLabel(block, t('block'))}
            active={blockSelected}
            onSelect={() =>
              onSelect({
                kind: 'templateBlock',
                hostBlockId,
                sliderAddonId: hostAddonId,
                templateBlockId: block.id,
              })
            }
            menu={
              canManage ? (
                <TreeRowMenu ariaLabel={t('actionsFor', { name: t('block') })}>
                  <DropdownMenuItem
                    onClick={() => {
                      onSelect({
                        kind: 'templateBlock',
                        hostBlockId,
                        sliderAddonId: hostAddonId,
                        templateBlockId: block.id,
                      })
                      onOpenTemplateBlockSettings?.(hostBlockId, hostAddonId, block.id)
                    }}
                  >
                    {t('openSettings')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      onSelect({
                        kind: 'templateBlock',
                        hostBlockId,
                        sliderAddonId: hostAddonId,
                        templateBlockId: block.id,
                      })
                      onDuplicateTemplateBlock?.(hostBlockId, hostAddonId, block.id)
                    }}
                  >
                    {t('duplicate')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onLayerTemplateBlock?.(hostBlockId, hostAddonId, block.id, 'up')}
                  >
                    {t('layerUp')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onLayerTemplateBlock?.(hostBlockId, hostAddonId, block.id, 'down')}
                  >
                    {t('layerDown')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDeleteTemplateBlock?.(hostBlockId, hostAddonId, block.id)}
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
          {addons.map((addon) => (
            <TemplateContextAddonTreeNode
              key={addon.id}
              addon={addon}
              parentTemplateBlockId={block.id}
              context={context}
            />
          ))}
          {children.map((child) => (
            <TemplateBlockTreeNode key={child.id} block={child} depth={depth + 1} context={context} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

/** Page-level slider addon row — uses addon selection + shared slide template branch. */
export function PageSliderAddonTreeNode({
  addon,
  hostBlockId,
  addonIndex,
  context,
  drag,
  setDrag,
  onReorderAddon,
  onLayer,
  onDeleteAddon,
  onDuplicateAddon,
  onOpenAddonSettings,
}: {
  addon: Extract<WebsiteAddon, { type: 'slider' }>
  hostBlockId: string
  addonIndex: number
  context: TemplateTreeContext
  drag: { kind: 'addon'; blockId: string; index: number } | null
  setDrag: (drag: { kind: 'addon'; blockId: string; index: number } | null) => void
  onReorderAddon: (blockId: string, from: number, to: number) => void
  onLayer: (target: { blockId: string; addonId?: string }, direction: 'up' | 'down') => void
  onDeleteAddon: (blockId: string, addonId: string) => void
  onDuplicateAddon?: (blockId: string, addonId: string) => void
  onOpenAddonSettings: (blockId: string, addonId: string) => void
}) {
  const { t } = useTranslation('website')
  const { selection, canManage, collapsed, setCollapsed, onSelect } = context
  const slideTemplate = addon.props.slideTemplate
  const hasTemplate = slideTemplate != null
  const collapseKey = addonCollapseKey(addon.id)
  const open = !collapsed[collapseKey]
  const module = getAddonModuleByType(addon.type)
  const label = module ? t(module.labelKey) : addon.type
  const AddonIcon = ADDON_ICONS[addon.type]

  const addonSelected = selection?.kind === 'addon' && selection.addonId === addon.id
  const templateSelected =
    (selection?.kind === 'templateBlock' || selection?.kind === 'templateAddon') &&
    selection.sliderAddonId === addon.id

  useEffect(() => {
    if ((!addonSelected && !templateSelected) || !hasTemplate || !slideTemplate) return
    setCollapsed((current) => ({
      ...current,
      [collapseKey]: false,
      [templateCollapseKey(slideTemplate.id)]: false,
    }))
  }, [addonSelected, collapseKey, hasTemplate, setCollapsed, slideTemplate, templateSelected])

  return (
    <div>
      <div className="flex items-center">
        {hasTemplate ? (
          <button
            type="button"
            className="flex h-7 w-4 shrink-0 items-center justify-center text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={open}
            aria-label={open ? t('collapse') : t('expand')}
            onClick={() => setCollapsed((current) => ({ ...current, [collapseKey]: !current[collapseKey] }))}
          >
            {open ? (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            )}
          </button>
        ) : (
          <span className="w-4 shrink-0" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
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
        </div>
      </div>
      {open && hasTemplate && slideTemplate ? (
        <SlideTemplateTreeBranch slideTemplate={slideTemplate} context={context} />
      ) : null}
    </div>
  )
}
