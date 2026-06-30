import * as React from 'react'
import { MoreVertical } from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from './Button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './DropdownMenu'

/** List container — vertical padding and small gap between separate row cards */
export const itemListClassName = 'flex flex-col gap-2 py-4'

/** Shared row padding, glass surface, small themed shadow on hover */
export const itemListRowClassName =
  'group flex items-start gap-3 rounded-lg glass-card item-list-row px-3 py-2 text-sm text-foreground'

/** 3-dot menu trigger — top-right of the row */
export const itemListMenuClassName = 'shrink-0 self-start'

/** Selected / active row — stronger border, no theme fill */
export const itemListRowActiveClassName = 'border-primary'

function ItemList({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul role="list" className={cn(itemListClassName, className)} {...props} />
}

function ItemListItem({ className, ...props }: React.LiHTMLAttributes<HTMLLIElement>) {
  return <li className={cn(itemListRowClassName, className)} {...props} />
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
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}

export { ItemList, ItemListItem, ItemListContent, ItemListMenu, ItemListEmpty }
