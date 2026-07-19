import { useEffect, useMemo, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import {
  Alert,
  AlertDescription,
  Avatar,
  FeaturePage,
  FormField,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ListFilterPanel,
  ListFilterTrigger,
  ListPageBody,
  ListSearchField,
  Pagination,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { hasPlatformEmbedHandoff } from '@/features/auth/utils/platformReturn'
import { isSessionSuperAdmin } from '@/features/users/utils/currentRole'
import { usersActions } from '@/features/users/store'
import type { UserPickerRole } from '@/features/users/types'

const ALL_ROLES_VALUE = '__all__'
const SEARCH_DEBOUNCE_MS = 300
const PAGE_SIZE_OPTIONS = [12, 24, 48]

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

export function UsersPage() {
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const isSuperAdmin = isSessionSuperAdmin(accessToken)
  const isEmbedHandoff = hasPlatformEmbedHandoff(searchParams)

  const { items, total, page, pageSize, listStatus, listError } = useAppSelector((s) => s.users)

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>(ALL_ROLES_VALUE)
  const [appliedRole, setAppliedRole] = useState<UserPickerRole | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)

  const canQuery = Boolean(accessToken) && isSuperAdmin
  const loading = listStatus === 'loading' && items.length === 0
  usePlatformLoading(loading ? 'Loading users…' : null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    if (!canQuery) {
      return
    }
    dispatch(
      usersActions.loadListRequested({
        page: 1,
        pageSize,
        extra: { search: debouncedSearch || undefined, role: appliedRole ?? undefined },
      }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canQuery, debouncedSearch, appliedRole])

  const hasActiveFilters = roleFilter !== ALL_ROLES_VALUE

  const emptyLabel = useMemo(() => {
    if (loading) {
      return null
    }
    if (items.length === 0) {
      return 'No users found.'
    }
    return null
  }, [loading, items.length])

  if (!accessToken) {
    // In embed mode the JWT arrives asynchronously via postMessage — wait for it
    // instead of bouncing to /login (which the shell overlay would cover, reading
    // as a stuck second loading layer).
    if (isEmbedHandoff) {
      return null
    }
    return <Navigate to="/login" replace />
  }

  if (!isSuperAdmin) {
    return <Navigate to="/profile" replace />
  }

  return (
    <FeaturePage
      title="Users"
      description="Browse all registered platform users."
      actions={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <ListSearchField
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search by name or email…"
            aria-label="Search users"
          />
          <ListFilterTrigger active={hasActiveFilters} onClick={() => setFilterOpen(true)} />
        </div>
      }
    >
      <ListFilterPanel
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onApply={() =>
          setAppliedRole(roleFilter === ALL_ROLES_VALUE ? null : (roleFilter as UserPickerRole))
        }
        onClear={() => {
          setRoleFilter(ALL_ROLES_VALUE)
          setAppliedRole(null)
        }}
      >
        <FormField label="Role" htmlFor="users-role">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger id="users-role">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ROLES_VALUE}>All roles</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="company_admin">Company Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </ListFilterPanel>

      {listError ? (
        <Alert variant="destructive">
          <AlertDescription>{listError}</AlertDescription>
        </Alert>
      ) : null}

      <ListPageBody>
        <div className="flex-1">
          {!loading ? (
            emptyLabel ? (
              <ItemListEmpty>{emptyLabel}</ItemListEmpty>
            ) : (
              <ItemList>
                {items.map((user) => (
                  <ItemListItem key={user.id}>
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
            )
          ) : null}
        </div>
        <Pagination
          className="mt-auto"
          totalCount={total}
          currentPage={page}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageChange={(p) =>
            dispatch(
              usersActions.loadListRequested({
                page: p,
                pageSize,
                extra: { search: debouncedSearch || undefined, role: appliedRole ?? undefined },
              }),
            )
          }
          onPageSizeChange={(size) =>
            dispatch(
              usersActions.loadListRequested({
                page: 1,
                pageSize: size,
                extra: { search: debouncedSearch || undefined, role: appliedRole ?? undefined },
              }),
            )
          }
        />
      </ListPageBody>
    </FeaturePage>
  )
}
