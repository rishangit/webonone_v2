import type { DragEvent as ReactDragEvent, MouseEvent, ReactNode } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  cn,
} from '@webonone/ui-kit'
import {
  GalleryHorizontal,
  ImageIcon,
  List,
  ListTree,
  MoreVertical,
  MousePointerClick,
  Type,
  ChevronDown,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { useTreeHoverReporter } from '../../document/canvasHighlight'
import { placementFromPointer, type TreeDropPlacement } from '../../document/treeDrop'
import type { DesignerSelection, WebsiteAddon } from '../../types'

/** Same row chrome as WebOnOne `NavItem` at md (`py-2`, `h-5` icon). */
export const TREE_NAV_ITEM =
  'flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground'
export const TREE_NAV_ACTIVE = 'border-l-2 border-primary bg-accent/60'
/** One nesting level — keep small so deep children stay visible in the narrow sidebar. */
export const TREE_NEST = 'pl-2'

export const ADDON_ICONS: Record<WebsiteAddon['type'], LucideIcon> = {
  image: ImageIcon,
  slider: GalleryHorizontal,
  list: List,
  text: Type,
  button: MousePointerClick,
  menu: ListTree,
}

export function TreeExpandToggle({
  open,
  expandLabel,
  collapseLabel,
  onToggle,
}: {
  open: boolean
  expandLabel: string
  collapseLabel: string
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      className="flex h-7 w-4 shrink-0 items-center justify-center text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      aria-expanded={open}
      aria-label={open ? collapseLabel : expandLabel}
      onClick={onToggle}
    >
      {open ? <ChevronDown className="h-3.5 w-3.5" aria-hidden /> : <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
    </button>
  )
}

/** Line between rows, or a border when the drop will land inside a block. */
export function TreeDropFrame({
  placement,
  nestable = false,
  onDragHover,
  onDrop,
  children,
}: {
  placement: TreeDropPlacement | null
  /** Block rows accept a middle “drop inside” zone. Add-on rows only reorder. */
  nestable?: boolean
  onDragHover?: (placement: TreeDropPlacement) => void
  onDrop?: (placement: TreeDropPlacement) => void
  children: ReactNode
}) {
  function zoneFrom(event: ReactDragEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0.5
    return placementFromPointer(ratio, nestable)
  }

  const listening = Boolean(onDragHover || onDrop)

  return (
    <div
      className={cn('relative', placement === 'inside' && 'rounded-md ring-2 ring-inset ring-primary')}
      onDragOver={
        listening
          ? (event) => {
              event.preventDefault()
              event.stopPropagation()
              event.dataTransfer.dropEffect = 'move'
              onDragHover?.(zoneFrom(event))
            }
          : undefined
      }
      onDrop={
        onDrop
          ? (event) => {
              event.preventDefault()
              event.stopPropagation()
              onDrop(zoneFrom(event))
            }
          : undefined
      }
    >
      {placement === 'before' ? (
        <span
          className="pointer-events-none absolute inset-x-2 top-0 z-10 h-0.5 -translate-y-1/2 bg-primary"
          aria-hidden
        />
      ) : null}
      {placement === 'after' ? (
        <span
          className="pointer-events-none absolute inset-x-2 bottom-0 z-10 h-0.5 translate-y-1/2 bg-primary"
          aria-hidden
        />
      ) : null}
      {children}
    </div>
  )
}

export function TreeRowMenu({ ariaLabel, children }: { ariaLabel: string; children: ReactNode }) {
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

export function TreeNavRow({
  treeId,
  icon: Icon,
  label,
  subtitle,
  hoverTarget,
  active,
  draggable,
  menu,
  onSelect,
  onDragStart,
  onDragEnd,
}: {
  treeId: string
  icon: LucideIcon
  label: string
  /** Element type, shown under the name in small type. */
  subtitle?: string
  /** Canvas element to outline while this row is hovered. */
  hoverTarget?: DesignerSelection
  active?: boolean
  draggable?: boolean
  menu?: ReactNode
  onSelect: () => void
  onDragStart?: () => void
  onDragEnd?: () => void
}) {
  const reportHover = useTreeHoverReporter()
  return (
    <div
      data-tree-id={treeId}
      role="button"
      tabIndex={0}
      draggable={draggable}
      className={cn(TREE_NAV_ITEM, 'w-full', active && TREE_NAV_ACTIVE)}
      onMouseEnter={() => {
        if (hoverTarget) reportHover?.(hoverTarget)
      }}
      onMouseLeave={(event: MouseEvent<HTMLDivElement>) => {
        const next = event.relatedTarget
        if (next instanceof Element && next.closest('[data-tree-id]')) return
        reportHover?.(null)
      }}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
      onDragStart={(event) => {
        event.stopPropagation()
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', treeId)
        onDragStart?.()
      }}
      onDragEnd={onDragEnd}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate">{label}</span>
        {subtitle ? (
          <span className="block truncate text-xs font-normal lowercase text-muted-foreground">{subtitle}</span>
        ) : null}
      </span>
      {menu}
    </div>
  )
}
