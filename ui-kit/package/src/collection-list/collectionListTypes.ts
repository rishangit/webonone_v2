import type { ReactNode } from 'react'

export type CollectionSortDirection = 'asc' | 'desc'

export type CollectionSortState = {
  columnId: string
  direction: CollectionSortDirection
} | null

export type CollectionColumnDef<T> = {
  id: string
  header: ReactNode
  sortable?: boolean
  compare?: (a: T, b: T) => number
  cell: (item: T) => ReactNode
  className?: string
  headerClassName?: string
}
