import * as React from 'react'
import { MoreVertical } from 'lucide-react'
import { cn } from '../lib/utils'
import {
  shapeListRowClassName,
  shapeListRowSurfaceClassName,
  shapePanelSmClassName,
} from '../lib/shape'
import { useUiTheme } from '../ui-theme/UiThemeContext'
import { themeNeedsShapeDom } from '../ui-theme/uiTheme'
import { Button } from './Button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './DropdownMenu'

/** List container — vertical padding and small gap between separate row cards */
export const itemListClassName = 'flex flex-col gap-2 py-4'

/** Shared row surface — glass fill, hover shadow, row padding */
export const itemListRowSurfaceClassName =
  'group flex items-start gap-3 glass-card item-list-row px-3 py-2 text-sm text-foreground'

/** Classic row — single element with small panel chamfer */
export const itemListRowClassName = cn(itemListRowSurfaceClassName, shapePanelSmClassName)

/** 3-dot menu trigger — top-right of the row */
export const itemListMenuClassName = 'shrink-0 self-start'

/** Status / verification chip — top-right of the row, before ItemListMenu */
export const itemListStatusClassName = 'shrink-0 self-start'

/** Leading entity image in a list row (logo, avatar, catalog thumb). */
export const itemListThumbClassName = 'h-14 w-14 shrink-0 rounded-md'

/** Selected / active row — stronger border, no theme fill */
export const itemListRowActiveClassName = 'border-primary'

function ItemList({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul role="list" className={cn(itemListClassName, className)} {...props} />
}

function ItemListItem({ className, children, ...props }: React.LiHTMLAttributes<HTMLLIElement>) {
  const uiTheme = useUiTheme()
  const shapeDom = themeNeedsShapeDom(uiTheme)

  if (!shapeDom) {
    return (
      <li className={cn(itemListRowClassName, className)} {...props}>
        {children}
      </li>
    )
  }

  return (
    <li className={cn(shapeListRowClassName, className)} {...props}>
      <div className={cn(itemListRowSurfaceClassName, shapeListRowSurfaceClassName)}>{children}</div>
    </li>
  )
}

function ItemListContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('min-w-0 flex-1', className)} {...props} />
}

export interface ItemListMenuProps {
  children: React.ReactNode
  /** Include the item name when possible, e.g. `Actions for ${name}` */
  ariaLabel?: string
  align?: 'start' | 'center' | 'end'
  className?: string
}

function ItemListMenu({
  children,
  ariaLabel = 'Item actions',
  align = 'end',
  className,
}: ItemListMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8 text-muted-foreground hover:text-foreground', itemListMenuClassName, className)}
          aria-label={ariaLabel}
        >
          <MoreVertical className="h-4 w-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-48">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ItemListEmpty({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p role="status" className={cn('py-4 text-center text-sm text-muted-foreground', className)} {...props} />
  )
}

function ItemListStatus({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(itemListStatusClassName, className)} {...props} />
}

export { ItemList, ItemListItem, ItemListContent, ItemListMenu, ItemListStatus, ItemListEmpty }
