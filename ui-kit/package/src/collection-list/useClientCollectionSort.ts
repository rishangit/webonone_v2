import { useMemo, useState } from 'react'
import type { CollectionColumnDef, CollectionSortState } from './collectionListTypes'

/**
 * Client-side sort for the current page of items only (not server-wide collections).
 */
export function useClientCollectionSort<T>(
  items: T[],
  columns: CollectionColumnDef<T>[],
): {
  sort: CollectionSortState
  setSort: (next: CollectionSortState) => void
  toggleSort: (columnId: string) => void
  sortedItems: T[]
} {
  const [sort, setSort] = useState<CollectionSortState>(null)

  const sortedItems = useMemo(() => {
    if (!sort) return items
    const column = columns.find((col) => col.id === sort.columnId)
    if (!column?.compare) return items
    const sorted = [...items].sort(column.compare)
    if (sort.direction === 'desc') sorted.reverse()
    return sorted
  }, [columns, items, sort])

  function toggleSort(columnId: string) {
    const column = columns.find((col) => col.id === columnId)
    if (!column?.sortable) return

    setSort((prev) => {
      if (prev?.columnId !== columnId) {
        return { columnId, direction: 'asc' }
      }
      if (prev.direction === 'asc') {
        return { columnId, direction: 'desc' }
      }
      return null
    })
  }

  return { sort, setSort, toggleSort, sortedItems }
}
