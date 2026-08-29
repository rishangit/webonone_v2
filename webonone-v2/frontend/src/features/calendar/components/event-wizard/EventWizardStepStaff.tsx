import {
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  itemListRowActiveClassName,
  itemListThumbClassName,
  SearchInput,
  cn,
} from '@webonone/ui-kit'
import { Check } from 'lucide-react'
import { formatWorkingDaysSummary } from '@/features/staff/schemas/staffSchemas'
import type { CompanyStaff } from '@/features/staff/types/staff.types'

type EventWizardStepStaffProps = {
  staff: CompanyStaff[]
  selectedId: string | null
  search: string
  onSearchChange: (value: string) => void
  onSelect: (staff: CompanyStaff) => void
  error?: string
}

export function EventWizardStepStaff({
  staff,
  selectedId,
  search,
  onSearchChange,
  onSelect,
  error,
}: EventWizardStepStaffProps) {
  const q = search.trim().toLowerCase()
  const filtered = q
    ? staff.filter(
        (s) =>
          s.displayName.toLowerCase().includes(q) ||
          (s.email?.toLowerCase().includes(q) ?? false),
      )
    : staff

  return (
    <div className="space-y-3">
      <SearchInput
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onClear={() => onSearchChange('')}
        placeholder="Search staff…"
        aria-label="Search staff"
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {filtered.length === 0 ? (
        <ItemListEmpty>No staff found. Add staff before creating events.</ItemListEmpty>
      ) : (
        <ItemList>
          {filtered.map((item) => {
            const active = item.id === selectedId
            return (
              <ItemListItem
                key={item.id}
                role="option"
                tabIndex={0}
                aria-selected={active}
                className={cn(
                  'cursor-pointer transition-colors',
                  active && itemListRowActiveClassName,
                )}
                aria-label={`Select ${item.displayName}`}
                onClick={() => onSelect(item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelect(item)
                  }
                }}
              >
                <ImagePreview
                  src={item.avatarUrl}
                  alt={item.displayName}
                  mode="view"
                  className={itemListThumbClassName}
                />
                <ItemListContent>
                  <p className="truncate font-medium">{item.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatWorkingDaysSummary(item.schedule)}
                  </p>
                </ItemListContent>
                {active ? (
                  <Check
                    className="ml-auto h-5 w-5 shrink-0 self-center text-primary"
                    aria-hidden
                  />
                ) : null}
              </ItemListItem>
            )
          })}
        </ItemList>
      )}
    </div>
  )
}
