import {
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  itemListRowActiveClassName,
  SearchInput,
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
                className={active ? itemListRowActiveClassName : undefined}
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-2 text-left"
                  onClick={() => onSelect(item)}
                >
                  <ItemListContent>
                    <p className="font-medium">{item.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatWorkingDaysSummary(item.schedule)}
                    </p>
                  </ItemListContent>
                  {active ? <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden /> : null}
                </button>
              </ItemListItem>
            )
          })}
        </ItemList>
      )}
    </div>
  )
}
