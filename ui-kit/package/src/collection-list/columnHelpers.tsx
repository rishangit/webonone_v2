import type { ReactNode } from 'react'
import type { CollectionColumnDef } from './collectionListTypes'

export function textSortColumn<T>(
  id: string,
  header: string,
  getValue: (item: T) => string,
  options?: { className?: string; headerClassName?: string },
): CollectionColumnDef<T> {
  const compare = (a: T, b: T) =>
    getValue(a).localeCompare(getValue(b), undefined, { sensitivity: 'base' })
  return {
    id,
    header,
    sortable: true,
    compare,
    cell: (item) => getValue(item),
    className: options?.className,
    headerClassName: options?.headerClassName,
  }
}

export function minimalEntityColumns<T>(options: {
  nameHeader: string
  getName: (item: T) => string
  onNameClick?: (item: T) => void
  statusHeader?: string
  renderStatus?: (item: T) => ReactNode
}): CollectionColumnDef<T>[] {
  const columns: CollectionColumnDef<T>[] = [
    {
      id: 'name',
      header: options.nameHeader,
      sortable: true,
      compare: (a, b) =>
        options.getName(a).localeCompare(options.getName(b), undefined, { sensitivity: 'base' }),
      cell: (item) =>
        options.onNameClick ? (
          <button
            type="button"
            className="rounded-md text-left font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => options.onNameClick?.(item)}
          >
            {options.getName(item)}
          </button>
        ) : (
          options.getName(item)
        ),
    },
  ]
  if (options.statusHeader && options.renderStatus) {
    columns.push({
      id: 'status',
      header: options.statusHeader,
      cell: (item) => options.renderStatus!(item),
    })
  }
  return columns
}

export function dateSortColumn<T>(
  id: string,
  header: string,
  getIso: (item: T) => string | null | undefined,
  format: (iso: string) => string,
  options?: { className?: string; headerClassName?: string },
): CollectionColumnDef<T> {
  const compare = (a: T, b: T) => {
    const ta = getIso(a) ? Date.parse(getIso(a)!) : 0
    const tb = getIso(b) ? Date.parse(getIso(b)!) : 0
    return ta - tb
  }
  return {
    id,
    header,
    sortable: true,
    compare,
    cell: (item) => {
      const iso = getIso(item)
      return iso ? format(iso) : '—'
    },
    className: options?.className,
    headerClassName: options?.headerClassName,
  }
}
