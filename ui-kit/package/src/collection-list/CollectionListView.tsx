import { Fragment, type ReactNode } from 'react'
import { ItemList } from '../components/ItemList'
import { useListDisplayMode } from './ListDisplayModeContext'
import type { CollectionColumnDef, CollectionSortState } from './collectionListTypes'
import { ItemListCardGrid } from './ItemListCardGrid'
import { ItemListDataGrid } from './ItemListDataGrid'
import { useClientCollectionSort } from './useClientCollectionSort'

export interface CollectionListViewProps<T> {
  items: T[]
  getRowKey: (item: T) => string
  columns: CollectionColumnDef<T>[]
  renderListItem: (item: T) => ReactNode
  renderCard: (item: T) => ReactNode
  empty: ReactNode
  /** Optional external sort state; defaults to internal client sort on current page. */
  sort?: CollectionSortState
  onSortChange?: (next: CollectionSortState) => void
  getGridRowClassName?: (item: T) => string | undefined
  renderGridActions?: (item: T) => ReactNode
  gridActionsColumnHeader?: ReactNode
  listClassName?: string
  cardGridClassName?: string
  gridClassName?: string
}

export function CollectionListView<T>({
  items,
  getRowKey,
  columns,
  renderListItem,
  renderCard,
  empty,
  sort: sortProp,
  onSortChange,
  getGridRowClassName,
  renderGridActions,
  gridActionsColumnHeader,
  listClassName,
  cardGridClassName,
  gridClassName,
}: CollectionListViewProps<T>) {
  const mode = useListDisplayMode()
  const internalSort = useClientCollectionSort(items, columns)
  const sort = sortProp ?? internalSort.sort
  const sortedItems = sortProp !== undefined ? items : internalSort.sortedItems
  const toggleSort = onSortChange
    ? (columnId: string) => {
        const column = columns.find((col) => col.id === columnId)
        if (!column?.sortable) return
        if (sort?.columnId !== columnId) {
          onSortChange({ columnId, direction: 'asc' })
          return
        }
        if (sort.direction === 'asc') {
          onSortChange({ columnId, direction: 'desc' })
          return
        }
        onSortChange(null)
      }
    : internalSort.toggleSort

  const rows = Array.isArray(sortedItems) ? sortedItems : []

  if (rows.length === 0) {
    return empty
  }

  if (mode === 'grid') {
    return (
      <ItemListDataGrid
        items={rows}
        columns={columns}
        getRowKey={getRowKey}
        sort={sort}
        onToggleSort={toggleSort}
        getRowClassName={getGridRowClassName}
        className={gridClassName}
        renderActions={renderGridActions}
        actionsColumnHeader={gridActionsColumnHeader}
      />
    )
  }

  if (mode === 'card') {
    return (
      <ItemListCardGrid className={cardGridClassName}>
        {rows.map((item) => (
          <Fragment key={getRowKey(item)}>{renderCard(item)}</Fragment>
        ))}
      </ItemListCardGrid>
    )
  }

  return (
    <ItemList className={listClassName}>
      {rows.map((item) => (
        <Fragment key={getRowKey(item)}>{renderListItem(item)}</Fragment>
      ))}
    </ItemList>
  )
}
