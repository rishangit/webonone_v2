import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { Check } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  SearchInput,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  itemListRowActiveClassName,
  Spinner,
  cn,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { dataApi } from '@/shared/services/dataApi'
import type { CatalogItem, EntityStatus } from '@/shared/types/data.types'

export type SpaceSelectValue = {
  id: string
  name: string
  description: string | null
  status: EntityStatus
}

const SEARCH_DEBOUNCE_MS = 300
const PAGE_SIZE = 20

export function toSpaceSelectValue(space: CatalogItem | SpaceSelectValue): SpaceSelectValue {
  return {
    id: space.id,
    name: space.name,
    description: space.description ?? null,
    status: space.status,
  }
}

export type SpacePickerPanelProps = {
  enabled: boolean
  selectedSpaces: SpaceSelectValue[]
  onSelectionChange: (spaces: SpaceSelectValue[]) => void
  excludedIds?: string[]
}

export function SpacePickerPanel({
  enabled,
  selectedSpaces,
  onSelectionChange,
  excludedIds,
}: SpacePickerPanelProps) {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const canLoad = enabled && Boolean(accessToken)

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [spaces, setSpaces] = useState<CatalogItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scrollRootRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const requestIdRef = useRef(0)
  const loadingRef = useRef(false)

  const selectedIds = useMemo(
    () => new Set(selectedSpaces.map((space) => space.id)),
    [selectedSpaces],
  )
  const excludedIdSet = useMemo(() => new Set(excludedIds ?? []), [excludedIds])

  const fetchPage = useCallback(
    async (targetPage: number, replace: boolean) => {
      if (!canLoad || loadingRef.current) {
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
        const response = await dataApi.listSpaces({
          q: debouncedSearch,
          page: targetPage,
          pageSize: PAGE_SIZE,
        })
        if (requestId !== requestIdRef.current) {
          return
        }

        setSpaces((prev) => (replace ? response.items : [...prev, ...response.items]))
        setPage(targetPage)
        setHasMore(targetPage * response.pageSize < response.total)
      } catch (err) {
        if (requestId !== requestIdRef.current) {
          return
        }
        setError(err instanceof Error ? err.message : 'Failed to load spaces')
        if (replace) {
          setSpaces([])
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
    [canLoad, debouncedSearch],
  )

  useEffect(() => {
    if (!canLoad) {
      return
    }
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [canLoad, searchInput])

  useEffect(() => {
    if (!canLoad) {
      return
    }
    void fetchPage(1, true)
  }, [canLoad, debouncedSearch, fetchPage])

  useEffect(() => {
    if (!canLoad || !hasMore || initialLoading || loadingMore || error) {
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
  }, [canLoad, hasMore, initialLoading, loadingMore, error, page, fetchPage])

  const visibleSpaces = useMemo(() => {
    const listed = spaces
      .map(toSpaceSelectValue)
      .filter((space) => !excludedIdSet.has(space.id))
    if (selectedSpaces.length === 0) {
      return listed
    }
    const listedIds = new Set(listed.map((space) => space.id))
    const missingSelected = selectedSpaces.filter(
      (space) => !listedIds.has(space.id) && !excludedIdSet.has(space.id),
    )
    return missingSelected.length > 0 ? [...missingSelected, ...listed] : listed
  }, [selectedSpaces, spaces, excludedIdSet])

  function handleToggle(space: SpaceSelectValue) {
    const next = selectedIds.has(space.id)
      ? selectedSpaces.filter((entry) => entry.id !== space.id)
      : [...selectedSpaces, space]
    onSelectionChange(next)
  }

  if (!accessToken) {
    return (
      <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center gap-3 p-6">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Waiting for authentication…</p>
      </div>
    )
  }

  const showEmpty = !initialLoading && !error && visibleSpaces.length === 0

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col p-6">
      <SearchInput
        value={searchInput}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchInput(event.target.value)}
        placeholder="Search spaces"
        aria-label="Search spaces"
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

        {showEmpty ? <ItemListEmpty>No spaces found.</ItemListEmpty> : null}

        {!initialLoading && visibleSpaces.length > 0 ? (
          <ItemList>
            {visibleSpaces.map((space) => {
              const isSelected = selectedIds.has(space.id)
              return (
                <ItemListItem
                  key={space.id}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'cursor-pointer transition-colors',
                    isSelected && itemListRowActiveClassName,
                  )}
                  aria-label={`Toggle ${space.name}`}
                  aria-pressed={isSelected}
                  onClick={() => handleToggle(space)}
                  onKeyDown={(event: KeyboardEvent<HTMLLIElement>) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handleToggle(space)
                    }
                  }}
                >
                  <ItemListContent>
                    <p className="truncate font-medium">{space.name}</p>
                    {space.description ? (
                      <p className="truncate text-sm text-muted-foreground">{space.description}</p>
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
}
