import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  ListPageBody,
  Pagination,
  SearchInput,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { EventFormDialog } from '@/features/calendar/components/EventFormDialog'
import { EventsList } from '@/features/calendar/components/EventsList'
import { eventsActions } from '@/features/calendar/store'
import {
  canAccessCompanySession,
  canBrowseCalendar,
  canManageCompanyEvents,
  isPersonalCalendarSession,
} from '@/features/session/utils/canAccessCompanySession'
import { useEpicCatalogList } from '@/shared/hooks/useEpicCatalogList'

function CompanyEventsPage({ personal }: { personal: boolean }) {
  const { t } = useTranslation('calendar')
  const [dialog, setDialog] = useState<{ id?: string } | null>(null)
  const list = useEpicCatalogList((s) => s.events, eventsActions)
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const activeCompanyId = useAppSelector((s) => s.sessionRole.activeCompanyId)
  const canManage = !personal && canManageCompanyEvents(activeRole, activeCompanyId)
  usePlatformLoading(list.loading ? t('loadingEvents') : null)

  return (
    <FeaturePage
      title={t('events')}
      description={personal ? t('eventsDescriptionPersonal') : t('eventsDescription')}
      actions={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <SearchInput
            value={list.q}
            onChange={(event) => list.setQ(event.target.value)}
            onClear={() => list.setQ('')}
            placeholder={t('searchEventsPlaceholder')}
            className="w-64"
            aria-label={t('searchEvents')}
          />
          {canManage ? (
            <Button type="button" size="sm" onClick={() => setDialog({})}>
              <Plus className="h-4 w-4" aria-hidden />
              {t('addEvent')}
            </Button>
          ) : null}
        </div>
      }
    >
      {list.error ? (
        <Alert variant="destructive">
          <AlertDescription>{list.error}</AlertDescription>
        </Alert>
      ) : null}

      <ListPageBody>
        <div className="flex-1">
          {!list.loading ? (
            <EventsList
              items={list.items}
              canManage={canManage}
              onRemoved={() => list.load(list.page, list.pageSize, true)}
            />
          ) : null}
        </div>
        <Pagination
          className="mt-auto"
          totalCount={list.total}
          currentPage={list.page}
          pageSize={list.pageSize}
          onPageChange={(page) => list.load(page, list.pageSize)}
          onPageSizeChange={(pageSize) => list.load(1, pageSize, true)}
          pageSizeOptions={[12, 24, 48]}
        />
      </ListPageBody>

      {dialog && canManage ? (
        <EventFormDialog
          open
          id={dialog.id}
          onOpenChange={(open) => {
            if (!open) setDialog(null)
          }}
          onSaved={() => list.load(1, list.pageSize, true)}
        />
      ) : null}
    </FeaturePage>
  )
}

export function EventsPage() {
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const activeCompanyId = useAppSelector((s) => s.sessionRole.activeCompanyId)
  const selectionComplete = useAppSelector((s) => s.sessionRole.selectionComplete)

  if (selectionComplete && !canBrowseCalendar(activeRole)) {
    return <Navigate to="/" replace />
  }

  const personal = isPersonalCalendarSession(activeRole, activeCompanyId)
  if (
    selectionComplete &&
    !canAccessCompanySession(activeRole, activeCompanyId) &&
    !personal
  ) {
    return <Navigate to="/" replace />
  }

  return <CompanyEventsPage personal={personal} />
}
