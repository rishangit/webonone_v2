import type { ReactNode } from 'react'
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
  ListTree,
  MoreVertical,
  MousePointerClick,
  Type,
  type LucideIcon,
} from 'lucide-react'
import type { WebsiteAddon } from '../../types'

/** Same row chrome as WebOnOne `NavItem` at md (`py-2`, `h-5` icon). */
export const TREE_NAV_ITEM =
  'flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground'
export const TREE_NAV_ACTIVE = 'border-l-2 border-primary bg-accent/60'
/** One nesting level — keep small so deep children stay visible in the narrow sidebar. */
export const TREE_NEST = 'pl-2'

export const ADDON_ICONS: Record<WebsiteAddon['type'], LucideIcon> = {
  image: ImageIcon,
  slider: GalleryHorizontal,
  text: Type,
  button: MousePointerClick,
  menu: ListTree,
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
