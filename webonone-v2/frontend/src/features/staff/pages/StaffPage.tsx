import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  ListPageBody,
  SearchInput,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { StaffFormDialog } from '@/features/staff/components/StaffFormDialog'
import { StaffList } from '@/features/staff/components/StaffList'
import { staffActions } from '@/features/staff/store'
import { useEpicCatalogList } from '@/shared/hooks/useEpicCatalogList'

export function StaffPage() {
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const selectionComplete = useAppSelector((s) => s.sessionRole.selectionComplete)
  const [addOpen, setAddOpen] = useState(false)

  const list = useEpicCatalogList((s) => s.staff, staffActions)
  usePlatformLoading(list.loading ? 'Loading staff…' : null)

  const existingUserIds = useMemo(
    () => new Set(list.items.map((item) => item.userId)),
    [list.items],
  )

  if (selectionComplete && activeRole !== 'company_admin') {
    return <Navigate to="/" replace />
  }

  return (
    <FeaturePage
      title="Staff"
      description="Manage company staff and their weekly work schedules."
      actions={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <SearchInput
            value={list.q}
            onChange={(event) => list.setQ(event.target.value)}
            onClear={() => list.setQ('')}
            placeholder="Search staff…"
            className="w-64"
            aria-label="Search staff"
          />
          <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Add staff
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
            <StaffList items={list.items} onRemoved={() => list.load(list.page, list.pageSize, true)} />
          ) : null}
        </div>
      </ListPageBody>

      <StaffFormDialog
        open={addOpen}
        existingUserIds={existingUserIds}
        onOpenChange={setAddOpen}
        onSaved={() => list.load(1, list.pageSize, true)}
      />
    </FeaturePage>
  )
}
