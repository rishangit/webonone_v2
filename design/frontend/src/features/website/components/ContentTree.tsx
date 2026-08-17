import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  Button,
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemList,
  ItemListContent,
  ItemListItem,
  ItemListMenu,
  itemListRowActiveClassName,
} from '@webonone/ui-kit'
import { getAddonModuleByType } from '../addons/registry'
import type { DesignerSelection, WebsiteDocumentV1 } from '../types'

interface ContentTreeProps {
  document: WebsiteDocumentV1
  selection: DesignerSelection | null
  canManage?: boolean
  onSelect: (selection: DesignerSelection) => void
  onReorderAddon: (blockId: string, from: number, to: number) => void
  onReorderBlock: (from: number, to: number) => void
  onLayer: (target: { blockId: string; addonId?: string }, direction: 'up' | 'down') => void
  onDeleteBlock: (blockId: string) => void
  onDeleteAddon: (blockId: string, addonId: string) => void
  onOpenContainerSettings: () => void
  onOpenBlockSettings: (blockId: string) => void
  onOpenAddonSettings: (blockId: string, addonId: string) => void
}

type DragState =
  | { kind: 'block'; index: number }
  | { kind: 'addon'; blockId: string; index: number }

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
  onOpenContainerSettings,
  onOpenBlockSettings,
  onOpenAddonSettings,
}: ContentTreeProps) {
  const { t } = useTranslation('website')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [drag, setDrag] = useState<DragState | null>(null)
  const blocks = [...document.blocks].sort((a, b) => a.zIndex - b.zIndex)

  useEffect(() => {
    if (selection?.kind !== 'addon' && selection?.kind !== 'block') return
    setCollapsed((current) => ({ ...current, [selection.blockId]: false }))
  }, [selection])

  return (
    <div className="text-sm">
      <p className="mb-2 font-medium">{t('contentTree')}</p>
      <ItemList className="py-0">
        <ItemListItem
          className={selection?.kind === 'container' ? itemListRowActiveClassName : undefined}
          onClick={() => onSelect({ kind: 'container' })}
        >
          <ItemListContent>
            <Button
              type="button"
              variant="ghost"
              className="h-auto w-full justify-start px-1 py-0.5"
              onClick={() => onSelect({ kind: 'container' })}
            >
              {t('container')}
            </Button>
          </ItemListContent>
          {canManage ? (
            <ItemListMenu ariaLabel={t('actionsFor', { name: t('container') })}>
              <DropdownMenuItem
                onClick={() => {
                  onSelect({ kind: 'container' })
                  onOpenContainerSettings()
                }}
              >
                {t('openSettings')}
              </DropdownMenuItem>
            </ItemListMenu>
          ) : null}
        </ItemListItem>
      </ItemList>
      {blocks.map((block, blockIndex) => {
        const open = !collapsed[block.id]
        const blockSelected = selection?.kind === 'block' && selection.blockId === block.id
        const addons = [...block.addons].sort((a, b) => a.zIndex - b.zIndex)
        return (
          <div key={block.id} className="mt-2">
            <ItemList className="py-0">
              <ItemListItem
                className={blockSelected ? itemListRowActiveClassName : undefined}
                onClick={() => onSelect({ kind: 'block', blockId: block.id })}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  aria-label={open ? t('collapse') : t('expand')}
                  onClick={(event) => {
                    event.stopPropagation()
                    setCollapsed((current) => ({ ...current, [block.id]: !current[block.id] }))
                  }}
                >
                  {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </Button>
                <ItemListContent>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto w-full justify-start px-1 py-0.5"
                    draggable={canManage}
                    onClick={() => onSelect({ kind: 'block', blockId: block.id })}
                    onDragStart={() => setDrag({ kind: 'block', index: blockIndex })}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (drag?.kind === 'block') onReorderBlock(drag.index, blockIndex)
                      setDrag(null)
                    }}
                  >
                    {t('block')}
                  </Button>
                </ItemListContent>
                {canManage ? (
                  <ItemListMenu ariaLabel={t('actionsFor', { name: t('block') })}>
                    <DropdownMenuItem
                      onClick={() => {
                        onSelect({ kind: 'block', blockId: block.id })
                        onOpenBlockSettings(block.id)
                      }}
                    >
                      {t('openSettings')}
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
                  </ItemListMenu>
                ) : null}
              </ItemListItem>
            </ItemList>
            {open && addons.length > 0 ? (
              <ItemList className="ml-6 py-0">
                {addons.map((addon, addonIndex) => {
                  const addonSelected = selection?.kind === 'addon' && selection.addonId === addon.id
                  const module = getAddonModuleByType(addon.type)
                  const label = module ? t(module.labelKey) : addon.type
                  return (
                    <ItemListItem
                      key={addon.id}
                      className={addonSelected ? itemListRowActiveClassName : undefined}
                      onClick={() => onSelect({ kind: 'addon', blockId: block.id, addonId: addon.id })}
                    >
                      <ItemListContent>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-auto w-full justify-start px-1 py-0.5"
                          draggable={canManage}
                          onClick={() => onSelect({ kind: 'addon', blockId: block.id, addonId: addon.id })}
                          onDragStart={() => setDrag({ kind: 'addon', blockId: block.id, index: addonIndex })}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => {
                            if (drag?.kind === 'addon' && drag.blockId === block.id) {
                              onReorderAddon(block.id, drag.index, addonIndex)
                            }
                            setDrag(null)
                          }}
                        >
                          {label}
                        </Button>
                      </ItemListContent>
                      {canManage ? (
                        <ItemListMenu ariaLabel={t('actionsFor', { name: label })}>
                          <DropdownMenuItem
                            onClick={() => {
                              onSelect({ kind: 'addon', blockId: block.id, addonId: addon.id })
                              onOpenAddonSettings(block.id, addon.id)
                            }}
                          >
                            {t('openSettings')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onLayer({ blockId: block.id, addonId: addon.id }, 'up')}>
                            {t('layerUp')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onLayer({ blockId: block.id, addonId: addon.id }, 'down')}
                          >
                            {t('layerDown')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDeleteAddon(block.id, addon.id)}
                          >
                            {t('deleteAddon')}
                          </DropdownMenuItem>
                        </ItemListMenu>
                      ) : null}
                    </ItemListItem>
                  )
                })}
              </ItemList>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
