import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button, FormField, Input } from '@webonone/ui-kit'
import { nanoid } from 'nanoid'
import { NestedBlockTree } from '../../components/NestedBlockTree'
import { ListManualItemEditDialog } from './ListManualItemEditDialog'
import { ListTemplateElementsPanel } from './ListTemplateElementsPanel'
import {
  collectListRowTemplateElements,
  ensureListManualItemsForTemplateProps,
} from '../../document/listTemplateElements'
import {
  clampListItemGap,
  collectListDataTree,
  createEmptyListItem,
  inferListItemGroup,
  listMainBlock,
  presentListItemBlock,
  resolveListItems,
  resolveListRowTemplate,
} from '../../document/list'
import { cn } from '@webonone/ui-kit'
import { createEmptySlideTemplate } from '../../document/slider'
import { resolveLayoutRect } from '../../document/layout'
import { emptyLayoutByBreakpoint, MAX_LIST_DATA_ITEMS, type WebsiteAddon } from '../../types'
import type { AddonModule, AddonPropsFieldsProps, AddonRenderProps } from '../types'
import { ListDataBindingFields } from './ListDataBindingFields'

function ListAddonRenderer({
  addon,
  breakpoint,
  theme,
  pages,
  currentPageId,
  companyId,
  interactive,
  publish,
  paletteId = null,
  datasetItemsById = {},
  hostBlockId,
  selection,
  canManage,
  parentDataItem = null,
  hostItemsPath = null,
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
}: AddonRenderProps) {
  const { t } = useTranslation('website')
  const listProps = addon.type === 'list' ? addon.props : null
  const template = listProps?.itemTemplate ?? null

  const items = useMemo(() => {
    if (!listProps) return []
    const parentPath = listProps.itemsPath?.trim() || hostItemsPath?.trim() || null
    const dataSource =
      listProps.dataSource === 'parent' ||
      (parentPath && parentDataItem && listProps.dataSource !== 'manual' && !listProps.datasetId)
        ? 'parent'
        : listProps.dataSource
    return resolveListItems({
      addonId: addon.id,
      dataSource: dataSource === 'parent' ? 'parent' : listProps.dataSource === 'manual' ? 'manual' : 'dataset',
      datasetId: listProps.datasetId,
      itemsPath: parentPath,
      manualItems: listProps.manualItems,
      datasetItemsById,
      parentDataItem,
      maxItems: MAX_LIST_DATA_ITEMS,
    })
  }, [addon.id, listProps, datasetItemsById, hostItemsPath, parentDataItem])

  const displayItems = useMemo((): Array<Record<string, unknown> | null> => {
    if (!template) return []
    if (items.length === 0) return [null]
    return items
  }, [items, template])

  if (addon.type !== 'list' || !listProps || !template) {
    if (addon.type !== 'list' || !listProps) return null
    return (
      <div className="flex h-full items-center justify-center border border-dashed border-muted-foreground/40 px-3 text-center text-sm text-muted-foreground">
        {t('listEmptyTemplate')}
      </div>
    )
  }

  const shellHeight = resolveLayoutRect(template.layout, breakpoint).height
  const mainBlock = listMainBlock(template, listProps.itemGroup)
  const mainRowHeight = mainBlock
    ? resolveLayoutRect(mainBlock.layout, breakpoint).height
    : shellHeight

  const gap = clampListItemGap(listProps.itemGap)
  const scrollRows = interactive && displayItems.length > 1
  const expandSets = publish || !interactive

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col',
        scrollRows ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden',
      )}
      style={{ gap }}
    >
      {displayItems.map((dataItem, itemIndex) => {
        const isAuthoringSlot = interactive && itemIndex === 0
        const isRuntimePreview = interactive && itemIndex > 0
        const rowTemplate = resolveListRowTemplate(template, listProps.itemGroup, {
          authoring: isAuthoringSlot,
        })
        const rowExpandSets = expandSets || isRuntimePreview
        const { block: itemBlock, dataItemByBlockId } = presentListItemBlock(
          rowTemplate,
          dataItem,
          datasetItemsById,
          rowExpandSets,
        )
        const rowHeight = isAuthoringSlot ? shellHeight : mainRowHeight
        const fillList = isAuthoringSlot && displayItems.length === 1
        return (
          <div
            key={isAuthoringSlot ? template.id : `list-item-${itemIndex}`}
            className={cn(
              'relative w-full shrink-0 overflow-visible',
              isRuntimePreview && 'pointer-events-none select-none opacity-50',
              fillList && 'min-h-0 flex-1',
            )}
            style={{
              minHeight: Math.max(rowHeight, 48),
              ...(fillList ? { height: '100%' } : { height: Math.max(rowHeight, 48) }),
            }}
            aria-hidden={isRuntimePreview ? true : undefined}
          >
            <NestedBlockTree
              block={itemBlock}
              breakpoint={breakpoint}
              theme={theme}
              parentPaletteId={paletteId}
              pages={pages}
              currentPageId={currentPageId}
              companyId={companyId}
              publish={publish}
              interactive={isAuthoringSlot}
              canManage={canManage}
              hostBlockId={hostBlockId}
              sliderAddonId={addon.id}
              selection={isAuthoringSlot ? selection : null}
              datasetItemsById={datasetItemsById}
              parentDataItem={dataItem}
              dataItemByBlockId={dataItemByBlockId}
              onSelect={isAuthoringSlot ? onSelect : undefined}
              onMovePointerDown={isAuthoringSlot ? onMovePointerDown : undefined}
              onResizePointerDown={isAuthoringSlot ? onResizePointerDown : undefined}
              onOpenTemplateBlockSettings={isAuthoringSlot ? onOpenTemplateBlockSettings : undefined}
              onOpenTemplateAddonSettings={isAuthoringSlot ? onOpenTemplateAddonSettings : undefined}
              onLayerTemplateBlock={isAuthoringSlot ? onLayerTemplateBlock : undefined}
              onDeleteTemplateBlock={isAuthoringSlot ? onDeleteTemplateBlock : undefined}
              onDuplicateTemplateBlock={isAuthoringSlot ? onDuplicateTemplateBlock : undefined}
              onLayerTemplateAddon={isAuthoringSlot ? onLayerTemplateAddon : undefined}
              onDeleteTemplateAddon={isAuthoringSlot ? onDeleteTemplateAddon : undefined}
              onAddChild={isAuthoringSlot ? onAddChild : undefined}
              onNavigatePage={onNavigatePage}
            />
          </div>
        )
      })}
    </div>
  )
}

function ListAddonPropsFields({
  addon,
  onChange,
  onNestedDialogOpenChange,
  hostedInTemplate = false,
  templateHostEditor = null,
}: AddonPropsFieldsProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const listMain = useMemo(
    () =>
      addon.type === 'list'
        ? listMainBlock(addon.props.itemTemplate, addon.props.itemGroup)
        : null,
    [addon],
  )
  const dataNodes = useMemo(
    () =>
      addon.type === 'list'
        ? collectListDataTree(listMain ?? addon.props.itemTemplate)
        : [],
    [addon, listMain],
  )
  const templateElements = useMemo(
    () =>
      addon.type === 'list'
        ? collectListRowTemplateElements(
            addon.props.itemTemplate,
            addon.props.itemGroup,
            t('block'),
          )
        : [],
    [addon, t],
  )

  const listItemTemplate = addon.type === 'list' ? addon.props.itemTemplate : null
  const listManualCount = addon.type === 'list' ? addon.props.manualItems.length : 0
  const listDataSource = addon.type === 'list' ? addon.props.dataSource : null

  useEffect(() => {
    if (addon.type !== 'list') return
    if (addon.props.dataSource !== 'manual') return
    if (addon.props.manualItems.length > 0) return
    const nextProps = ensureListManualItemsForTemplateProps(inferListItemGroup(addon.props))
    if (
      nextProps.manualItems.length !== addon.props.manualItems.length ||
      nextProps.itemGroup !== addon.props.itemGroup
    ) {
      onChange({ ...addon, props: nextProps })
    }
  }, [addon, listDataSource, listItemTemplate, listManualCount, onChange])

  if (addon.type !== 'list') return null
  const listAddon = addon

  function updateProps(partial: Partial<typeof listAddon.props>) {
    onChange({ ...listAddon, props: { ...listAddon.props, ...partial } })
  }

  function updateManualItem(itemId: string, data: Record<string, unknown>) {
    updateProps({
      manualItems: listAddon.props.manualItems.map((item) =>
        item.id === itemId ? { ...item, data } : item,
      ),
    })
  }

  function moveManualItem(from: number, to: number) {
    const items = [...listAddon.props.manualItems]
    if (to < 0 || to >= items.length) return
    const [item] = items.splice(from, 1)
    if (!item) return
    items.splice(to, 0, item)
    updateProps({ manualItems: items })
  }

  const editingItem = listAddon.props.manualItems.find((item) => item.id === editingItemId) ?? null
  const editingIndex =
    editingItem != null ? listAddon.props.manualItems.findIndex((item) => item.id === editingItemId) : -1

  const showManualEditor =
    !hostedInTemplate && listAddon.props.dataSource === 'manual'

  return (
    <>
      <p className="text-xs text-muted-foreground">{t('listTemplateHint')}</p>
      <FormField label={t('listItemGap')} htmlFor="list-item-gap">
        <Input
          id="list-item-gap"
          type="number"
          min={0}
          max={64}
          value={clampListItemGap(listAddon.props.itemGap)}
          onChange={(event) => {
            const raw = Number(event.target.value)
            updateProps({ itemGap: clampListItemGap(Number.isFinite(raw) ? raw : undefined) })
          }}
        />
      </FormField>

      {showManualEditor ? (
        <div className="space-y-2 border-t border-[hsl(var(--glass-border))] pt-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{t('listItems')}</p>
            <Button
              type="button"
              variant="outline"
              className="h-9"
              disabled={
                !listAddon.props.itemTemplate ||
                listAddon.props.manualItems.length >= MAX_LIST_DATA_ITEMS
              }
              onClick={() =>
                updateProps({
                  manualItems: [...listAddon.props.manualItems, createEmptyListItem()],
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" aria-hidden />
              {t('addListItem')}
            </Button>
          </div>
          {!listAddon.props.itemTemplate ? (
            <p className="text-xs text-muted-foreground">{t('listPickPresetFirst')}</p>
          ) : null}
          {templateElements.length > 0 ? (
            <div className="space-y-2 rounded-md border border-[hsl(var(--glass-border))] p-3">
              <p className="text-xs font-medium text-muted-foreground">{t('listTemplateElementsHeading')}</p>
              <ListTemplateElementsPanel
                elements={templateElements}
                templateHostEditor={templateHostEditor}
              />
            </div>
          ) : null}
          {dataNodes.length === 0 && listAddon.props.itemTemplate && templateElements.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t('listNoBindableFields')}</p>
          ) : null}
          {listAddon.props.manualItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('listItemsEmpty')}</p>
          ) : (
            <div className="space-y-3">
              {listAddon.props.manualItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 rounded-md border border-[hsl(var(--glass-border))] p-3"
                >
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">
                    {t('listItemN', { index: index + 1 })}
                  </p>
                  <div className="flex shrink-0 flex-col gap-0.5">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-7"
                      aria-label={t('moveItemUp')}
                      disabled={index === 0}
                      onClick={() => moveManualItem(index, index - 1)}
                    >
                      <ChevronUp className="size-3.5" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-7"
                      aria-label={t('moveItemDown')}
                      disabled={index === listAddon.props.manualItems.length - 1}
                      onClick={() => moveManualItem(index, index + 1)}
                    >
                      <ChevronDown className="size-3.5" aria-hidden />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 shrink-0 px-3"
                    onClick={() => setEditingItemId(item.id)}
                  >
                    <Pencil className="mr-2 h-4 w-4" aria-hidden />
                    {tc('edit')}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-8 shrink-0"
                    aria-label={t('removeListItem')}
                    onClick={() => {
                      if (editingItemId === item.id) setEditingItemId(null)
                      updateProps({
                        manualItems: listAddon.props.manualItems.filter((row) => row.id !== item.id),
                      })
                    }}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : listAddon.props.dataSource !== 'manual' ? (
        <p className="text-xs text-muted-foreground">{t('listRowsFromDataBinding')}</p>
      ) : null}

      {editingItem && editingIndex >= 0 ? (
        <ListManualItemEditDialog
          open
          onOpenChange={(open) => {
            if (!open) setEditingItemId(null)
          }}
          title={t('listEditItemTitle', { index: editingIndex + 1 })}
          nodes={dataNodes}
          templateElements={templateElements}
          templateHostEditor={templateHostEditor}
          data={editingItem.data}
          onSave={(data) => updateManualItem(editingItem.id, data)}
          onNestedDialogOpenChange={onNestedDialogOpenChange}
        />
      ) : null}
    </>
  )
}

function createDefaultListAddon(zIndex: number): WebsiteAddon {
  return {
    id: nanoid(10),
    type: 'list',
    zIndex,
    layout: emptyLayoutByBreakpoint({ top: 8, height: 320, colSpan: 12 }),
    props: {
      itemTemplate: createEmptySlideTemplate(280),
      sourcePresetId: null,
      dataSource: 'manual',
      datasetId: null,
      itemGroup: null,
      itemsPath: null,
      manualItems: [],
      itemGap: 12,
    },
  }
}

export const listAddonModule: AddonModule = {
  type: 'list',
  labelKey: 'list',
  descriptionKey: 'listDescription',
  createDefaultAddon: createDefaultListAddon,
  RenderComponent: ListAddonRenderer,
  PropsFields: ListAddonPropsFields,
  DataBindingFields: ListDataBindingFields,
}
