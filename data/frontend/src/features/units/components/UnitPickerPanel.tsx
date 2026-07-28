import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { Check, Plus } from 'lucide-react'
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
import type { Unit } from '@/shared/types/data.types'

export type UnitSelectValue = {
  id: string
  name: string
  symbol: string
}

const SEARCH_DEBOUNCE_MS = 300
const PAGE_SIZE = 20

function toPickerUnit(unit: Unit | UnitSelectValue): UnitSelectValue {
  return { id: unit.id, name: unit.name, symbol: unit.symbol }
}

export type UnitPickerPanelProps = {
  enabled: boolean
  selectedUnit: UnitSelectValue | null
  onSelectionChange: (unit: UnitSelectValue | null) => void
  onCreateRequest?: () => void
}

export function UnitPickerPanel({
  enabled,
  selectedUnit,
  onSelectionChange,
  onCreateRequest,
}: UnitPickerPanelProps) {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const role = useAppSelector((s) => s.auth.user?.role)
  const canLoadUnits = enabled && Boolean(accessToken)
  const canCreate =
    Boolean(onCreateRequest) && (role === 'super_admin' || role === 'company_admin')

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [units, setUnits] = useState<Unit[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scrollRootRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const requestIdRef = useRef(0)
  const loadingRef = useRef(false)

  const fetchPage = useCallback(
    async (targetPage: number, replace: boolean) => {
      if (!canLoadUnits || loadingRef.current) {
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
        const response = await dataApi.listUnits({
          q: debouncedSearch,
          page: targetPage,
          pageSize: PAGE_SIZE,
        })
        if (requestId !== requestIdRef.current) {
          return
        }

        setUnits((prev) => (replace ? response.items : [...prev, ...response.items]))
        setPage(targetPage)
        setHasMore(targetPage * response.pageSize < response.total)
      } catch (err) {
        if (requestId !== requestIdRef.current) {
          return
        }
        setError(err instanceof Error ? err.message : 'Failed to load units')
        if (replace) {
          setUnits([])
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
    [canLoadUnits, debouncedSearch],
  )

  useEffect(() => {
    if (!canLoadUnits) {
      return
    }
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [canLoadUnits, searchInput])

  useEffect(() => {
    if (!canLoadUnits) {
      return
    }
    void fetchPage(1, true)
  }, [canLoadUnits, debouncedSearch, fetchPage])

  useEffect(() => {
    if (!canLoadUnits || !hasMore || initialLoading || loadingMore || error) {
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
  }, [canLoadUnits, hasMore, initialLoading, loadingMore, error, page, fetchPage])

  const visibleUnits = useMemo(() => {
    const listed = units.map(toPickerUnit)
    if (!selectedUnit) {
      return listed
    }
    const listedIds = new Set(listed.map((unit) => unit.id))
    return listedIds.has(selectedUnit.id) ? listed : [selectedUnit, ...listed]
  }, [selectedUnit, units])

  function handleSelect(unit: UnitSelectValue) {
    onSelectionChange(unit)
  }

  if (!accessToken) {
    return (
      <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center gap-3 p-6">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Waiting for authentication…</p>
      </div>
    )
  }

  const showEmpty = !initialLoading && !error && visibleUnits.length === 0

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col p-6">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={searchInput}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchInput(event.target.value)}
          placeholder="Search units"
          aria-label="Search units"
          className="flex-1"
        />
        {canCreate ? (
          <Button variant="outline" className="shrink-0 gap-2" onClick={onCreateRequest}>
            <Plus className="h-4 w-4" aria-hidden />
            Add new unit
          </Button>
        ) : null}
      </div>

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

        {!initialLoading ? (
          <ItemList>
            <ItemListItem
              role="button"
              tabIndex={0}
              className={cn(
                'cursor-pointer transition-colors',
                selectedUnit === null && itemListRowActiveClassName,
              )}
              aria-label="Select no unit"
              aria-pressed={selectedUnit === null}
              onClick={() => onSelectionChange(null)}
              onKeyDown={(event: KeyboardEvent<HTMLLIElement>) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelectionChange(null)
                }
              }}
            >
              <ItemListContent>
                <p className="truncate font-medium">None</p>
                <p className="truncate text-sm text-muted-foreground">No unit of measure</p>
              </ItemListContent>
              {selectedUnit === null ? (
                <Check
                  className="ml-auto h-5 w-5 shrink-0 self-center text-primary"
                  aria-hidden
                />
              ) : null}
            </ItemListItem>
            {showEmpty ? (
              <ItemListEmpty>No units found.</ItemListEmpty>
            ) : (
              visibleUnits.map((unit) => {
                const isSelected = selectedUnit?.id === unit.id
                return (
                  <ItemListItem
                    key={unit.id}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      'cursor-pointer transition-colors',
                      isSelected && itemListRowActiveClassName,
                    )}
                    aria-label={`Select ${unit.name}`}
                    aria-pressed={isSelected}
                    onClick={() => handleSelect(unit)}
                    onKeyDown={(event: KeyboardEvent<HTMLLIElement>) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        handleSelect(unit)
                      }
                    }}
                  >
                    <ItemListContent>
                      <p className="truncate font-medium">{unit.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{unit.symbol}</p>
                    </ItemListContent>
                    {isSelected ? (
                      <Check
                        className="ml-auto h-5 w-5 shrink-0 self-center text-primary"
                        aria-hidden
                      />
                    ) : null}
                  </ItemListItem>
                )
              })
            )}
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
