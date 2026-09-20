import { useCallback, useMemo, useState } from 'react'
import { Redirect, useRouter, type Href } from 'expo-router'
import {
  Body,
  FeatureScreen,
  ListAddButton,
  ListPageActions,
  ListPageBody,
  SearchInput,
  Spinner,
} from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import { TranslatedListPageFooter } from '@/shared/components/TranslatedListPageFooter'
import { useSession } from '@/features/auth/SessionContext'
import { StaffFormDialog } from '@/features/staff/components/StaffFormDialog'
import { StaffList } from '@/features/staff/components/StaffList'
import { staffApi } from '@/features/staff/services/staffApi'
import type { CompanyStaff } from '@/features/staff/types/staff.types'
import { staffDetailPath } from '@/features/staff/utils/staffPaths'
import { canAccessCompanySession } from '@/features/sales/utils/canAccessCompanySession'
import { useListPageScroll } from '@/shared/hooks/useListPageScroll'
import { useServerPaginatedList } from '@/shared/hooks/useServerPaginatedList'

export function StaffScreen() {
  const { t } = useTranslation('staff')
  const router = useRouter()
  const { user } = useSession()
  const canAccess = canAccessCompanySession(user?.role, user?.companyId)
  const canManage = user?.role === 'company_admin' && Boolean(user?.companyId)
  const [addOpen, setAddOpen] = useState(false)

  const fetchPage = useCallback(
    async (query: Record<string, string | number | undefined>) =>
      staffApi.list({
        page: Number(query.page ?? 1),
        pageSize: Number(query.pageSize ?? 12),
        q: query.q as string | undefined,
      }),
    [],
  )

  const list = useServerPaginatedList<CompanyStaff>({ fetchPage })

  const onScroll = useListPageScroll(list)
  const emptyMessage = useMemo(() => {
    if (list.loading) return ''
    if (list.searchQuery.trim()) return t('list.empty')
    return t('list.empty')
  }, [list.loading, list.searchQuery, t])

  if (user && !canAccess) {
    return <Redirect href="/" />
  }

  return (
    <FeatureScreen
      title={t('list.title')}
      description={t('list.description')}
      onScroll={onScroll}
      actions={
        <ListPageActions>
          <SearchInput
            value={list.searchQuery}
            onChangeText={list.setSearchQuery}
            onClear={list.searchQuery ? () => list.setSearchQuery('') : undefined}
            placeholder={t('list.searchPlaceholder')}
            accessibilityLabel={t('list.searchAria')}
          />
          {canManage ? (
            <ListAddButton onPress={() => setAddOpen(true)}>{t('list.addStaff')}</ListAddButton>
          ) : null}
        </ListPageActions>
      }
    >
      {list.loading ? <Spinner label={t('list.loading')} /> : null}
      {!list.loading && list.error ? <Body className="text-destructive">{list.error}</Body> : null}

      {!list.loading ? (
        <ListPageBody>
          <StaffList
            items={list.items}
            canManage={canManage}
            emptyMessage={emptyMessage}
            onOpen={(id) => router.push(staffDetailPath(id) as Href)}
            onRemoved={() => list.reload()}
          />
          <TranslatedListPageFooter
            loadedCount={list.items.length}
            totalCount={list.total}
            hasMore={list.hasMore}
            loadingMore={list.loadingMore}
          />
        </ListPageBody>
      ) : null}

      {canManage ? (
        <StaffFormDialog
          open={addOpen}
          existingUserIds={new Set(list.items.map((item) => item.userId))}
          onOpenChange={setAddOpen}
          onSaved={() => list.reload()}
        />
      ) : null}
    </FeatureScreen>
  )
}
