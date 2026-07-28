import * as React from 'react'
import { ChevronDown, Tag as TagIcon } from 'lucide-react'
import { TagChip } from './TagChip'
import { cn } from '../lib/utils'

export interface SelectTagValue {
  id: string
  name: string
  color: string
}

export interface SelectTagProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  selectedTag?: SelectTagValue | null
  selectedTags?: SelectTagValue[]
  multiple?: boolean
  placeholder?: string
  /** Max chips shown before collapsing into a +N badge (default 4). */
  maxVisibleTags?: number
}

const triggerClassName =
  'flex w-full items-center gap-3 rounded-md border border-input bg-background px-3 py-2 text-left text-sm transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

function SelectTag({
  selectedTag,
  selectedTags = [],
  multiple = false,
  placeholder = 'Select tag',
  maxVisibleTags = 4,
  className,
  type = 'button',
  disabled,
  'aria-label': ariaLabel,
  onClick,
  onKeyDown,
  ...props
}: SelectTagProps) {
  const tags = multiple ? selectedTags : selectedTag ? [selectedTag] : []
  const hasSelection = tags.length > 0

  const resolvedAriaLabel =
    ariaLabel ??
    (multiple
      ? hasSelection
        ? `${tags.length} tags selected`
        : placeholder
      : selectedTag
        ? `Selected tag ${selectedTag.name}`
        : placeholder)

  const visibleTags = tags.slice(0, maxVisibleTags)
  const overflowCount = tags.length - visibleTags.length

  const content = hasSelection ? (
    <>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {visibleTags.map((tag) => (
          <TagChip key={tag.id} name={tag.name} color={tag.color} />
        ))}
        {overflowCount > 0 ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            +{overflowCount}
          </span>
        ) : null}
      </div>
    </>
  ) : (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <TagIcon className="h-4 w-4" />
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

export { SelectTag }
