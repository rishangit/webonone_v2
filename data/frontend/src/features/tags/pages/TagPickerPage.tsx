import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, Plus } from 'lucide-react'
import {
  getPlatformEmbedParentOrigin,
  isDataTagPickerSetSelectionMessage,
  PLATFORM_EMBED_QUERY,
  sendDataTagPickerCreateRequest,
  sendDataTagPickerSelectionChange,
  type DataTagPickerTag,
} from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  Button,
  Input,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  itemListRowActiveClassName,
  Spinner,
  cn,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { dataApi } from '@/shared/services/dataApi'
import type { Tag } from '@/shared/types/data.types'

const SEARCH_DEBOUNCE_MS = 300
const PAGE_SIZE = 20

function toPickerTag(tag: Tag | DataTagPickerTag): DataTagPickerTag {
  return { id: tag.id, name: tag.name, color: tag.color }
}

export function TagPickerPage() {
  const [searchParams] = useSearchParams()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const role = useAppSelector((s) => s.auth.user?.role)
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const isEmbed = searchParams.get(PLATFORM_EMBED_QUERY.EMBED) === PLATFORM_EMBED_QUERY.EMBED_VALUE
  const scope = (searchParams.get(PLATFORM_EMBED_QUERY.SCOPE) ?? '').trim()
  const multiple = searchParams.get(PLATFORM_EMBED_QUERY.MODE) === 'multiple'
  const isValid = isEmbed && Boolean(parentOrigin) && scope.length > 0
  const canLoadTags = isValid && Boolean(accessToken)
  const canCreate = role === 'super_admin' || role === 'company_admin'

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<DataTagPickerTag[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scrollRootRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const requestIdRef = useRef(0)
  const loadingRef = useRef(false)

  const selectedTagIds = useMemo(
    () => new Set(selectedTags.map((tag) => tag.id)),
    [selectedTags],
  )

  const notifySelectionChange = useCallback(
    (nextSelectedTags: DataTagPickerTag[]) => {
      if (!parentOrigin || !scope) {
        return
      }
      sendDataTagPickerSelectionChange(parentOrigin, scope, nextSelectedTags)
    },
    [parentOrigin, scope],
  )

  useEffect(() => {
    if (!parentOrigin || !scope) {
      return
    }

    function handleMessage(event: MessageEvent) {
      if (event.origin !== parentOrigin) {
        return
      }
      if (!isDataTagPickerSetSelectionMessage(event.data) || event.data.scope !== scope) {
        return
      }

      const nextSelectedTags = multiple
        ? event.data.tags.map(toPickerTag)
        : event.data.tags.slice(0, 1).map(toPickerTag)

      setSelectedTags(nextSelectedTags)
      notifySelectionChange(nextSelectedTags)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [multiple, notifySelectionChange, parentOrigin, scope])

  const fetchPage = useCallback(
    async (targetPage: number, replace: boolean) => {
      if (!canLoadTags || loadingRef.current) {
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
        const response = await dataApi.listTags({
          q: debouncedSearch,
          page: targetPage,
          pageSize: PAGE_SIZE,
        })
        if (requestId !== requestIdRef.current) {
          return
        }

        setTags((prev) => (replace ? response.items : [...prev, ...response.items]))
        setPage(targetPage)
        setHasMore(targetPage * response.pageSize < response.total)
      } catch (err) {
        if (requestId !== requestIdRef.current) {
          return
        }
        setError(err instanceof Error ? err.message : 'Failed to load tags')
        if (replace) {
          setTags([])
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
    [canLoadTags, debouncedSearch],
  )

  useEffect(() => {
    if (!canLoadTags) {
      return
    }
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [canLoadTags, searchInput])

  useEffect(() => {
    if (!canLoadTags) {
      return
    }
    void fetchPage(1, true)
  }, [canLoadTags, debouncedSearch, fetchPage])

  useEffect(() => {
    if (!canLoadTags || !hasMore || initialLoading || loadingMore || error) {
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
  }, [canLoadTags, hasMore, initialLoading, loadingMore, error, page, fetchPage])

  const visibleTags = useMemo(() => {
    const listed = tags.map(toPickerTag)
    if (selectedTags.length === 0) {
      return listed
    }
    const listedIds = new Set(listed.map((tag) => tag.id))
    const missingSelected = selectedTags.filter((tag) => !listedIds.has(tag.id))
    return missingSelected.length > 0 ? [...missingSelected, ...listed] : listed
  }, [selectedTags, tags])

  function handleTagToggle(tag: DataTagPickerTag) {
    const nextSelectedTags = multiple
      ? selectedTagIds.has(tag.id)
        ? selectedTags.filter((entry) => entry.id !== tag.id)
        : [...selectedTags, tag]
      : [tag]

    setSelectedTags(nextSelectedTags)
    notifySelectionChange(nextSelectedTags)
  }

  function handleCreateClick() {
    if (!parentOrigin || !scope) {
      return
    }
    sendDataTagPickerCreateRequest(parentOrigin, scope)
  }

  if (!isValid) {
    return (
      <div className="mx-auto flex min-h-[320px] w-full max-w-3xl items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-xl">
          <AlertDescription>
            This page is available only for platform iframe embeds with a valid parent origin and scope.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!accessToken) {
    return (
      <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center gap-3 p-6">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Waiting for authentication…</p>
      </div>
    )
  }

  const showEmpty = !initialLoading && !error && visibleTags.length === 0

  return (
    <div className="mx-auto flex min-h-full w-full max-w-4xl flex-1 flex-col p-4 sm:p-6">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={searchInput}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchInput(event.target.value)}
          placeholder="Search tags"
          aria-label="Search tags"
          className="flex-1"
        />
        {canCreate ? (
          <Button variant="outline" className="shrink-0 gap-2" onClick={handleCreateClick}>
            <Plus className="h-4 w-4" aria-hidden />
            Add new tag
          </Button>
        ) : null}
      </div>

      <div
        ref={scrollRootRef}
        className="mt-4 min-h-[320px] flex-1 overflow-y-auto overscroll-y-contain scrollbar-themed"
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

        {showEmpty ? <ItemListEmpty>No tags found.</ItemListEmpty> : null}

        {!initialLoading && visibleTags.length > 0 ? (
          <ItemList className="py-2">
            {visibleTags.map((tag) => {
              const isSelected = selectedTagIds.has(tag.id)
              return (
                <ItemListItem
                  key={tag.id}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'cursor-pointer transition-colors',
                    isSelected && itemListRowActiveClassName,
                  )}
                  aria-label={`${multiple ? 'Toggle' : 'Select'} ${tag.name}`}
                  aria-pressed={isSelected}
                  onClick={() => handleTagToggle(tag)}
                  onKeyDown={(event: KeyboardEvent<HTMLLIElement>) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handleTagToggle(tag)
                    }
                  }}
                >
                  <span
                    className="h-4 w-4 shrink-0 self-center rounded-full border border-border"
                    style={{ backgroundColor: tag.color }}
                    aria-hidden
                  />
                  <ItemListContent>
                    <p className="truncate font-medium">{tag.name}</p>
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
