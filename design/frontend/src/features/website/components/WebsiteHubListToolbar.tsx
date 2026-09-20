import { ListAddButton, ListFilterTrigger, SearchInput } from '@webonone/ui-kit'

/** Standard list-page search width (matches Tags and ui-kit showcase). */
export const WEBSITE_LIST_SEARCH_CLASS = 'w-64'

export const WEBSITE_LIST_PAGE_SIZE_OPTIONS = [12, 24, 48] as const

export type WebsiteHubListToolbarProps = {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  searchAriaLabel: string
  canManage?: boolean
  addLabel?: string
  onAdd?: () => void
  compactAddLabel?: string
  filterActive?: boolean
  onFilterOpen?: () => void
  filterAriaLabel?: string
}

/** Search → filter (optional) → add — consumed by `WebsiteHubTabs` → `ListPageActions`. */
export function WebsiteHubListToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
  canManage = false,
  addLabel,
  onAdd,
  compactAddLabel = 'Add',
  filterActive,
  onFilterOpen,
  filterAriaLabel = 'Filters',
}: WebsiteHubListToolbarProps) {
  return (
    <>
      <SearchInput
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        className={WEBSITE_LIST_SEARCH_CLASS}
        aria-label={searchAriaLabel}
        compactOnMobile
      />
      {onFilterOpen != null ? (
        <ListFilterTrigger
          active={filterActive ?? false}
          onClick={onFilterOpen}
          aria-label={filterAriaLabel}
        />
      ) : null}
      {canManage && addLabel && onAdd ? (
        <ListAddButton onClick={onAdd} compactLabel={compactAddLabel}>
          {addLabel}
        </ListAddButton>
      ) : null}
    </>
  )
}
