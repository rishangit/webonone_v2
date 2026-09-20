import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Redirect, useRouter, type Href } from 'expo-router'
import {
  Body,
  FeatureScreen,
  ListAddButton,
  ListFilterPanel,
  ListFilterTrigger,
  ListPageActions,
  ListPageBody,
  SearchInput,
  Spinner,
} from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import { TranslatedListPageFooter } from '@/shared/components/TranslatedListPageFooter'
import { useSession } from '@/features/auth/SessionContext'
import { AddCompanyUserDialog } from '@/features/users/components/AddCompanyUserDialog'
import { UsersList } from '@/features/users/components/UsersList'
import {
  ALL_ROLES_VALUE,
  UsersRoleFilterFields,
} from '@/features/users/components/UsersRoleFilterFields'
import { listCompanyCustomers, listUsers } from '@/features/users/services/usersApi'
import type { UserPickerRole, UserPickerUser } from '@/features/users/types/users.types'
import {
  canAccessCompanyCustomers,
  canQueryUsers,
} from '@/features/users/utils/access'
import { userDetailPath } from '@/features/users/utils/userPaths'
import { useListPageScroll } from '@/shared/hooks/useListPageScroll'
import { useServerPaginatedList } from '@/shared/hooks/useServerPaginatedList'

export function UsersScreen() {
  const { t } = useTranslation('users')
  const router = useRouter()
  const { user } = useSession()
  const companyCustomersMode = canAccessCompanyCustomers(user)
  const companyId = user?.companyId ?? null

  const [roleDraft, setRoleDraft] = useState(ALL_ROLES_VALUE)
  const [filterOpen, setFilterOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const fetchPage = useCallback(
    async (query: Record<string, string | number | undefined>) => {
      const page = Number(query.page ?? 1)
      const pageSize = Number(query.pageSize ?? 12)
      const search = String(query.q ?? '')
      if (companyCustomersMode && companyId) {
        return listCompanyCustomers({
          companyId,
          search,
          page,
          pageSize,
        })
      }
      const role =
        query.role && query.role !== ALL_ROLES_VALUE
          ? (String(query.role) as UserPickerRole)
          : null
      return listUsers({
        search,
        role,
        page,
        pageSize,
      })
    },
    [companyCustomersMode, companyId],
  )

  const list = useServerPaginatedList<UserPickerUser>({ fetchPage })

  const usersContextKey = `${companyCustomersMode}:${companyId ?? ''}`
  const prevUsersContextKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (prevUsersContextKeyRef.current === null) {
      prevUsersContextKeyRef.current = usersContextKey
      return
    }
    if (prevUsersContextKeyRef.current === usersContextKey) return
    prevUsersContextKeyRef.current = usersContextKey
    list.reload()
  }, [list.reload, usersContextKey])

  const appliedRole = String(list.queryParams.role ?? ALL_ROLES_VALUE)
  const hasActiveFilters = !companyCustomersMode && appliedRole !== ALL_ROLES_VALUE
  const onScroll = useListPageScroll(list)

  const emptyMessage = useMemo(() => {
    if (list.loading) return ''
    if (list.searchQuery.trim()) return t('empty.noneFound')
    return companyCustomersMode ? t('empty.companyNone') : t('empty.noneFound')
  }, [companyCustomersMode, list.loading, list.searchQuery, t])

  if (user && !canQueryUsers(user)) {
    return <Redirect href="/profile" />
  }

  return (
    <FeatureScreen
      title={t('pageTitle')}
      description={
        companyCustomersMode ? t('pageDescription.company') : t('pageDescription.platform')
      }
      onScroll={onScroll}
      actions={
        <ListPageActions>
          <SearchInput
            value={list.searchQuery}
            onChangeText={list.setSearchQuery}
            onClear={list.searchQuery ? () => list.setSearchQuery('') : undefined}
            placeholder={t('searchPlaceholderShort')}
            accessibilityLabel={t('searchAria')}
          />
          {!companyCustomersMode ? (
            <ListFilterTrigger active={hasActiveFilters} onPress={() => setFilterOpen(true)} />
          ) : null}
          {companyCustomersMode && companyId ? (
            <ListAddButton onPress={() => setAddOpen(true)}>{t('addUser')}</ListAddButton>
          ) : null}
        </ListPageActions>
      }
    >
      {!companyCustomersMode ? (
        <ListFilterPanel
          open={filterOpen}
          onOpenChange={setFilterOpen}
          onApply={() => list.patchQueryParams({ role: roleDraft })}
          onClear={() => {
            setRoleDraft(ALL_ROLES_VALUE)
            list.patchQueryParams({ role: ALL_ROLES_VALUE })
          }}
        >
          <UsersRoleFilterFields value={roleDraft} onChange={setRoleDraft} />
        </ListFilterPanel>
      ) : null}

      {list.loading ? <Spinner label={t('loading.users')} /> : null}
      {!list.loading && list.error ? <Body className="text-destructive">{list.error}</Body> : null}

      {!list.loading ? (
        <ListPageBody>
          <UsersList
            items={list.items}
            emptyMessage={emptyMessage}
            onOpen={(id) => router.push(userDetailPath(id) as Href)}
          />
          <TranslatedListPageFooter
            loadedCount={list.items.length}
            totalCount={list.total}
            hasMore={list.hasMore}
            loadingMore={list.loadingMore}
          />
        </ListPageBody>
      ) : null}

      {companyCustomersMode && companyId ? (
        <AddCompanyUserDialog
          open={addOpen}
          companyId={companyId}
          companyName={user?.companyName}
          onOpenChange={setAddOpen}
          onAdded={() => list.reload()}
        />
      ) : null}
    </FeatureScreen>
  )
}
