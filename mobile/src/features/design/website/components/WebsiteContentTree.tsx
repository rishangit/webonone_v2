import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { Pressable, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  ItemListMenuItem,
  ItemListMenuSeparator,
  Muted,
  useThemedControlIconColor,
} from '@webonone/mobile-ui'
import {
  addonCollapseKey,
  blockTreeLabel,
  collapseKeysForTemplateSelection,
  listSlideTemplateTreeChildren,
  templateCollapseKey,
  templateSliderCollapseKey,
} from '@/features/design/website/document/contentTreeModel'
import type { DesignerSelection, WebsiteAddon, WebsiteBlock, WebsiteDocumentV1 } from '@/features/design/website/types'
import {
  ADDON_ICONS,
  Box,
  ChevronDown,
  ChevronRight,
  LayoutTemplate,
  TREE_NEST_PX,
  TreeNavRow,
  TreeRowMenu,
} from '@/features/design/website/components/contentTree/treeUi'

export function WebsiteContentTree({
  document,
  selection,
  canManage = true,
  onSelect,
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
}: {
  document: WebsiteDocumentV1
  selection: DesignerSelection
  canManage?: boolean
  onSelect: (selection: DesignerSelection) => void
  onLayer: (target: { blockId: string; addonId?: string }, direction: 'up' | 'down') => void
  onDeleteBlock: (blockId: string) => void
  onDeleteAddon: (blockId: string, addonId: string) => void
  onDuplicateBlock?: (blockId: string) => void
  onDuplicateAddon?: (blockId: string, addonId: string) => void
  onOpenContainerSettings: () => void
  onOpenBlockSettings: (blockId: string) => void
  onOpenAddonSettings: (blockId: string, addonId: string) => void
  onOpenTemplateBlockSettings?: (hostBlockId: string, sliderAddonId: string, templateBlockId: string) => void
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
  onDeleteTemplateBlock?: (hostBlockId: string, sliderAddonId: string, templateBlockId: string) => void
  onDuplicateTemplateBlock?: (hostBlockId: string, sliderAddonId: string, templateBlockId: string) => void
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
}) {
  const { t } = useTranslation('website')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const blocks = [...document.blocks].sort((a, b) => a.zIndex - b.zIndex)

  useEffect(() => {
    if (selection.kind === 'addon' || selection.kind === 'block') {
      setCollapsed((current) => ({ ...current, [selection.blockId]: false }))
      return
    }
    if (selection.kind === 'templateBlock' || selection.kind === 'templateAddon') {
      const keys = collapseKeysForTemplateSelection(document, selection)
      setCollapsed((current) => {
        const next = { ...current, [selection.hostBlockId]: false }
        for (const key of keys) next[key] = false
        return next
      })
    }
  }, [document, selection])

  return (
    <View className="gap-1">
      <TreeNavRow
        icon={LayoutTemplate}
        label={t('container')}
        active={selection.kind === 'container'}
        onSelect={() => onSelect({ kind: 'container' })}
        menu={
          canManage ? (
            <TreeRowMenu ariaLabel={t('actionsFor', { name: t('container') })}>
              <ItemListMenuItem
                onPress={() => {
                  onSelect({ kind: 'container' })
                  onOpenContainerSettings()
                }}
              >
                {t('openSettings')}
              </ItemListMenuItem>
            </TreeRowMenu>
          ) : null
        }
      />
      {blocks.length === 0 ? <Muted>{t('noBlocks', { kind: t('kindPage') })}</Muted> : null}
      {blocks.map((block) => (
        <BlockTreeNode
          key={block.id}
          block={block}
          hostBlockId={block.id}
          selection={selection}
          canManage={canManage}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onSelect={onSelect}
          onLayer={onLayer}
          onDeleteBlock={onDeleteBlock}
          onDeleteAddon={onDeleteAddon}
          onDuplicateBlock={onDuplicateBlock}
          onDuplicateAddon={onDuplicateAddon}
          onOpenBlockSettings={onOpenBlockSettings}
          onOpenAddonSettings={onOpenAddonSettings}
          onOpenTemplateBlockSettings={onOpenTemplateBlockSettings}
          onOpenTemplateAddonSettings={onOpenTemplateAddonSettings}
          onLayerTemplateBlock={onLayerTemplateBlock}
          onDeleteTemplateBlock={onDeleteTemplateBlock}
          onDuplicateTemplateBlock={onDuplicateTemplateBlock}
          onLayerTemplateAddon={onLayerTemplateAddon}
          onDeleteTemplateAddon={onDeleteTemplateAddon}
          onSaveAsPreset={onSaveAsPreset}
          saveAsPresetDisabled={saveAsPresetDisabled}
        />
      ))}
    </View>
  )
}

function CollapseToggle({
  open,
  onToggle,
}: {
  open: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation('website')
  const iconColor = useThemedControlIconColor()
  const Icon = open ? ChevronDown : ChevronRight
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={open ? t('collapse') : t('expand')}
      onPress={onToggle}
      className="h-7 w-4 items-center justify-center"
    >
      <Icon size={14} color={iconColor} strokeWidth={2} />
    </Pressable>
  )
}

function BlockTreeNode({
  block,
  hostBlockId,
  selection,
  canManage,
  collapsed,
  setCollapsed,
  onSelect,
  onLayer,
  onDeleteBlock,
  onDeleteAddon,
  onDuplicateBlock,
  onDuplicateAddon,
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
  saveAsPresetDisabled,
}: {
  block: WebsiteBlock
  hostBlockId: string
  selection: DesignerSelection
  canManage: boolean
  collapsed: Record<string, boolean>
  setCollapsed: Dispatch<SetStateAction<Record<string, boolean>>>
  onSelect: (selection: DesignerSelection) => void
  onLayer: (target: { blockId: string; addonId?: string }, direction: 'up' | 'down') => void
  onDeleteBlock: (blockId: string) => void
  onDeleteAddon: (blockId: string, addonId: string) => void
  onDuplicateBlock?: (blockId: string) => void
  onDuplicateAddon?: (blockId: string, addonId: string) => void
  onOpenBlockSettings: (blockId: string) => void
  onOpenAddonSettings: (blockId: string, addonId: string) => void
  onOpenTemplateBlockSettings?: (hostBlockId: string, sliderAddonId: string, templateBlockId: string) => void
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
  onDeleteTemplateBlock?: (hostBlockId: string, sliderAddonId: string, templateBlockId: string) => void
  onDuplicateTemplateBlock?: (hostBlockId: string, sliderAddonId: string, templateBlockId: string) => void
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
}) {
  const { t } = useTranslation('website')
  const open = !collapsed[block.id]
  const selected = selection.kind === 'block' && selection.blockId === block.id
  const addons = [...block.addons].sort((a, b) => a.zIndex - b.zIndex)
  const children = [...(block.children ?? [])].sort((a, b) => a.zIndex - b.zIndex)
  const hasNesting = addons.length > 0 || children.length > 0

  return (
    <View>
      <View className="flex-row items-center">
        {hasNesting ? (
          <CollapseToggle
            open={open}
            onToggle={() => setCollapsed((current) => ({ ...current, [block.id]: !current[block.id] }))}
          />
        ) : (
          <View className="w-4" />
        )}
        <TreeNavRow
          icon={Box}
          label={blockTreeLabel(block, t('block'))}
          active={selected}
          onSelect={() => onSelect({ kind: 'block', blockId: block.id })}
          menu={
            canManage ? (
              <TreeRowMenu ariaLabel={t('actionsFor', { name: t('block') })}>
                <ItemListMenuItem
                  onPress={() => {
                    onSelect({ kind: 'block', blockId: block.id })
                    onOpenBlockSettings(block.id)
                  }}
                >
                  {t('openSettings')}
                </ItemListMenuItem>
                <ItemListMenuItem
                  onPress={() => {
                    onSelect({ kind: 'block', blockId: block.id })
                    onDuplicateBlock?.(block.id)
                  }}
                >
                  {t('duplicate')}
                </ItemListMenuItem>
                <ItemListMenuItem
                  disabled={saveAsPresetDisabled || !onSaveAsPreset}
                  onPress={() => onSaveAsPreset?.(block.id)}
                >
                  {t('saveAsPreset')}
                </ItemListMenuItem>
                <ItemListMenuItem onPress={() => onLayer({ blockId: block.id }, 'up')}>
                  {t('layerUp')}
                </ItemListMenuItem>
                <ItemListMenuItem onPress={() => onLayer({ blockId: block.id }, 'down')}>
                  {t('layerDown')}
                </ItemListMenuItem>
                <ItemListMenuSeparator />
                <ItemListMenuItem destructive onPress={() => onDeleteBlock(block.id)}>
                  {t('deleteBlock')}
                </ItemListMenuItem>
              </TreeRowMenu>
            ) : null
          }
        />
      </View>
      {open && hasNesting ? (
        <View style={{ paddingLeft: TREE_NEST_PX }} className="gap-0.5">
          {addons.map((addon) => (
            <AddonTreeNode
              key={addon.id}
              addon={addon}
              hostBlockId={hostBlockId}
              selection={selection}
              canManage={canManage}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              onSelect={onSelect}
              onLayer={onLayer}
              onDeleteAddon={onDeleteAddon}
              onDuplicateAddon={onDuplicateAddon}
              onOpenAddonSettings={onOpenAddonSettings}
              onOpenTemplateBlockSettings={onOpenTemplateBlockSettings}
              onOpenTemplateAddonSettings={onOpenTemplateAddonSettings}
              onLayerTemplateBlock={onLayerTemplateBlock}
              onDeleteTemplateBlock={onDeleteTemplateBlock}
              onDuplicateTemplateBlock={onDuplicateTemplateBlock}
              onLayerTemplateAddon={onLayerTemplateAddon}
              onDeleteTemplateAddon={onDeleteTemplateAddon}
            />
          ))}
          {children.map((child) => (
            <BlockTreeNode
              key={child.id}
              block={child}
              hostBlockId={hostBlockId}
              selection={selection}
              canManage={canManage}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              onSelect={onSelect}
              onLayer={onLayer}
              onDeleteBlock={onDeleteBlock}
              onDeleteAddon={onDeleteAddon}
              onDuplicateBlock={onDuplicateBlock}
              onDuplicateAddon={onDuplicateAddon}
              onOpenBlockSettings={onOpenBlockSettings}
              onOpenAddonSettings={onOpenAddonSettings}
              onOpenTemplateBlockSettings={onOpenTemplateBlockSettings}
              onOpenTemplateAddonSettings={onOpenTemplateAddonSettings}
              onLayerTemplateBlock={onLayerTemplateBlock}
              onDeleteTemplateBlock={onDeleteTemplateBlock}
              onDuplicateTemplateBlock={onDuplicateTemplateBlock}
              onLayerTemplateAddon={onLayerTemplateAddon}
              onDeleteTemplateAddon={onDeleteTemplateAddon}
              onSaveAsPreset={onSaveAsPreset}
              saveAsPresetDisabled={saveAsPresetDisabled}
            />
          ))}
        </View>
      ) : null}
    </View>
  )
}

function AddonTreeNode({
  addon,
  hostBlockId,
  selection,
  canManage,
  collapsed,
  setCollapsed,
  onSelect,
  onLayer,
  onDeleteAddon,
  onDuplicateAddon,
  onOpenAddonSettings,
  onOpenTemplateBlockSettings,
  onOpenTemplateAddonSettings,
  onLayerTemplateBlock,
  onDeleteTemplateBlock,
  onDuplicateTemplateBlock,
  onLayerTemplateAddon,
  onDeleteTemplateAddon,
}: {
  addon: WebsiteAddon
  hostBlockId: string
  selection: DesignerSelection
  canManage: boolean
  collapsed: Record<string, boolean>
  setCollapsed: Dispatch<SetStateAction<Record<string, boolean>>>
  onSelect: (selection: DesignerSelection) => void
  onLayer: (target: { blockId: string; addonId?: string }, direction: 'up' | 'down') => void
  onDeleteAddon: (blockId: string, addonId: string) => void
  onDuplicateAddon?: (blockId: string, addonId: string) => void
  onOpenAddonSettings: (blockId: string, addonId: string) => void
  onOpenTemplateBlockSettings?: (hostBlockId: string, sliderAddonId: string, templateBlockId: string) => void
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
  onDeleteTemplateBlock?: (hostBlockId: string, sliderAddonId: string, templateBlockId: string) => void
  onDuplicateTemplateBlock?: (hostBlockId: string, sliderAddonId: string, templateBlockId: string) => void
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
}) {
  const { t } = useTranslation('website')
  const Icon = ADDON_ICONS[addon.type]
  const selected = selection.kind === 'addon' && selection.addonId === addon.id
  const slideTemplate = addon.type === 'slider' ? addon.props.slideTemplate : null
  const hasTemplate = slideTemplate != null
  const collapseKey = addonCollapseKey(addon.id)
  const open = !collapsed[collapseKey]
  const templateChildren = hasTemplate ? listSlideTemplateTreeChildren(slideTemplate) : null

  return (
    <View>
      <View className="flex-row items-center">
        {hasTemplate ? (
          <CollapseToggle
            open={open}
            onToggle={() => setCollapsed((current) => ({ ...current, [collapseKey]: !current[collapseKey] }))}
          />
        ) : (
          <View className="w-4" />
        )}
        <TreeNavRow
          icon={Icon}
          label={t(addon.type)}
          active={selected}
          onSelect={() => onSelect({ kind: 'addon', blockId: hostBlockId, addonId: addon.id })}
          menu={
            canManage ? (
              <TreeRowMenu ariaLabel={t('actionsFor', { name: t(addon.type) })}>
                <ItemListMenuItem
                  onPress={() => {
                    onSelect({ kind: 'addon', blockId: hostBlockId, addonId: addon.id })
                    onOpenAddonSettings(hostBlockId, addon.id)
                  }}
                >
                  {t('openSettings')}
                </ItemListMenuItem>
                <ItemListMenuItem
                  onPress={() => {
                    onSelect({ kind: 'addon', blockId: hostBlockId, addonId: addon.id })
                    onDuplicateAddon?.(hostBlockId, addon.id)
                  }}
                >
                  {t('duplicate')}
                </ItemListMenuItem>
                <ItemListMenuItem onPress={() => onLayer({ blockId: hostBlockId, addonId: addon.id }, 'up')}>
                  {t('layerUp')}
                </ItemListMenuItem>
                <ItemListMenuItem onPress={() => onLayer({ blockId: hostBlockId, addonId: addon.id }, 'down')}>
                  {t('layerDown')}
                </ItemListMenuItem>
                <ItemListMenuSeparator />
                <ItemListMenuItem destructive onPress={() => onDeleteAddon(hostBlockId, addon.id)}>
                  {t('deleteAddon')}
                </ItemListMenuItem>
              </TreeRowMenu>
            ) : null
          }
        />
      </View>
      {open && hasTemplate && slideTemplate && templateChildren ? (
        <View style={{ paddingLeft: TREE_NEST_PX }} className="gap-0.5">
          {templateChildren.legacyShellAddons.map((shellAddon) => (
            <TemplateAddonRow
              key={shellAddon.id}
              addon={shellAddon}
              parentTemplateBlockId={slideTemplate.id}
              hostBlockId={hostBlockId}
              sliderAddonId={addon.id}
              selection={selection}
              canManage={canManage}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              onSelect={onSelect}
              onOpenTemplateBlockSettings={onOpenTemplateBlockSettings}
              onOpenTemplateAddonSettings={onOpenTemplateAddonSettings}
              onLayerTemplateBlock={onLayerTemplateBlock}
              onDeleteTemplateBlock={onDeleteTemplateBlock}
              onDuplicateTemplateBlock={onDuplicateTemplateBlock}
              onLayerTemplateAddon={onLayerTemplateAddon}
              onDeleteTemplateAddon={onDeleteTemplateAddon}
            />
          ))}
          {templateChildren.blocks.map((child) => (
            <TemplateBlockNode
              key={child.id}
              block={child}
              hostBlockId={hostBlockId}
              sliderAddonId={addon.id}
              selection={selection}
              canManage={canManage}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              onSelect={onSelect}
              onOpenTemplateBlockSettings={onOpenTemplateBlockSettings}
              onOpenTemplateAddonSettings={onOpenTemplateAddonSettings}
              onLayerTemplateBlock={onLayerTemplateBlock}
              onDeleteTemplateBlock={onDeleteTemplateBlock}
              onDuplicateTemplateBlock={onDuplicateTemplateBlock}
              onLayerTemplateAddon={onLayerTemplateAddon}
              onDeleteTemplateAddon={onDeleteTemplateAddon}
            />
          ))}
        </View>
      ) : null}
    </View>
  )
}

function TemplateAddonRow({
  addon,
  parentTemplateBlockId,
  hostBlockId,
  sliderAddonId,
  selection,
  canManage,
  collapsed,
  setCollapsed,
  onSelect,
  onOpenTemplateBlockSettings,
  onOpenTemplateAddonSettings,
  onLayerTemplateBlock,
  onDeleteTemplateBlock,
  onDuplicateTemplateBlock,
  onLayerTemplateAddon,
  onDeleteTemplateAddon,
}: {
  addon: WebsiteAddon
  parentTemplateBlockId: string
  hostBlockId: string
  sliderAddonId: string
  selection: DesignerSelection
  canManage: boolean
  collapsed: Record<string, boolean>
  setCollapsed: Dispatch<SetStateAction<Record<string, boolean>>>
  onSelect: (selection: DesignerSelection) => void
  onOpenTemplateBlockSettings?: (hostBlockId: string, sliderAddonId: string, templateBlockId: string) => void
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
  onDeleteTemplateBlock?: (hostBlockId: string, sliderAddonId: string, templateBlockId: string) => void
  onDuplicateTemplateBlock?: (hostBlockId: string, sliderAddonId: string, templateBlockId: string) => void
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
}) {
  const { t } = useTranslation('website')
  const Icon = ADDON_ICONS[addon.type]
  const addonSelected =
    selection.kind === 'templateAddon' &&
    selection.templateAddonId === addon.id &&
    selection.sliderAddonId === sliderAddonId
  const nestedTemplate = addon.type === 'slider' ? addon.props.slideTemplate : null
  const nestedOpen = !collapsed[templateSliderCollapseKey(addon.id)]
  const nestedChildren = nestedTemplate ? listSlideTemplateTreeChildren(nestedTemplate) : null

  return (
    <View>
      <View className="flex-row items-center">
        {nestedTemplate ? (
          <CollapseToggle
            open={nestedOpen}
            onToggle={() =>
              setCollapsed((current) => ({
                ...current,
                [templateSliderCollapseKey(addon.id)]: !current[templateSliderCollapseKey(addon.id)],
              }))
            }
          />
        ) : (
          <View className="w-4" />
        )}
        <TreeNavRow
          icon={Icon}
          label={t(addon.type)}
          active={addonSelected}
          onSelect={() =>
            onSelect({
              kind: 'templateAddon',
              hostBlockId,
              sliderAddonId,
              templateBlockId: parentTemplateBlockId,
              templateAddonId: addon.id,
            })
          }
          menu={
            canManage ? (
              <TreeRowMenu ariaLabel={t('actionsFor', { name: t(addon.type) })}>
                <ItemListMenuItem
                  onPress={() => {
                    onSelect({
                      kind: 'templateAddon',
                      hostBlockId,
                      sliderAddonId,
                      templateBlockId: parentTemplateBlockId,
                      templateAddonId: addon.id,
                    })
                    onOpenTemplateAddonSettings?.(hostBlockId, sliderAddonId, parentTemplateBlockId, addon.id)
                  }}
                >
                  {t('openSettings')}
                </ItemListMenuItem>
                <ItemListMenuItem
                  onPress={() =>
                    onLayerTemplateAddon?.(hostBlockId, sliderAddonId, parentTemplateBlockId, addon.id, 'up')
                  }
                >
                  {t('layerUp')}
                </ItemListMenuItem>
                <ItemListMenuItem
                  onPress={() =>
                    onLayerTemplateAddon?.(hostBlockId, sliderAddonId, parentTemplateBlockId, addon.id, 'down')
                  }
                >
                  {t('layerDown')}
                </ItemListMenuItem>
                <ItemListMenuSeparator />
                <ItemListMenuItem
                  destructive
                  onPress={() =>
                    onDeleteTemplateAddon?.(hostBlockId, sliderAddonId, parentTemplateBlockId, addon.id)
                  }
                >
                  {t('deleteAddon')}
                </ItemListMenuItem>
              </TreeRowMenu>
            ) : null
          }
        />
      </View>
      {nestedOpen && nestedTemplate && nestedChildren ? (
        <View style={{ paddingLeft: TREE_NEST_PX }} className="gap-0.5">
          {nestedChildren.legacyShellAddons.map((childAddon) => (
            <TemplateAddonRow
              key={childAddon.id}
              addon={childAddon}
              parentTemplateBlockId={nestedTemplate.id}
              hostBlockId={hostBlockId}
              sliderAddonId={sliderAddonId}
              selection={selection}
              canManage={canManage}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              onSelect={onSelect}
              onOpenTemplateBlockSettings={onOpenTemplateBlockSettings}
              onOpenTemplateAddonSettings={onOpenTemplateAddonSettings}
              onLayerTemplateBlock={onLayerTemplateBlock}
              onDeleteTemplateBlock={onDeleteTemplateBlock}
              onDuplicateTemplateBlock={onDuplicateTemplateBlock}
              onLayerTemplateAddon={onLayerTemplateAddon}
              onDeleteTemplateAddon={onDeleteTemplateAddon}
            />
          ))}
          {nestedChildren.blocks.map((child) => (
            <TemplateBlockNode
              key={child.id}
              block={child}
              hostBlockId={hostBlockId}
              sliderAddonId={sliderAddonId}
              selection={selection}
              canManage={canManage}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              onSelect={onSelect}
              onOpenTemplateBlockSettings={onOpenTemplateBlockSettings}
              onOpenTemplateAddonSettings={onOpenTemplateAddonSettings}
              onLayerTemplateBlock={onLayerTemplateBlock}
              onDeleteTemplateBlock={onDeleteTemplateBlock}
              onDuplicateTemplateBlock={onDuplicateTemplateBlock}
              onLayerTemplateAddon={onLayerTemplateAddon}
              onDeleteTemplateAddon={onDeleteTemplateAddon}
            />
          ))}
        </View>
      ) : null}
    </View>
  )
}

function TemplateBlockNode({
  block,
  hostBlockId,
  sliderAddonId,
  selection,
  canManage,
  collapsed,
  setCollapsed,
  onSelect,
  onOpenTemplateBlockSettings,
  onOpenTemplateAddonSettings,
  onLayerTemplateBlock,
  onDeleteTemplateBlock,
  onDuplicateTemplateBlock,
  onLayerTemplateAddon,
  onDeleteTemplateAddon,
}: {
  block: WebsiteBlock
  hostBlockId: string
  sliderAddonId: string
  selection: DesignerSelection
  canManage: boolean
  collapsed: Record<string, boolean>
  setCollapsed: Dispatch<SetStateAction<Record<string, boolean>>>
  onSelect: (selection: DesignerSelection) => void
  onOpenTemplateBlockSettings?: (hostBlockId: string, sliderAddonId: string, templateBlockId: string) => void
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
  onDeleteTemplateBlock?: (hostBlockId: string, sliderAddonId: string, templateBlockId: string) => void
  onDuplicateTemplateBlock?: (hostBlockId: string, sliderAddonId: string, templateBlockId: string) => void
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
}) {
  const { t } = useTranslation('website')
  const collapseKey = templateCollapseKey(block.id)
  const open = !collapsed[collapseKey]
  const selected =
    selection.kind === 'templateBlock' &&
    selection.templateBlockId === block.id &&
    selection.sliderAddonId === sliderAddonId
  const addons = [...block.addons].sort((a, b) => a.zIndex - b.zIndex)
  const children = [...(block.children ?? [])].sort((a, b) => a.zIndex - b.zIndex)
  const hasNesting = addons.length > 0 || children.length > 0

  return (
    <View>
      <View className="flex-row items-center">
        {hasNesting ? (
          <CollapseToggle
            open={open}
            onToggle={() => setCollapsed((current) => ({ ...current, [collapseKey]: !current[collapseKey] }))}
          />
        ) : (
          <View className="w-4" />
        )}
        <TreeNavRow
          icon={Box}
          label={blockTreeLabel(block, t('block'))}
          active={selected}
          onSelect={() =>
            onSelect({
              kind: 'templateBlock',
              hostBlockId,
              sliderAddonId,
              templateBlockId: block.id,
            })
          }
          menu={
            canManage ? (
              <TreeRowMenu ariaLabel={t('actionsFor', { name: t('block') })}>
                <ItemListMenuItem
                  onPress={() => {
                    onSelect({
                      kind: 'templateBlock',
                      hostBlockId,
                      sliderAddonId,
                      templateBlockId: block.id,
                    })
                    onOpenTemplateBlockSettings?.(hostBlockId, sliderAddonId, block.id)
                  }}
                >
                  {t('openSettings')}
                </ItemListMenuItem>
                <ItemListMenuItem
                  onPress={() => {
                    onSelect({
                      kind: 'templateBlock',
                      hostBlockId,
                      sliderAddonId,
                      templateBlockId: block.id,
                    })
                    onDuplicateTemplateBlock?.(hostBlockId, sliderAddonId, block.id)
                  }}
                >
                  {t('duplicate')}
                </ItemListMenuItem>
                <ItemListMenuItem
                  onPress={() => onLayerTemplateBlock?.(hostBlockId, sliderAddonId, block.id, 'up')}
                >
                  {t('layerUp')}
                </ItemListMenuItem>
                <ItemListMenuItem
                  onPress={() => onLayerTemplateBlock?.(hostBlockId, sliderAddonId, block.id, 'down')}
                >
                  {t('layerDown')}
                </ItemListMenuItem>
                <ItemListMenuSeparator />
                <ItemListMenuItem
                  destructive
                  onPress={() => onDeleteTemplateBlock?.(hostBlockId, sliderAddonId, block.id)}
                >
                  {t('deleteBlock')}
                </ItemListMenuItem>
              </TreeRowMenu>
            ) : null
          }
        />
      </View>
      {open && hasNesting ? (
        <View style={{ paddingLeft: TREE_NEST_PX }} className="gap-0.5">
          {addons.map((addon) => (
            <TemplateAddonRow
              key={addon.id}
              addon={addon}
              parentTemplateBlockId={block.id}
              hostBlockId={hostBlockId}
              sliderAddonId={sliderAddonId}
              selection={selection}
              canManage={canManage}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              onSelect={onSelect}
              onOpenTemplateBlockSettings={onOpenTemplateBlockSettings}
              onOpenTemplateAddonSettings={onOpenTemplateAddonSettings}
              onLayerTemplateBlock={onLayerTemplateBlock}
              onDeleteTemplateBlock={onDeleteTemplateBlock}
              onDuplicateTemplateBlock={onDuplicateTemplateBlock}
              onLayerTemplateAddon={onLayerTemplateAddon}
              onDeleteTemplateAddon={onDeleteTemplateAddon}
            />
          ))}
          {children.map((child) => (
            <TemplateBlockNode
              key={child.id}
              block={child}
              hostBlockId={hostBlockId}
              sliderAddonId={sliderAddonId}
              selection={selection}
              canManage={canManage}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              onSelect={onSelect}
              onOpenTemplateBlockSettings={onOpenTemplateBlockSettings}
              onOpenTemplateAddonSettings={onOpenTemplateAddonSettings}
              onLayerTemplateBlock={onLayerTemplateBlock}
              onDeleteTemplateBlock={onDeleteTemplateBlock}
              onDuplicateTemplateBlock={onDuplicateTemplateBlock}
              onLayerTemplateAddon={onLayerTemplateAddon}
              onDeleteTemplateAddon={onDeleteTemplateAddon}
            />
          ))}
        </View>
      ) : null}
    </View>
  )
}
