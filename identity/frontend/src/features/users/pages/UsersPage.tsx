import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PlatformHostedListFilterPanel } from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  FeaturePage,
  ItemListViewToggle,
  ListFilterTrigger,
  ListAddButton,
  ListPageActions,
  ListPageBody,
  SearchInput,
  ListPageFooter,
  useToast,
  type UserOption,
} from '@webonone/ui-kit'
import { useListDisplayModeControl } from '@/shared/hooks/useListDisplayModeControl'
import { UsersList } from '@/features/users/components/UsersList'
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
  ALL_ROLES_VALUE,
  UsersRoleFilterFields,
} from '@/features/users/components/UsersRoleFilterFields'
import type { UsersFilterDraft } from '@/features/users/pages/UsersFilterEmbedPage'
import {
  canAccessCompanyCustomers,
  getSessionCompanyId,
  isSessionSuperAdmin,
} from '@/features/users/utils/currentRole'
import { addCompanyCustomer } from '@/features/users/services/usersApi'
import { usersActions } from '@/features/users/store'
import type { UserPickerRole, UserPickerUser } from '@/features/users/types'
import { useNavigateIdentity } from '@/features/shell/utils/navigateIdentity'

const SEARCH_DEBOUNCE_MS = 300
const PAGE_SIZE_OPTIONS = [12, 24, 48]

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
  const { mode: listDisplayMode, setMode: setListDisplayMode } = useListDisplayModeControl()
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
          force: true,
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
        force: true,
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
        <ListPageActions>
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
          <ItemListViewToggle value={listDisplayMode} onChange={setListDisplayMode} />
          {companyCustomersMode ? (
            <ListAddButton onClick={() => setAddOpen(true)}>{t('addUser')}</ListAddButton>
          ) : null}
        </ListPageActions>
      }
    >
      {!companyCustomersMode ? (
        <PlatformHostedListFilterPanel<UsersFilterDraft>
          path="/embed/panels/users/filters"
          open={filterOpen}
          onOpenChange={setFilterOpen}
          draft={{ role: roleFilter }}
          onDraftApply={(draft) => setRoleFilter(draft.role)}
          onApply={(draft) => {
            const nextRole = draft?.role ?? roleFilter
            setRoleFilter(nextRole)
            setAppliedRole(nextRole === ALL_ROLES_VALUE ? null : (nextRole as UserPickerRole))
          }}
          onClear={() => {
            setRoleFilter(ALL_ROLES_VALUE)
            setAppliedRole(null)
          }}
          isAllowedParentOrigin={isAllowedParentOrigin}
        >
          <UsersRoleFilterFields value={roleFilter} onChange={setRoleFilter} />
        </PlatformHostedListFilterPanel>
      ) : null}

      {listError ? (
        <Alert variant="destructive">
          <AlertDescription>{listError}</AlertDescription>
        </Alert>
      ) : null}

      <ListPageBody>
        <div className="flex-1">
          {!loading ? (
            <UsersList
              items={items}
              emptyLabel={emptyLabel}
              isSuperAdmin={isSuperAdmin}
              companyCustomersMode={companyCustomersMode}
              currentUserId={currentUserId}
              impersonatingUserId={impersonatingUserId}
              onOpen={goToUserDetail}
              onImpersonate={(user) => void handleImpersonate(user)}
            />
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
