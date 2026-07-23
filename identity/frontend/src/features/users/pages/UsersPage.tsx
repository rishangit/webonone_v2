import { useEffect, useMemo, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Avatar,
  Button,
  FeaturePage,
  FormField,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ListFilterPanel,
  ListFilterTrigger,
  ListPageBody,
  SearchInput,
  Pagination,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
  type UserOption,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { hasPlatformEmbedHandoff } from '@/features/auth/utils/platformReturn'
import { AddCompanyUserDialog } from '@/features/users/components/AddCompanyUserDialog'
import {
  getSessionCompanyId,
  isSessionCompanyAdmin,
  isSessionSuperAdmin,
} from '@/features/users/utils/currentRole'
import { addCompanyCustomer } from '@/features/users/services/usersApi'
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
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const isSuperAdmin = isSessionSuperAdmin(accessToken)
  const isCompanyAdmin = isSessionCompanyAdmin(accessToken)
  const companyId = getSessionCompanyId(accessToken)
  const isEmbedHandoff = hasPlatformEmbedHandoff(searchParams)
  const companyMode = isCompanyAdmin && Boolean(companyId)

  const { items, total, page, pageSize, listStatus, listError } = useAppSelector((s) => s.users)

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>(ALL_ROLES_VALUE)
  const [appliedRole, setAppliedRole] = useState<UserPickerRole | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const canQuery = Boolean(accessToken) && (isSuperAdmin || companyMode)
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
        extra: companyMode
          ? { search: debouncedSearch || undefined, companyId: companyId! }
          : { search: debouncedSearch || undefined, role: appliedRole ?? undefined },
      }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canQuery, debouncedSearch, appliedRole, companyMode, companyId])

  const hasActiveFilters = !companyMode && roleFilter !== ALL_ROLES_VALUE

  const emptyLabel = useMemo(() => {
    if (loading) {
      return null
    }
    if (items.length === 0) {
      return companyMode
        ? 'No users yet. Use Add user to select someone for this company.'
        : 'No users found.'
    }
    return null
  }, [loading, items.length, companyMode])

  async function handleSelectUser(user: UserOption) {
    if (!companyId) {
      return
    }
    try {
      await addCompanyCustomer({
        companyId,
        userId: user.id,
      })
      setAddOpen(false)
      toast({ title: 'User added' })
      dispatch(
        usersActions.loadListRequested({
          page: 1,
          pageSize,
          extra: { search: debouncedSearch || undefined, companyId },
        }),
      )
    } catch (err) {
      toast({
        title: 'Failed to add user',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    }
  }

  function handleCreatedUser(_user: UserOption) {
    setAddOpen(false)
    toast({ title: 'User added' })
    if (!companyId) {
      return
    }
    dispatch(
      usersActions.loadListRequested({
        page: 1,
        pageSize,
        extra: { search: debouncedSearch || undefined, companyId },
      }),
    )
  }

  if (!accessToken) {
    if (isEmbedHandoff) {
      return null
    }
    return <Navigate to="/login" replace />
  }

  if (!isSuperAdmin && !companyMode) {
    return <Navigate to="/profile" replace />
  }

  return (
    <FeaturePage
      title="Users"
      description={
        companyMode
          ? 'Users belonging to your company. Add a registered user from the directory.'
          : 'Browse all registered platform users.'
      }
      actions={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <SearchInput
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name or email…"
            aria-label="Search users"
            className="w-64"
          />
          {!companyMode ? (
            <ListFilterTrigger active={hasActiveFilters} onClick={() => setFilterOpen(true)} />
          ) : null}
          {companyMode ? (
            <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Add user
            </Button>
          ) : null}
        </div>
      }
    >
      {!companyMode ? (
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
      ) : null}

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
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email?.trim() ? user.email : 'No email'}
                      </p>
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
                extra: companyMode
                  ? { search: debouncedSearch || undefined, companyId: companyId! }
                  : { search: debouncedSearch || undefined, role: appliedRole ?? undefined },
              }),
            )
          }
          onPageSizeChange={(size) =>
            dispatch(
              usersActions.loadListRequested({
                page: 1,
                pageSize: size,
                extra: companyMode
                  ? { search: debouncedSearch || undefined, companyId: companyId! }
                  : { search: debouncedSearch || undefined, role: appliedRole ?? undefined },
              }),
            )
          }
        />
      </ListPageBody>

      {companyMode ? (
        <AddCompanyUserDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          onSelect={(user) => {
            void handleSelectUser(user)
          }}
          onCreated={handleCreatedUser}
        />
      ) : null}
    </FeaturePage>
  )
}
