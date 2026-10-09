import * as React from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from '../components/Button'
import type { CollectionColumnDef, CollectionSortState } from './collectionListTypes'

export const itemListDataGridShellClassName =
  'w-full overflow-x-auto py-4 scrollbar-themed'

export const itemListDataGridTableClassName =
  'w-full min-w-[32rem] border-collapse text-sm text-foreground'

export const itemListDataGridHeaderRowClassName =
  'border-b border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))]'

export const itemListDataGridHeaderCellClassName =
  'px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground'

export const itemListDataGridRowClassName =
  'border-b border-[hsl(var(--glass-border))] transition-colors hover:bg-[hsl(var(--glass-bg)/0.6)]'

export const itemListDataGridCellClassName = 'px-3 py-2 align-top'

export interface ItemListDataGridProps<T> {
  items: T[]
  columns: CollectionColumnDef<T>[]
  getRowKey: (item: T) => string
  sort: CollectionSortState
  onToggleSort: (columnId: string) => void
  getRowClassName?: (item: T) => string | undefined
  className?: string
  actionsColumnHeader?: React.ReactNode
  renderActions?: (item: T) => React.ReactNode
}

function sortAriaValue(
  sort: CollectionSortState,
  columnId: string,
): 'ascending' | 'descending' | 'none' {
  if (sort?.columnId !== columnId) return 'none'
  return sort.direction === 'asc' ? 'ascending' : 'descending'
}

function SortIcon({ sort, columnId }: { sort: CollectionSortState; columnId: string }) {
  if (sort?.columnId !== columnId) {
    return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 opacity-50" aria-hidden />
  }
  if (sort.direction === 'asc') {
    return <ArrowUp className="ml-1 inline h-3.5 w-3.5" aria-hidden />
  }
  return <ArrowDown className="ml-1 inline h-3.5 w-3.5" aria-hidden />
}

export function ItemListDataGrid<T>({
  items,
  columns,
  getRowKey,
  sort,
  onToggleSort,
  getRowClassName,
  className,
  actionsColumnHeader = 'Actions',
  renderActions,
}: ItemListDataGridProps<T>) {
  const showActions = Boolean(renderActions)

  return (
    <div className={cn(itemListDataGridShellClassName, className)}>
      <table className={itemListDataGridTableClassName}>
        <thead>
          <tr className={itemListDataGridHeaderRowClassName}>
            {columns.map((column) => {
              const sortable = Boolean(column.sortable && column.compare)
              return (
                <th
                  key={column.id}
                  scope="col"
                  className={cn(itemListDataGridHeaderCellClassName, column.headerClassName, column.className)}
                  aria-sort={sortable ? sortAriaValue(sort, column.id) : undefined}
                >
                  {sortable ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="-ml-2 h-auto px-2 py-1 font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
                      onClick={() => onToggleSort(column.id)}
                    >
                      {column.header}
                      <SortIcon sort={sort} columnId={column.id} />
                    </Button>
                  ) : (
                    column.header
                  )}
                </th>
              )
            })}
            {showActions ? (
              <th scope="col" className={cn(itemListDataGridHeaderCellClassName, 'text-right')}>
                {actionsColumnHeader}
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={getRowKey(item)}
              className={cn(itemListDataGridRowClassName, getRowClassName?.(item))}
            >
              {columns.map((column) => (
                <td
                  key={column.id}
                  className={cn(itemListDataGridCellClassName, column.className)}
                >
                  {column.cell(item)}
                </td>
              ))}
              {showActions ? (
                <td className={cn(itemListDataGridCellClassName, 'text-right')}>
                  {renderActions?.(item)}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
