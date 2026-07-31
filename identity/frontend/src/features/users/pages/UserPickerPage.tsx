import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import {
  getPlatformEmbedParentOrigin,
  isIdentityUserPickerSetSelectionMessage,
  PLATFORM_EMBED_QUERY,
  sendIdentityUserPickerSelectionChange,
  type IdentityUserPickerUser,
} from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  Avatar,
  Button,
  SearchInput,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  itemListRowActiveClassName,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  StatusTag,
  cn,
  isStatusTagVariant,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/shell/utils/platformConfig'
import { listUsers } from '@/features/users/services/usersApi'
import type { UserPickerRole, UserPickerUser } from '@/features/users/types'

const ALL_ROLES_VALUE = '__all__'
const SEARCH_DEBOUNCE_MS = 300
const PAGE_SIZE = 20

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

function toPickerUser(user: UserPickerUser): IdentityUserPickerUser {
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email ?? '',
    role: user.role,
    avatarUrl: user.avatarUrl,
  }
}

function fromIdentityPickerUser(user: IdentityUserPickerUser): UserPickerUser {
  const role =
    user.role === 'super_admin' || user.role === 'company_admin' || user.role === 'member'
      ? user.role
      : undefined
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    role,
    avatarUrl: user.avatarUrl ?? null,
  }
}

export function UserPickerPage() {
  const [searchParams] = useSearchParams()
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const isEmbed = searchParams.get(PLATFORM_EMBED_QUERY.EMBED) === PLATFORM_EMBED_QUERY.EMBED_VALUE
  const scope = (searchParams.get(PLATFORM_EMBED_QUERY.SCOPE) ?? '').trim()
  const multiple = searchParams.get(PLATFORM_EMBED_QUERY.MODE) === 'multiple'
  const isValid = isEmbed && Boolean(parentOrigin) && scope.length > 0
  const canLoadUsers = isValid && Boolean(accessToken)

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>(ALL_ROLES_VALUE)
  const [users, setUsers] = useState<UserPickerUser[]>([])
  const [selectedUsers, setSelectedUsers] = useState<UserPickerUser[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scrollRootRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const requestIdRef = useRef(0)
  const loadingRef = useRef(false)

  const selectedRole = useMemo(
    () => (roleFilter === ALL_ROLES_VALUE ? null : (roleFilter as UserPickerRole)),
    [roleFilter],
  )

  const selectedUserIds = useMemo(
    () => new Set(selectedUsers.map((user) => user.id)),
    [selectedUsers],
  )

  const notifySelectionChange = useCallback(
    (nextSelectedUsers: UserPickerUser[]) => {
      if (!parentOrigin || !scope) {
        return
      }
      sendIdentityUserPickerSelectionChange(
        parentOrigin,
        scope,
        nextSelectedUsers.map(toPickerUser),
      )
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
      if (!isIdentityUserPickerSetSelectionMessage(event.data) || event.data.scope !== scope) {
        return
      }

      const nextSelectedUsers = multiple
        ? event.data.users.map(fromIdentityPickerUser)
        : event.data.users.slice(0, 1).map(fromIdentityPickerUser)

      setSelectedUsers(nextSelectedUsers)
      notifySelectionChange(nextSelectedUsers)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [multiple, notifySelectionChange, parentOrigin, scope])

  const fetchPage = useCallback(
    async (targetPage: number, replace: boolean) => {
      if (!canLoadUsers || loadingRef.current) {
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
        const response = await listUsers({
          search: debouncedSearch,
          role: selectedRole,
          page: targetPage,
          pageSize: PAGE_SIZE,
        })
        if (requestId !== requestIdRef.current) {
          return
        }

        setUsers((prev) => (replace ? response.items : [...prev, ...response.items]))
        setPage(targetPage)
        setHasMore(targetPage * response.pageSize < response.total)
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
    [canLoadUsers, debouncedSearch, selectedRole],
  )

  useEffect(() => {
    if (!canLoadUsers) {
      return
    }
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [canLoadUsers, searchInput])

  useEffect(() => {
    if (!canLoadUsers) {
      return
    }
    void fetchPage(1, true)
  }, [canLoadUsers, debouncedSearch, selectedRole, fetchPage])

  useEffect(() => {
    if (!canLoadUsers || !hasMore || initialLoading || loadingMore || error) {
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
  }, [canLoadUsers, hasMore, initialLoading, loadingMore, error, page, fetchPage])

  function handleUserToggle(user: UserPickerUser) {
    const nextSelectedUsers = multiple
      ? selectedUserIds.has(user.id)
        ? selectedUsers.filter((entry) => entry.id !== user.id)
        : [...selectedUsers, user]
      : [user]

    setSelectedUsers(nextSelectedUsers)
    notifySelectionChange(nextSelectedUsers)
  }

  const visibleUsers = useMemo(() => {
    if (selectedUsers.length === 0) {
      return users
    }
    const listedIds = new Set(users.map((user) => user.id))
    const missingSelected = selectedUsers.filter((user) => !listedIds.has(user.id))
    return missingSelected.length > 0 ? [...missingSelected, ...users] : users
  }, [selectedUsers, users])

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

  const showEmpty = !initialLoading && !error && users.length === 0 && selectedUsers.length === 0

  return (
    <div className="mx-auto flex min-h-full w-full max-w-4xl flex-1 flex-col p-4 sm:p-6">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={searchInput}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchInput(event.target.value)}
          placeholder="Search by name or email"
          aria-label="Search users"
          className="flex-1"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-52" aria-label="Filter by role">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ROLES_VALUE}>All roles</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="company_admin">Company Admin</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
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

        {showEmpty ? <ItemListEmpty>No users found.</ItemListEmpty> : null}

        {!initialLoading && visibleUsers.length > 0 ? (
          <ItemList className="py-2">
            {visibleUsers.map((user) => {
              const isSelected = selectedUserIds.has(user.id)
              return (
                <ItemListItem
                  key={user.id}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'cursor-pointer transition-colors',
                    isSelected && itemListRowActiveClassName,
                  )}
                  aria-label={`${multiple ? 'Toggle' : 'Select'} ${user.displayName}`}
                  aria-pressed={isSelected}
                  onClick={() => handleUserToggle(user)}
                  onKeyDown={(event: KeyboardEvent<HTMLLIElement>) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handleUserToggle(user)
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
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email?.trim() ? user.email : 'No email'}
                      </p>
                      {user.email?.trim() ? (
                        <StatusTag
                          className="shrink-0"
                          variant={user.isEmailVerified ? 'verified' : 'unverified'}
                        />
                      ) : null}
                    </div>
                    {user.phoneNumber?.trim() ? (
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-xs text-muted-foreground">{user.phoneNumber}</p>
                        <StatusTag
                          className="shrink-0"
                          variant={user.isPhoneVerified ? 'verified' : 'unverified'}
                        />
                      </div>
                    ) : null}
                  </ItemListContent>
                  {user.role ? (
                    isStatusTagVariant(user.role) ? (
                      <StatusTag className="shrink-0 self-center" variant={user.role} />
                    ) : (
                      <StatusTag className="shrink-0 self-center" variant="member">
                        {formatRoleLabel(user.role)}
                      </StatusTag>
                    )
                  ) : null}
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
