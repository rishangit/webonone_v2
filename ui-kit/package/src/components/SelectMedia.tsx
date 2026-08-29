import * as React from 'react'
import { ChevronDown, Image as ImageIcon } from 'lucide-react'
import { cn } from '../lib/utils'
import { AvatarGroup } from './AvatarGroup'

export interface SelectMediaValue {
  id: string
  url: string
  fileName: string
  mimeType: string
}

export interface SelectMediaProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  selectedItem?: SelectMediaValue | null
  selectedItems?: SelectMediaValue[]
  multiple?: boolean
  placeholder?: string
  /** Max thumbnails in the group stack before +N (default 4). */
  maxVisibleItems?: number
}

function getInitials(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '').trim()
  const parts = base.split(/[\s_-]+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  }
  return (base.slice(0, 2) || '?').toUpperCase()
}

function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

function toAvatarGroupUser(item: SelectMediaValue) {
  return {
    src: isImageMime(item.mimeType) ? item.url : null,
    fallback: getInitials(item.fileName),
    alt: `${item.fileName}-${item.id}`,
    name: item.fileName,
  }
}

const triggerClassName =
  'ui-shape-control flex w-full items-center gap-3 border border-input bg-background px-3 py-2 text-left text-sm transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

function SelectMedia({
  selectedItem,
  selectedItems = [],
  multiple = false,
  placeholder = 'Select media',
  maxVisibleItems = 4,
  className,
  type = 'button',
  disabled,
  'aria-label': ariaLabel,
  onClick,
  onKeyDown,
  ...props
}: SelectMediaProps) {
  const items = multiple ? selectedItems : selectedItem ? [selectedItem] : []
  const hasSelection = items.length > 0
  const primary = items[0]

  const resolvedAriaLabel =
    ariaLabel ??
    (multiple
      ? hasSelection
        ? `${items.length} media items selected`
        : placeholder
      : selectedItem
        ? `Selected ${selectedItem.fileName}`
        : placeholder)

  const content = hasSelection ? (
    multiple ? (
      <>
        <AvatarGroup users={items.map(toAvatarGroupUser)} size="sm" max={maxVisibleItems} />
        <span className="min-w-0 flex-1 truncate text-muted-foreground">
          {items.length === 1 ? items[0]!.fileName : `${items.length} items selected`}
        </span>
      </>
    ) : (
      <>
        {primary && isImageMime(primary.mimeType) ? (
          <img
            src={primary.url}
            alt={primary.fileName}
            className="h-8 w-8 shrink-0 rounded-md border border-border object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <ImageIcon className="h-4 w-4" aria-hidden />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{primary!.fileName}</p>
          <p className="truncate text-xs text-muted-foreground">{primary!.mimeType}</p>
        </div>
      </>
    )
  ) : (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <ImageIcon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 truncate text-muted-foreground">{placeholder}</span>
    </>
  )

  const chevron = <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />

  if (multiple && hasSelection) {
    return (
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-label={resolvedAriaLabel}
        className={cn(triggerClassName, className)}
        onClick={
          disabled
            ? undefined
            : (event) => onClick?.(event as unknown as React.MouseEvent<HTMLButtonElement>)
        }
        onKeyDown={(event) => {
          if (disabled) return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onClick?.(event as unknown as React.MouseEvent<HTMLButtonElement>)
          }
          onKeyDown?.(event as unknown as React.KeyboardEvent<HTMLButtonElement>)
        }}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      >
        {content}
        {chevron}
      </div>
    )
  }

  return (
    <button
      type={type}
      className={cn(triggerClassName, className)}
      disabled={disabled}
      aria-label={resolvedAriaLabel}
      onClick={onClick}
      onKeyDown={onKeyDown}
      {...props}
    >
      {content}
      {chevron}
    </button>
  )
}

export { SelectMedia }
