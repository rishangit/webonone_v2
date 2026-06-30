import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, AlertDescription } from './Alert'
import { Avatar } from './Avatar'
import { Button } from './Button'
import { CustomDialog } from './CustomDialog'
import { Input } from './Input'
import {
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
} from './ItemList'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './Select'
import { Spinner } from './Spinner'

export interface UserOption {
  id: string
  displayName: string
  email: string
  role?: string
  avatarUrl?: string | null
}

export interface UserSelectionLoadParams {
  search: string
  role: string | null
  page: number
  pageSize: number
}

export interface UserSelectionLoadResult {
  users: UserOption[]
  hasMore: boolean
}

export type LoadUsersFn = (params: UserSelectionLoadParams) => Promise<UserSelectionLoadResult>

export interface UserSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (user: UserOption) => void
  loadUsers: LoadUsersFn
  title?: string
  description?: string
  pageSize?: number
  roleOptions?: { value: string; label: string }[]
  emptyMessage?: string
  id?: string
}

const ALL_ROLES_VALUE = '__all__'
const SEARCH_DEBOUNCE_MS = 300

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  }
  return displayName.slice(0, 2).toUpperCase()
}

function formatRoleLabel(role: string): string {
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function UserSelectionDialog({
  open,
  onOpenChange,
  onSelect,
  loadUsers,
  title = 'Select user',
  description,
  pageSize = 20,
  roleOptions,
  emptyMessage = 'No users found',
  id = 'user-selection-dialog',
}: UserSelectionDialogProps) {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState(ALL_ROLES_VALUE)
  const [users, setUsers] = useState<UserOption[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openGeneration, setOpenGeneration] = useState(0)

  const scrollRootRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const requestIdRef = useRef(0)
  const loadingRef = useRef(false)
  const prevOpenRef = useRef(false)

  const resolvedRole = roleFilter === ALL_ROLES_VALUE ? null : roleFilter

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
        const result = await loadUsers({
          search: debouncedSearch,
          role: resolvedRole,
          page: targetPage,
          pageSize,
        })

        if (requestId !== requestIdRef.current) {
          return
        }

        setUsers((prev) => (replace ? result.users : [...prev, ...result.users]))
        setPage(targetPage)
        setHasMore(result.hasMore)
      } catch (err) {
        if (requestId !== requestIdRef.current) {
          return
        }
        setError(err instanceof Error ? err.message : 'Failed to load users')
        if (replace) {
          setUsers([])
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
    [debouncedSearch, loadUsers, pageSize, resolvedRole],
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
      setRoleFilter(ALL_ROLES_VALUE)
      setUsers([])
      setPage(1)
      setHasMore(false)
      setError(null)
      setInitialLoading(false)
      setLoadingMore(false)
      requestIdRef.current += 1
      setOpenGeneration((value) => value + 1)
    }
    prevOpenRef.current = open
  }, [open])

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
  }, [open, openGeneration, debouncedSearch, resolvedRole, fetchPage])

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

  function handleSelect(user: UserOption) {
    onSelect(user)
    onOpenChange(false)
  }

  function handleRetry() {
    void fetchPage(1, true)
  }

  const showEmpty = !initialLoading && !error && users.length === 0

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      sizeWidth="large"
      sizeHeight="large"
      disableContentScroll
      noContentPadding
      id={id}
      footer={
        <Button variant="outline" className="h-10 px-4" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
      }
    >
      <div className="flex h-full min-h-0 flex-col p-6">
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name or email"
            aria-label="Search users"
            className="flex-1"
          />
          {roleOptions && roleOptions.length > 0 ? (
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48" aria-label="Filter by role">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_ROLES_VALUE}>All roles</SelectItem>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
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

          {!initialLoading && users.length > 0 ? (
            <ItemList className="py-2">
              {users.map((user) => (
                <ItemListItem
                  key={user.id}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer transition-colors hover:border-primary/40"
                  aria-label={`Select ${user.displayName}`}
                  onClick={() => handleSelect(user)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handleSelect(user)
                    }
                  }}
                >
                  <Avatar
                    size="sm"
                    src={user.avatarUrl}
                    alt={user.displayName}
                    fallback={getInitials(user.displayName)}
                    className="shrink-0"
                  />
                  <ItemListContent>
                    <p className="truncate font-medium">{user.displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </ItemListContent>
                  {user.role ? (
                    <span className="shrink-0 self-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {formatRoleLabel(user.role)}
                    </span>
                  ) : null}
                </ItemListItem>
              ))}
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
