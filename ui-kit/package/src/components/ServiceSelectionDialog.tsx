import { useCallback, useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { Alert, AlertDescription } from './Alert'
import { Button } from './Button'
import { CustomDialog } from './CustomDialog'
import { SearchInput } from './SearchInput'
import {
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  itemListRowActiveClassName,
} from './ItemList'
import { ImagePreview } from './ImagePreview'
import { Spinner } from './Spinner'
import { cn } from '../lib/utils'

export interface ServiceOption {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
}

export interface ServiceSelectionLoadParams {
  search: string
  page: number
  pageSize: number
}

export interface ServiceSelectionLoadResult {
  services: ServiceOption[]
  hasMore: boolean
}

export type LoadServicesFn = (
  params: ServiceSelectionLoadParams,
) => Promise<ServiceSelectionLoadResult>

export const SERVICE_SELECTION_DIALOG_SIZE = {
  sizeWidth: 'large' as const,
  sizeHeight: 'large' as const,
}

export interface ServiceSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (service: ServiceOption) => void
  loadServices: LoadServicesFn
  title?: string
  description?: string
  searchPlaceholder?: string
  pageSize?: number
  emptyMessage?: string
  id?: string
  /**
   * `dialog` — full CustomDialog with Cancel/Done footer (standalone).
   * `body` — list UI only for core-hosted peer-dialog iframe bodies.
   */
  chrome?: 'dialog' | 'body'
  /** Fires when the pending row selection changes (used by embed hosts for Done enablement). */
  onPendingChange?: (service: ServiceOption | null) => void
  /** Blocks overlay/Escape dismiss while a sibling dialog is open. */
  nestedDismissGuard?: boolean
}

const SEARCH_DEBOUNCE_MS = 300

export function ServiceSelectionDialog({
  open,
  onOpenChange,
  onSelect,
  loadServices,
  title = 'Select service',
  description,
  searchPlaceholder = 'Search services…',
  pageSize = 20,
  emptyMessage = 'No services found',
  id = 'service-selection-dialog',
  chrome = 'dialog',
  onPendingChange,
  nestedDismissGuard = false,
}: ServiceSelectionDialogProps) {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [services, setServices] = useState<ServiceOption[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openGeneration, setOpenGeneration] = useState(0)
  const [pendingSelection, setPendingSelection] = useState<ServiceOption | null>(null)

  const scrollRootRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const requestIdRef = useRef(0)
  const loadingRef = useRef(false)
  const prevOpenRef = useRef(false)

  const fetchPage = useCallback(
    async (targetPage: number, replace: boolean) => {
      if (loadingRef.current) {
        return
      }
      loadingRef.current = true

      const requestId = ++requestIdRef.current
      const isFirstPage = targetPage === 1

      if (isFirstPage) {
        setInitialLoading(true)
      } else {
        setLoadingMore(true)
      }
      setError(null)

      try {
        const result = await loadServices({
          search: debouncedSearch,
          page: targetPage,
          pageSize,
        })

        if (requestId !== requestIdRef.current) {
          return
        }

        setServices((prev) => (replace ? result.services : [...prev, ...result.services]))
        setPage(targetPage)
        setHasMore(result.hasMore)
      } catch (err) {
        if (requestId !== requestIdRef.current) {
          return
        }
        setError(err instanceof Error ? err.message : 'Failed to load services')
        if (replace) {
          setServices([])
          setHasMore(false)
        }
      } finally {
        loadingRef.current = false
        if (requestId === requestIdRef.current) {
          setInitialLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [debouncedSearch, loadServices, pageSize],
  )

  useEffect(() => {
    if (!open) {
      requestIdRef.current += 1
      prevOpenRef.current = false
      return
    }
    if (!prevOpenRef.current) {
      setSearchInput('')
      setDebouncedSearch('')
      setServices([])
      setPage(1)
      setHasMore(false)
      setError(null)
      setPendingSelection(null)
      setInitialLoading(false)
      setLoadingMore(false)
      requestIdRef.current += 1
      setOpenGeneration((value) => value + 1)
    }
    prevOpenRef.current = open
  }, [open])

  useEffect(() => {
    onPendingChange?.(pendingSelection)
  }, [onPendingChange, pendingSelection])

  useEffect(() => {
    if (!open) {
      return
    }
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [open, searchInput])

  useEffect(() => {
    if (!open) {
      return
    }
    void fetchPage(1, true)
  }, [open, openGeneration, debouncedSearch, fetchPage])

  useEffect(() => {
    if (!open || !hasMore || initialLoading || loadingMore || error) {
      return
    }

    const root = scrollRootRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void fetchPage(page + 1, false)
        }
      },
      { root, rootMargin: '120px', threshold: 0 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [open, hasMore, initialLoading, loadingMore, error, page, fetchPage])

  function handleRowActivate(service: ServiceOption) {
    setPendingSelection(service)
  }

  function handleDone() {
    if (!pendingSelection) {
      return
    }
    onSelect(pendingSelection)
    onOpenChange(false)
  }

  function handleRetry() {
    void fetchPage(1, true)
  }

  const showEmpty = !initialLoading && !error && services.length === 0

  const body = (
    <div className="flex h-full min-h-0 flex-col p-6">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder.replace(/…$/, '')}
          className="flex-1"
        />
      </div>

      <div
        ref={scrollRootRef}
        className="mt-4 min-h-[280px] flex-1 overflow-y-auto overscroll-y-contain scrollbar-themed"
      >
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {initialLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : null}

        {showEmpty ? <ItemListEmpty>{emptyMessage}</ItemListEmpty> : null}

        {!initialLoading && services.length > 0 ? (
          <ItemList className="py-2">
            {services.map((service) => {
              const isSelected = pendingSelection?.id === service.id
              return (
                <ItemListItem
                  key={service.id}
                  role="option"
                  tabIndex={0}
                  aria-selected={isSelected}
                  className={cn(
                    'cursor-pointer transition-colors hover:border-primary/40',
                    isSelected && itemListRowActiveClassName,
                  )}
                  aria-label={`Select ${service.name}`}
                  onClick={() => handleRowActivate(service)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handleRowActivate(service)
                    }
                  }}
                >
                  <ImagePreview
                    src={service.imageUrl ?? null}
                    alt={service.name}
                    mode="view"
                    className="h-12 w-12"
                  />
                  <ItemListContent>
                    <p className="truncate font-medium">{service.name}</p>
                    {service.description?.trim() ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {service.description}
                      </p>
                    ) : null}
                  </ItemListContent>
                  {isSelected ? (
                    <Check
                      className="ml-auto h-5 w-5 shrink-0 self-center text-primary"
                      aria-hidden
                    />
                  ) : null}
                </ItemListItem>
              )
            })}
          </ItemList>
        ) : null}

        {loadingMore ? (
          <div className="flex justify-center py-3">
            <Spinner size="sm" />
          </div>
        ) : null}

        <div ref={sentinelRef} className="h-1" aria-hidden />
      </div>
    </div>
  )

  if (chrome === 'body') {
    if (!open) {
      return null
    }
    return body
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      sizeWidth={SERVICE_SELECTION_DIALOG_SIZE.sizeWidth}
      sizeHeight={SERVICE_SELECTION_DIALOG_SIZE.sizeHeight}
      disableContentScroll
      noContentPadding
      nestedDismissGuard={nestedDismissGuard}
      id={id}
      footer={
        <>
          <Button variant="outline" className="h-10 px-4" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="h-10 px-4"
            onClick={handleDone}
            disabled={!pendingSelection}
          >
            Done
          </Button>
        </>
      }
    >
      {body}
    </CustomDialog>
  )
}
