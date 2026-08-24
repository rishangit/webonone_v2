import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  SearchInput,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  itemListRowActiveClassName,
  ImagePreview,
  Spinner,
  cn,
} from '@webonone/ui-kit'

export type SelectionOption = {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
}

export type SelectionLoadParams = {
  search: string
  page: number
  pageSize: number
}

export type SelectionLoadResult = {
  items: SelectionOption[]
  hasMore: boolean
}

export type LoadSelectionOptionsFn = (params: SelectionLoadParams) => Promise<SelectionLoadResult>

export const OPTION_SELECTION_DIALOG_SIZE = {
  sizeWidth: 'large' as const,
  sizeHeight: 'large' as const,
}

type OptionSelectionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (selected: SelectionOption[]) => void
  loadOptions: LoadSelectionOptionsFn
  title: string
  description?: string
  searchPlaceholder: string
  emptyMessage: string
  multiple?: boolean
  initialSelected?: SelectionOption[]
  nestedDismissGuard?: boolean
  showImage?: boolean
}

const SEARCH_DEBOUNCE_MS = 300

export function OptionSelectionDialog({
  open,
  onOpenChange,
  onSelect,
  loadOptions,
  title,
  description,
  searchPlaceholder,
  emptyMessage,
  multiple = false,
  initialSelected = [],
  nestedDismissGuard = false,
  showImage = false,
}: OptionSelectionDialogProps) {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [items, setItems] = useState<SelectionOption[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openGeneration, setOpenGeneration] = useState(0)
  const [pending, setPending] = useState<SelectionOption[]>([])

  const scrollRootRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const requestIdRef = useRef(0)
  const loadingRef = useRef(false)
  const prevOpenRef = useRef(false)

  const pendingIds = useMemo(() => new Set(pending.map((item) => item.id)), [pending])

  const fetchPage = useCallback(
    async (targetPage: number, replace: boolean) => {
      if (loadingRef.current) return
      loadingRef.current = true
      const requestId = ++requestIdRef.current
      const isFirstPage = targetPage === 1
      if (isFirstPage) setInitialLoading(true)
      else setLoadingMore(true)
      setError(null)
      try {
        const result = await loadOptions({
          search: debouncedSearch,
          page: targetPage,
          pageSize: 20,
        })
        if (requestId !== requestIdRef.current) return
        setItems((prev) => (replace ? result.items : [...prev, ...result.items]))
        setPage(targetPage)
        setHasMore(result.hasMore)
      } catch (err) {
        if (requestId !== requestIdRef.current) return
        setError(err instanceof Error ? err.message : 'Failed to load')
        if (replace) {
          setItems([])
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
    [debouncedSearch, loadOptions],
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
      setItems([])
      setPage(1)
      setHasMore(false)
      setError(null)
      setPending(initialSelected)
      setInitialLoading(false)
      setLoadingMore(false)
      requestIdRef.current += 1
      setOpenGeneration((value) => value + 1)
    }
    prevOpenRef.current = open
  }, [initialSelected, open])

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [open, searchInput])

  useEffect(() => {
    if (!open) return
    void fetchPage(1, true)
  }, [fetchPage, open, openGeneration, debouncedSearch])

  useEffect(() => {
    if (!open || !hasMore || initialLoading || loadingMore || error) return
    const root = scrollRootRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel) return
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
  }, [error, fetchPage, hasMore, initialLoading, loadingMore, open, page])

  function handleActivate(option: SelectionOption) {
    if (!multiple) {
      setPending([option])
      return
    }
    setPending((prev) =>
      prev.some((item) => item.id === option.id)
        ? prev.filter((item) => item.id !== option.id)
        : [...prev, option],
    )
  }

  function handleDone() {
    if (!multiple && pending.length === 0) return
    onSelect(pending)
    onOpenChange(false)
  }

  const showEmpty = !initialLoading && !error && items.length === 0

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      sizeWidth={OPTION_SELECTION_DIALOG_SIZE.sizeWidth}
      sizeHeight={OPTION_SELECTION_DIALOG_SIZE.sizeHeight}
      disableContentScroll
      noContentPadding
      nestedDismissGuard={nestedDismissGuard}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="h-10 px-4"
            onClick={handleDone}
            disabled={!multiple && pending.length === 0}
          >
            Done{multiple && pending.length > 0 ? ` (${pending.length})` : ''}
          </Button>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-col p-6">
        <SearchInput
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder.replace(/…$/, '')}
        />
        <div
          ref={scrollRootRef}
          className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-y-contain scrollbar-themed"
        >
          {error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={() => void fetchPage(1, true)}>
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
          {!initialLoading && items.length > 0 ? (
            <ItemList>
              {items.map((option) => {
                const isSelected = pendingIds.has(option.id)
                return (
                  <ItemListItem
                    key={option.id}
                    role="option"
                    tabIndex={0}
                    aria-selected={isSelected}
                    className={cn(
                      'cursor-pointer transition-colors',
                      isSelected && itemListRowActiveClassName,
                    )}
                    aria-label={`Select ${option.name}`}
                    onClick={() => handleActivate(option)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        handleActivate(option)
                      }
                    }}
                  >
                    {showImage ? (
                      <ImagePreview
                        src={option.imageUrl ?? null}
                        alt={option.name}
                        mode="view"
                        className="h-12 w-12"
                      />
                    ) : null}
                    <ItemListContent>
                      <p className="truncate font-medium">{option.name}</p>
                      {option.description?.trim() ? (
                        <p className="truncate text-xs text-muted-foreground">{option.description}</p>
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
    </CustomDialog>
  )
}
