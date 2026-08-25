import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  DropdownMenuItem,
  FeaturePage,
  FormField,
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ListFilterPanel,
  ListFilterTrigger,
  ListAddButton,
  ListPageBody,
  SearchInput,
  ListPageFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StatusTag,
  isStatusTagVariant,
  useToast,
  type UserOption,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store'
import { authApi } from '@/features/auth/services/authApi'
import { completeImpersonationHandoff } from '@/features/auth/utils/impersonation'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { hasPlatformEmbedHandoff } from '@/features/auth/utils/platformReturn'
import { isAllowedParentOrigin } from '@/features/shell/utils/platformConfig'
import { resolvePlatformEmbedParentOrigin } from '@webonone/platform-embed'
import { AddCompanyUserDialog } from '@/features/users/components/AddCompanyUserDialog'
import {
  canAccessCompanyCustomers,
  getSessionCompanyId,
  isSessionSuperAdmin,
} from '@/features/users/utils/currentRole'
import { addCompanyCustomer } from '@/features/users/services/usersApi'
import { usersActions } from '@/features/users/store'
import type { UserPickerRole, UserPickerUser } from '@/features/users/types'
import { useNavigateIdentity } from '@/features/shell/utils/navigateIdentity'

const ALL_ROLES_VALUE = '__all__'
const SEARCH_DEBOUNCE_MS = 300
const PAGE_SIZE_OPTIONS = [12, 24, 48]

function formatRoleLabel(role: string): string {
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function UsersPage() {
  const { t } = useTranslation('users')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { goToUserDetail } = useNavigateIdentity()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const currentUserId = useAppSelector((s) => s.auth.user?.id)
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const isSuperAdmin = isSessionSuperAdmin(accessToken)
  const companyId = getSessionCompanyId(accessToken)
  const isEmbedHandoff = hasPlatformEmbedHandoff(searchParams)
  const companyCustomersMode = Boolean(companyId) && canAccessCompanyCustomers(accessToken)

  const { items, total, page, pageSize, listStatus, listError, lastFetchedAt } = useAppSelector(
    (s) => s.users,
  )

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>(ALL_ROLES_VALUE)
  const [appliedRole, setAppliedRole] = useState<UserPickerRole | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [impersonatingUserId, setImpersonatingUserId] = useState<string | null>(null)

  const canQuery = Boolean(accessToken) && (isSuperAdmin || companyCustomersMode)
  const loading =
    canQuery &&
    (lastFetchedAt === null
      ? listStatus !== 'error'
      : listStatus === 'loading' && items.length === 0)
  usePlatformLoading(loading ? t('loading.users') : null)

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
        extra: companyCustomersMode
          ? { search: debouncedSearch || undefined, companyId: companyId! }
          : { search: debouncedSearch || undefined, role: appliedRole ?? undefined },
      }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canQuery, debouncedSearch, appliedRole, companyCustomersMode, companyId])

  const hasActiveFilters = !companyCustomersMode && roleFilter !== ALL_ROLES_VALUE

  const emptyLabel = useMemo(() => {
    if (loading) {
      return null
    }
    if (items.length === 0) {
      return companyCustomersMode ? t('empty.companyNone') : t('empty.noneFound')
    }
    return null
  }, [loading, items.length, companyCustomersMode, t])

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
      toast({ title: t('toasts.userAdded') })
      dispatch(
        usersActions.loadListRequested({
          page: 1,
          pageSize,
          extra: { search: debouncedSearch || undefined, companyId },
        }),
      )
    } catch (err) {
      toast({
        title: t('toasts.addFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    }
  }

  function handleCreatedUser(_user: UserOption) {
    setAddOpen(false)
    toast({ title: t('toasts.userAdded') })
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

  async function handleImpersonate(user: UserPickerUser) {
    if (!accessToken || user.id === currentUserId) {
      return
    }
    setImpersonatingUserId(user.id)
    try {
      const result = await authApi.impersonate(accessToken, user.id)
      dispatch(
        authActions.loginSucceeded({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
        }),
      )
      completeImpersonationHandoff({
        accessToken: result.accessToken,
        user: result.user,
        parentOrigin,
        onStandaloneNavigate: () => navigate('/profile', { replace: true }),
      })
      toast({ title: t('toasts.impersonateSuccess') })
    } catch (err) {
      toast({
        title: t('toasts.impersonateFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setImpersonatingUserId(null)
    }
  }

  if (!accessToken) {
    if (isEmbedHandoff) {
      return null
    }
    return <Navigate to="/login" replace />
  }

  if (!isSuperAdmin && !companyCustomersMode) {
    return <Navigate to="/profile" replace />
  }

  return (
    <FeaturePage
      title={t('pageTitle')}
      description={
        companyCustomersMode ? t('pageDescription.company') : t('pageDescription.platform')
      }
      actions={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <SearchInput
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchAria')}
            className="w-64"
          />
          {!companyCustomersMode ? (
            <ListFilterTrigger active={hasActiveFilters} onClick={() => setFilterOpen(true)} />
          ) : null}
          {companyCustomersMode ? (
            <ListAddButton onClick={() => setAddOpen(true)}>{t('addUser')}</ListAddButton>
          ) : null}
        </div>
      }
    >
      {!companyCustomersMode ? (
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
          <FormField label={t('roles.label')} htmlFor="users-role">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger id="users-role">
                <SelectValue placeholder={t('roles.all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_ROLES_VALUE}>{t('roles.all')}</SelectItem>
                <SelectItem value="super_admin">{t('roles.super_admin')}</SelectItem>
                <SelectItem value="company_admin">{t('roles.company_admin')}</SelectItem>
                <SelectItem value="member">{t('roles.member')}</SelectItem>
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
                    <ItemListContent>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => goToUserDetail(user.id)}
                      >
                        <ImagePreview
                          src={user.avatarUrl}
                          alt={user.displayName}
                          mode="view"
                          className="h-12 w-12"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{user.displayName}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            <p className="truncate text-xs text-muted-foreground">
                              {user.email?.trim() ? user.email : t('noEmail')}
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
                              <p className="truncate text-xs text-muted-foreground">
                                {user.phoneNumber}
                              </p>
                              <StatusTag
                                className="shrink-0"
                                variant={user.isPhoneVerified ? 'verified' : 'unverified'}
                              />
                            </div>
                          ) : null}
                        </div>
                        {user.role ? (
                          isStatusTagVariant(user.role) ? (
                            <StatusTag className="shrink-0 self-center" variant={user.role} />
                          ) : (
                            <StatusTag className="shrink-0 self-center" variant="member">
                              {formatRoleLabel(user.role)}
                            </StatusTag>
                          )
                        ) : null}
                      </button>
                    </ItemListContent>
                    {isSuperAdmin && !companyCustomersMode && user.id !== currentUserId ? (
                      <ItemListMenu ariaLabel={t('actionsFor', { name: user.displayName })}>
                        <DropdownMenuItem
                          disabled={impersonatingUserId === user.id}
                          onClick={() => {
                            void handleImpersonate(user)
                          }}
                        >
                          {t('actions.impersonate')}
                        </DropdownMenuItem>
                      </ItemListMenu>
                    ) : null}
                  </ItemListItem>
                ))}
              </ItemList>
            )
          ) : null}
        </div>
        <ListPageFooter
          className="mt-auto"
          totalCount={total}
          currentPage={page}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          loadedCount={items.length}
          hasMore={items.length < total}
          loadingMore={listStatus === 'loading' && items.length > 0}
          onPageChange={(p) =>
            dispatch(
              usersActions.loadListRequested({
                page: p,
                pageSize,
                extra: companyCustomersMode
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
                extra: companyCustomersMode
                  ? { search: debouncedSearch || undefined, companyId: companyId! }
                  : { search: debouncedSearch || undefined, role: appliedRole ?? undefined },
              }),
            )
          }
          onLoadMore={() =>
            dispatch(
              usersActions.loadListRequested({
                page: page + 1,
                pageSize,
                append: true,
                extra: companyCustomersMode
                  ? { search: debouncedSearch || undefined, companyId: companyId! }
                  : { search: debouncedSearch || undefined, role: appliedRole ?? undefined },
              }),
            )
          }
          onModeChange={() =>
            dispatch(
              usersActions.loadListRequested({
                page: 1,
                pageSize,
                force: true,
                extra: companyCustomersMode
                  ? { search: debouncedSearch || undefined, companyId: companyId! }
                  : { search: debouncedSearch || undefined, role: appliedRole ?? undefined },
              }),
            )
          }
        />
      </ListPageBody>

      {companyCustomersMode ? (
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
