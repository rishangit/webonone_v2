import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from './Button'
import { Label } from './Label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './Select'

export interface PaginationProps {
  totalCount: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
  hideWhenSinglePage?: boolean
  siblingCount?: number
  className?: string
  id?: string
}

const DEFAULT_PAGE_SIZE_OPTIONS = [12, 24, 48]

function range(start: number, end: number): number[] {
  const length = end - start + 1
  return Array.from({ length }, (_, index) => start + index)
}

function getVisiblePages(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
): Array<number | 'ellipsis'> {
  if (totalPages <= 0) {
    return []
  }

  const totalPageNumbers = siblingCount * 2 + 5

  if (totalPageNumbers >= totalPages) {
    return range(1, totalPages)
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages)
  const shouldShowLeftEllipsis = leftSiblingIndex > 2
  const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 1

  if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
    const leftItemCount = 3 + 2 * siblingCount
    return [...range(1, leftItemCount), 'ellipsis', totalPages]
  }

  if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
    const rightItemCount = 3 + 2 * siblingCount
    return [1, 'ellipsis', ...range(totalPages - rightItemCount + 1, totalPages)]
  }

  if (shouldShowLeftEllipsis && shouldShowRightEllipsis) {
    return [
      1,
      'ellipsis',
      ...range(leftSiblingIndex, rightSiblingIndex),
      'ellipsis',
      totalPages,
    ]
  }

  return range(1, totalPages)
}

function Pagination({
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  hideWhenSinglePage = true,
  siblingCount = 2,
  className,
  id,
}: PaginationProps) {
  const safePageSize = Math.max(1, pageSize)
  const totalPages = totalCount === 0 ? 0 : Math.max(1, Math.ceil(totalCount / safePageSize))
  const safeCurrentPage =
    totalPages === 0 ? 1 : Math.min(Math.max(1, currentPage), totalPages)

  const start = totalCount === 0 ? 0 : (safeCurrentPage - 1) * safePageSize + 1
  const end = totalCount === 0 ? 0 : Math.min(safeCurrentPage * safePageSize, totalCount)

  const summary =
    totalCount === 0
      ? 'Showing 0 of 0'
      : `Showing ${start}–${end} of ${totalCount}`

  const showControls = !(hideWhenSinglePage && totalPages <= 1)
  const visiblePages = getVisiblePages(safeCurrentPage, totalPages, siblingCount)
  const pageSizeId = id ? `${id}-page-size` : 'pagination-page-size'

  const pageSizeControl = onPageSizeChange ? (
    <div className="flex items-center gap-2">
      <Label htmlFor={pageSizeId} className="shrink-0">
        Rows per page
      </Label>
      <Select
        value={String(safePageSize)}
        onValueChange={(value) => onPageSizeChange(Number(value))}
      >
        <SelectTrigger id={pageSizeId} className="w-[5.5rem]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {pageSizeOptions.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ) : null

  const navControls = showControls ? (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 overflow-x-auto sm:justify-start"
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        aria-label="First page"
        disabled={safeCurrentPage <= 1}
        onClick={() => onPageChange(1)}
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        aria-label="Previous page"
        disabled={safeCurrentPage <= 1}
        onClick={() => onPageChange(safeCurrentPage - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {visiblePages.map((page, index) =>
        page === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground"
            aria-hidden
          >
            <MoreHorizontal className="h-4 w-4" />
          </span>
        ) : (
          <Button
            key={page}
            type="button"
            variant={page === safeCurrentPage ? 'default' : 'outline'}
            size="icon"
            className="h-9 w-9 shrink-0"
            aria-label={`Page ${page}`}
            aria-current={page === safeCurrentPage ? 'page' : undefined}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ),
      )}

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        aria-label="Next page"
        disabled={safeCurrentPage >= totalPages}
        onClick={() => onPageChange(safeCurrentPage + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        aria-label="Last page"
        disabled={safeCurrentPage >= totalPages}
        onClick={() => onPageChange(totalPages)}
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </nav>
  ) : null

  return (
    <div id={id} className={cn('shrink-0 pb-4 sm:pb-6', className)}>
      <div className="flex flex-col gap-3 sm:hidden">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{summary}</p>
          {showControls ? pageSizeControl : null}
        </div>
        {navControls}
      </div>

      <div className="hidden sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p className="text-sm text-muted-foreground">{summary}</p>
        {showControls ? (
          <div className="flex flex-row items-center gap-4">
            {pageSizeControl}
            {navControls}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export { Pagination }
