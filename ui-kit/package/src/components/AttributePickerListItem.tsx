import type { KeyboardEvent, ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '../lib/utils'
import { ItemListContent, ItemListItem, itemListRowActiveClassName } from './ItemList'

export type AttributePickerListItemProps = {
  name: string
  description?: string | null
  /** Already translated, for example "Number". */
  valueTypeLabel: string
  unit?: { name: string; symbol: string } | null
  /** Shown when the attribute has no unit, for example "No unit". */
  noUnitLabel: string
  extra?: string
  selected?: boolean
  onSelect?: () => void
  /** Replaces the selection check (Add, Delete, or a row menu). */
  trailing?: ReactNode
}

export function AttributePickerListItem({
  name,
  description,
  valueTypeLabel,
  unit,
  noUnitLabel,
  extra,
  selected = false,
  onSelect,
  trailing,
}: AttributePickerListItemProps) {
  const interactive = Boolean(onSelect)

  function handleKeyDown(event: KeyboardEvent<HTMLLIElement>) {
    if (!onSelect) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect()
    }
  }

  return (
    <ItemListItem
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={cn(interactive && 'cursor-pointer transition-colors', selected && itemListRowActiveClassName)}
      aria-label={name}
      aria-pressed={interactive ? selected : undefined}
      onClick={onSelect}
      onKeyDown={interactive ? handleKeyDown : undefined}
    >
      <ItemListContent>
        <p className="truncate font-medium">{name}</p>
        {description ? (
          <p className="truncate text-sm text-muted-foreground">{description}</p>
        ) : null}
        <p className="truncate text-sm text-muted-foreground">
          {valueTypeLabel}
          {unit ? ` · ${unit.name} (${unit.symbol})` : ` · ${noUnitLabel}`}
          {extra ? ` · ${extra}` : ''}
        </p>
      </ItemListContent>
      {trailing ??
        (selected ? (
          <Check className="ml-auto h-5 w-5 shrink-0 self-center text-primary" aria-hidden />
        ) : null)}
    </ItemListItem>
  )
}
