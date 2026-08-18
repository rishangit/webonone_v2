import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  ChevronDown,
  ChevronRight,
  ImageIcon,
  LayoutTemplate,
  MoreVertical,
  MousePointerClick,
  Type,
  type LucideIcon,
} from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from '@webonone/ui-kit'
import { getAddonModuleByType } from '../addons/registry'
import type { DesignerSelection, WebsiteAddon, WebsiteDocumentV1 } from '../types'

/** Same row chrome as WebOnOne `NavItem` at md (`py-2`, `h-5` icon). */
const TREE_NAV_ITEM =
  'flex min-w-0 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground'
const TREE_NAV_ACTIVE = 'border-l-2 border-primary bg-accent/60'

const ADDON_ICONS: Record<WebsiteAddon['type'], LucideIcon> = {
  image: ImageIcon,
  text: Type,
  button: MousePointerClick,
}

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

function treeItemId(selection: DesignerSelection) {
  if (selection.kind === 'container') return 'container'
  if (selection.kind === 'block') return `block:${selection.blockId}`
  return `addon:${selection.addonId}`
}

function TreeRowMenu({ ariaLabel, children }: { ariaLabel: string; children: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-5 w-5 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={ariaLabel}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48" onClick={(event) => event.stopPropagation()}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function TreeNavRow({
  treeId,
  icon: Icon,
  label,
  active,
  draggable,
  menu,
  onSelect,
  onDragStart,
  onDrop,
}: {
  treeId: string
  icon: LucideIcon
  label: string
  active?: boolean
  draggable?: boolean
  menu?: ReactNode
  onSelect: () => void
  onDragStart?: () => void
  onDrop?: () => void
}) {
  return (
    <div
      data-tree-id={treeId}
      role="button"
      tabIndex={0}
      draggable={draggable}
      className={cn(TREE_NAV_ITEM, 'w-full', active && TREE_NAV_ACTIVE)}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
      onDragStart={onDragStart}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      {menu}
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
  onOpenContainerSettings,
  onOpenBlockSettings,
  onOpenAddonSettings,
}: ContentTreeProps) {
  const { t } = useTranslation('website')
  const rootRef = useRef<HTMLElement>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [drag, setDrag] = useState<DragState | null>(null)
  const blocks = [...document.blocks].sort((a, b) => a.zIndex - b.zIndex)

  useEffect(() => {
    if (selection?.kind !== 'addon' && selection?.kind !== 'block') return
    setCollapsed((current) => ({ ...current, [selection.blockId]: false }))
  }, [selection])

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
      {blocks.map((block, blockIndex) => {
        const open = !collapsed[block.id]
        const blockSelected = selection?.kind === 'block' && selection.blockId === block.id
        const blockParent = selection?.kind === 'addon' && selection.blockId === block.id
        const addons = [...block.addons].sort((a, b) => a.zIndex - b.zIndex)
        const hasAddons = addons.length > 0
        return (
          <div key={block.id}>
            <div className="flex items-center">
              {hasAddons ? (
                <button
                  type="button"
                  className="flex h-8 w-6 shrink-0 items-center justify-center text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  aria-expanded={open}
                  aria-label={open ? t('collapse') : t('expand')}
                  onClick={() => setCollapsed((current) => ({ ...current, [block.id]: !current[block.id] }))}
                >
                  {open ? <ChevronDown className="h-4 w-4" aria-hidden /> : <ChevronRight className="h-4 w-4" aria-hidden />}
                </button>
              ) : null}
              <div className="min-w-0 flex-1">
                <TreeNavRow
                  treeId={`block:${block.id}`}
                  icon={Box}
                  label={t('block')}
                  active={blockSelected || blockParent}
                  draggable={canManage}
                  onSelect={() => onSelect({ kind: 'block', blockId: block.id })}
                  onDragStart={() => setDrag({ kind: 'block', index: blockIndex })}
                  onDrop={() => {
                    if (drag?.kind === 'block') onReorderBlock(drag.index, blockIndex)
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
            {open && hasAddons ? (
              <div className="mt-1 space-y-1 pl-12">
                {addons.map((addon, addonIndex) => {
                  const addonSelected = selection?.kind === 'addon' && selection.addonId === addon.id
                  const module = getAddonModuleByType(addon.type)
                  const label = module ? t(module.labelKey) : addon.type
                  const AddonIcon = ADDON_ICONS[addon.type]
                  return (
                    <TreeNavRow
                      key={addon.id}
                      treeId={`addon:${addon.id}`}
                      icon={AddonIcon}
                      label={label}
                      active={addonSelected}
                      draggable={canManage}
                      onSelect={() => onSelect({ kind: 'addon', blockId: block.id, addonId: addon.id })}
                      onDragStart={() => setDrag({ kind: 'addon', blockId: block.id, index: addonIndex })}
                      onDrop={() => {
                        if (drag?.kind === 'addon' && drag.blockId === block.id) {
                          onReorderAddon(block.id, drag.index, addonIndex)
                        }
                        setDrag(null)
                      }}
                      menu={
                        canManage ? (
                          <TreeRowMenu ariaLabel={t('actionsFor', { name: label })}>
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
                            <DropdownMenuItem onClick={() => onLayer({ blockId: block.id, addonId: addon.id }, 'down')}>
                              {t('layerDown')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => onDeleteAddon(block.id, addon.id)}
                            >
                              {t('deleteAddon')}
                            </DropdownMenuItem>
                          </TreeRowMenu>
                        ) : null
                      }
                    />
                  )
                })}
              </div>
            ) : null}
          </div>
        )
      })}
    </nav>
  )
}
