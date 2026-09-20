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
import { TranslatedListPageFooter } from '@/shared/components/TranslatedListPageFooter'
import { useTranslation } from 'react-i18next'
import { useSession } from '@/features/auth/SessionContext'
import { EventFormDialog } from '@/features/calendar/components/EventFormDialog'
import { EventsList } from '@/features/calendar/components/EventsList'
import { eventsApi } from '@/features/calendar/services/eventsApi'
import type { CompanyEvent } from '@/features/calendar/types/event.types'
import {
  canAccessCompanySession,
  canBrowseCalendar,
  canManageCompanyEvents,
  isPersonalCalendarSession,
} from '@/features/calendar/utils/calendarAccess'
import { eventDetailPath } from '@/features/calendar/utils/calendarPaths'
import { useListPageScroll } from '@/shared/hooks/useListPageScroll'
import { useServerPaginatedList } from '@/shared/hooks/useServerPaginatedList'

export function EventsScreen() {
  const { t } = useTranslation('calendar')
  const router = useRouter()
  const { user } = useSession()
  const personal = isPersonalCalendarSession(user?.role, user?.companyId)
  const canManage = !personal && canManageCompanyEvents(user?.role, user?.companyId)
  const [addOpen, setAddOpen] = useState(false)

  const fetchPage = useCallback(
    async (query: Record<string, string | number | undefined>) =>
      eventsApi.list({
        page: Number(query.page ?? 1),
        pageSize: Number(query.pageSize ?? 12),
        q: query.q as string | undefined,
      }),
    [],
  )

  const list = useServerPaginatedList<CompanyEvent>({ fetchPage })
  const onScroll = useListPageScroll(list)

  const description = personal
    ? t('events.descriptionMember')
    : canManage
      ? t('events.descriptionAdmin')
      : t('events.descriptionStaff')

  const emptyMessage = useMemo(() => {
    if (list.loading) return ''
    if (list.searchQuery.trim()) return t('events.emptyAdmin')
    if (personal) return t('events.emptyMember')
    if (canManage) return t('events.emptyAdmin')
    return t('events.emptyStaff')
  }, [canManage, list.loading, list.searchQuery, personal, t])

  if (
    user &&
    (!canBrowseCalendar(user.role) ||
      (!canAccessCompanySession(user.role, user.companyId) && !personal))
  ) {
    return <Redirect href="/" />
  }

  return (
    <FeatureScreen
      title={t('events.title')}
      description={description}
      onScroll={onScroll}
      actions={
        <ListPageActions>
          <SearchInput
            value={list.searchQuery}
            onChangeText={list.setSearchQuery}
            onClear={list.searchQuery ? () => list.setSearchQuery('') : undefined}
            placeholder={t('events.searchPlaceholder')}
            accessibilityLabel={t('events.searchAria')}
          />
          {canManage ? (
            <ListAddButton onPress={() => setAddOpen(true)}>{t('events.addEvent')}</ListAddButton>
          ) : null}
        </ListPageActions>
      }
    >
      {list.loading ? <Spinner label={t('events.loading')} /> : null}
      {!list.loading && list.error ? <Body className="text-destructive">{list.error}</Body> : null}

      {!list.loading ? (
        <ListPageBody>
          <EventsList
            items={list.items}
            canManage={canManage}
            emptyMessage={emptyMessage}
            onOpen={(id) => router.push(eventDetailPath(id) as Href)}
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
        <EventFormDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          onSaved={() => {
            void list.reload()
          }}
        />
      ) : null}
    </FeatureScreen>
  )
}
