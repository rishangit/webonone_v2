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
import type { Attribute, AttributeUnitSummary } from '@/shared/types/data.types'

export type AttributeSelectValue = {
  id: string
  name: string
  valueType: 'number' | 'text'
  unit: AttributeUnitSummary | null
}

const SEARCH_DEBOUNCE_MS = 300
const PAGE_SIZE = 20

function toPickerAttribute(attribute: Attribute | AttributeSelectValue): AttributeSelectValue {
  return {
    id: attribute.id,
    name: attribute.name,
    valueType: attribute.valueType,
    unit: attribute.unit ?? null,
  }
}

export type AttributePickerPanelProps = {
  enabled: boolean
  multiple?: boolean
  selectedAttributes: AttributeSelectValue[]
  onSelectionChange: (attributes: AttributeSelectValue[]) => void
  onCreateRequest?: () => void
  /** Attribute ids already on the product — hidden from the add picker. */
  excludedIds?: string[]
}

export function AttributePickerPanel({
  enabled,
  multiple = true,
  selectedAttributes,
  onSelectionChange,
  onCreateRequest,
  excludedIds,
}: AttributePickerPanelProps) {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const role = useAppSelector((s) => s.auth.user?.role)
  const canLoadAttributes = enabled && Boolean(accessToken)
  const canCreate =
    Boolean(onCreateRequest) && (role === 'super_admin' || role === 'company_admin')

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scrollRootRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const requestIdRef = useRef(0)
  const loadingRef = useRef(false)

  const selectedAttributeIds = useMemo(
    () => new Set(selectedAttributes.map((attribute) => attribute.id)),
    [selectedAttributes],
  )

  const excludedAttributeIds = useMemo(() => new Set(excludedIds ?? []), [excludedIds])

  const fetchPage = useCallback(
    async (targetPage: number, replace: boolean) => {
      if (!canLoadAttributes || loadingRef.current) {
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
        const response = await dataApi.listAttributes({
          q: debouncedSearch,
          page: targetPage,
          pageSize: PAGE_SIZE,
        })
        if (requestId !== requestIdRef.current) {
          return
        }

        setAttributes((prev) => (replace ? response.items : [...prev, ...response.items]))
        setPage(targetPage)
        setHasMore(targetPage * response.pageSize < response.total)
      } catch (err) {
        if (requestId !== requestIdRef.current) {
          return
        }
        setError(err instanceof Error ? err.message : 'Failed to load attributes')
        if (replace) {
          setAttributes([])
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
    [canLoadAttributes, debouncedSearch],
  )

  useEffect(() => {
    if (!canLoadAttributes) {
      return
    }
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [canLoadAttributes, searchInput])

  useEffect(() => {
    if (!canLoadAttributes) {
      return
    }
    void fetchPage(1, true)
  }, [canLoadAttributes, debouncedSearch, fetchPage])

  useEffect(() => {
    if (!canLoadAttributes || !hasMore || initialLoading || loadingMore || error) {
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
  }, [canLoadAttributes, hasMore, initialLoading, loadingMore, error, page, fetchPage])

  const visibleAttributes = useMemo(() => {
    const listed = attributes
      .map(toPickerAttribute)
      .filter((attribute) => !excludedAttributeIds.has(attribute.id))
    if (selectedAttributes.length === 0) {
      return listed
    }
    const listedIds = new Set(listed.map((attribute) => attribute.id))
    const missingSelected = selectedAttributes.filter(
      (attribute) =>
        !listedIds.has(attribute.id) && !excludedAttributeIds.has(attribute.id),
    )
    return missingSelected.length > 0 ? [...missingSelected, ...listed] : listed
  }, [selectedAttributes, attributes, excludedAttributeIds])

  function handleAttributeToggle(attribute: AttributeSelectValue) {
    const nextSelectedAttributes = multiple
      ? selectedAttributeIds.has(attribute.id)
        ? selectedAttributes.filter((entry) => entry.id !== attribute.id)
        : [...selectedAttributes, attribute]
      : [attribute]

    onSelectionChange(nextSelectedAttributes)
  }

  if (!accessToken) {
    return (
      <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center gap-3 p-6">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Waiting for authentication…</p>
      </div>
    )
  }

  const showEmpty = !initialLoading && !error && visibleAttributes.length === 0

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col p-6">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={searchInput}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchInput(event.target.value)}
          placeholder="Search attributes"
          aria-label="Search attributes"
          className="flex-1"
        />
        {canCreate ? (
          <Button variant="outline" className="shrink-0 gap-2" onClick={onCreateRequest}>
            <Plus className="h-4 w-4" aria-hidden />
            Add new attribute
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

        {showEmpty ? <ItemListEmpty>No attributes found.</ItemListEmpty> : null}

        {!initialLoading && visibleAttributes.length > 0 ? (
          <ItemList>
            {visibleAttributes.map((attribute) => {
              const isSelected = selectedAttributeIds.has(attribute.id)
              return (
                <ItemListItem
                  key={attribute.id}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'cursor-pointer transition-colors',
                    isSelected && itemListRowActiveClassName,
                  )}
                  aria-label={`${multiple ? 'Toggle' : 'Select'} ${attribute.name}`}
                  aria-pressed={isSelected}
                  onClick={() => handleAttributeToggle(attribute)}
                  onKeyDown={(event: KeyboardEvent<HTMLLIElement>) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handleAttributeToggle(attribute)
                    }
                  }}
                >
                  <ItemListContent>
                    <p className="truncate font-medium">{attribute.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      <span className="capitalize">{attribute.valueType}</span>
                      {attribute.unit
                        ? ` · ${attribute.unit.name} (${attribute.unit.symbol})`
                        : ''}
                    </p>
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
