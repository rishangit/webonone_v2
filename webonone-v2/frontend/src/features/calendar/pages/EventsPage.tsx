import { useState } from 'react'
import { Navigate } from 'react-router-dom'
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
} from '@/features/session/utils/canAccessCompanySession'
import { useEpicCatalogList } from '@/shared/hooks/useEpicCatalogList'

function EmptyEventsPage() {
  return (
    <FeaturePage
      title="Events"
      description="Manage company calendar events."
      actions={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <SearchInput
            value=""
            onChange={() => undefined}
            placeholder="Search events…"
            className="w-64"
            aria-label="Search events"
            disabled
          />
        </div>
      }
    >
      <ListPageBody>
        <div className="flex-1">
          <EventsList items={[]} onRemoved={() => undefined} />
        </div>
        <Pagination
          className="mt-auto"
          totalCount={0}
          currentPage={1}
          pageSize={12}
          onPageChange={() => undefined}
          onPageSizeChange={() => undefined}
          pageSizeOptions={[12, 24, 48]}
        />
      </ListPageBody>
    </FeaturePage>
  )
}

function CompanyEventsPage() {
  const [dialog, setDialog] = useState<{ id?: string } | null>(null)
  const list = useEpicCatalogList((s) => s.events, eventsActions)
  usePlatformLoading(list.loading ? 'Loading events…' : null)

  return (
    <FeaturePage
      title="Events"
      description="Manage company calendar events."
      actions={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <SearchInput
            value={list.q}
            onChange={(event) => list.setQ(event.target.value)}
            onClear={() => list.setQ('')}
            placeholder="Search events…"
            className="w-64"
            aria-label="Search events"
          />
          <Button type="button" size="sm" onClick={() => setDialog({})}>
            <Plus className="h-4 w-4" aria-hidden />
            Add event
          </Button>
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

      {dialog ? (
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

  // Default User (no company) — empty list; skip company-scoped API.
  if (selectionComplete && !canAccessCompanySession(activeRole, activeCompanyId)) {
    return <EmptyEventsPage />
  }

  return <CompanyEventsPage />
}
