import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  FormField,
  ListAddButton,
  ListFilterPanel,
  ListFilterTrigger,
  ListPageBody,
  ListPageFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { StaffLeaveFormDialog } from '@/features/staff/components/StaffLeaveFormDialog'
import { StaffLeavesList } from '@/features/staff/components/StaffLeavesList'
import { staffLeaveApi } from '@/features/staff/services/staffLeaveApi'
import { staffLeavesActions } from '@/features/staff/store'
import type { CompanyStaff } from '@/features/staff/types/staff.types'
import { LEAVE_STATUSES } from '@/features/staff/types/staffLeave.types'
import { useEpicCatalogList } from '@/shared/hooks/useEpicCatalogList'

type StaffLeavesPanelProps = {
  staff: CompanyStaff
  canManage: boolean
}

export function StaffLeavesPanel({ staff, canManage }: StaffLeavesPanelProps) {
  const { t } = useTranslation('staff')
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const authUser = useAppSelector((s) => s.auth.user)
  const list = useEpicCatalogList(
    (s) => s.staffLeaves,
    staffLeavesActions,
    { initialExtra: { staffId: staff.id } },
  )
  const [addOpen, setAddOpen] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)

  const canAdd = canManage || (authUser != null && authUser.id === staff.userId)
  const hasActiveFilters = list.status !== 'all'

  usePlatformLoading(list.loading ? t('leaves.loading') : null)

  useEffect(() => {
    list.setExtraFilters({ staffId: staff.id })
  }, [staff.id, list.setExtraFilters])

  const reloadLeaves = useCallback(
    (page = 1, force = true) => {
      dispatch(
        staffLeavesActions.loadListRequested({
          page,
          pageSize: list.pageSize,
          q: list.q,
          status: list.status,
          extra: { staffId: staff.id },
          force,
        }),
      )
    },
    [dispatch, list.pageSize, list.q, list.status, staff.id],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex w-full flex-wrap items-center justify-end gap-2">
        <ListFilterTrigger
          active={hasActiveFilters}
          onClick={() => list.setFilterOpen(true)}
          aria-label={t('leaves.filterStatus')}
        />
        {canAdd ? (
          <ListAddButton onClick={() => setAddOpen(true)}>{t('leaves.addLeave')}</ListAddButton>
        ) : null}
      </div>

      <ListFilterPanel
        open={list.filterOpen}
        onOpenChange={list.setFilterOpen}
        title={t('leaves.filtersTitle')}
        onClear={() => {
          list.setStatus('all')
        }}
      >
        <FormField label={t('leaves.filterStatus')} htmlFor="staff-leave-status">
          <Select value={list.status} onValueChange={list.setStatus}>
            <SelectTrigger id="staff-leave-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('leaves.statusAll')}</SelectItem>
              {LEAVE_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`leaves.statuses.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </ListFilterPanel>

      {list.error ? (
        <Alert variant="destructive">
          <AlertDescription>{list.error}</AlertDescription>
        </Alert>
      ) : null}

      <ListPageBody>
        <div className="flex-1">
          {!list.loading ? (
            <StaffLeavesList
              staffId={staff.id}
              items={list.items}
              canManage={canManage}
              currentUserId={authUser?.id ?? null}
              actionId={actionId}
              onApprove={async (leaveId) => {
                setActionId(leaveId)
                try {
                  await staffLeaveApi.approve(staff.id, leaveId)
                  toast({ title: t('leaves.toastApproved') })
                  reloadLeaves(1)
                } catch (err) {
                  toast({
                    title: t('leaves.toastApproveFailed'),
                    description: err instanceof Error ? err.message : undefined,
                    variant: 'destructive',
                  })
                } finally {
                  setActionId(null)
                }
              }}
              onReject={async (leaveId) => {
                setActionId(leaveId)
                try {
                  await staffLeaveApi.reject(staff.id, leaveId)
                  toast({ title: t('leaves.toastRejected') })
                  reloadLeaves(1)
                } catch (err) {
                  toast({
                    title: t('leaves.toastRejectFailed'),
                    description: err instanceof Error ? err.message : undefined,
                    variant: 'destructive',
                  })
                } finally {
                  setActionId(null)
                }
              }}
              onCancel={async (leaveId) => {
                setActionId(leaveId)
                try {
                  await staffLeaveApi.delete(staff.id, leaveId)
                  toast({ title: t('leaves.toastCancelled') })
                  dispatch(staffLeavesActions.deleteSucceeded(leaveId))
                  reloadLeaves(1)
                } catch (err) {
                  toast({
                    title: t('leaves.toastCancelFailed'),
                    description: err instanceof Error ? err.message : undefined,
                    variant: 'destructive',
                  })
                } finally {
                  setActionId(null)
                }
              }}
            />
          ) : null}
        </div>
        <ListPageFooter
          className="mt-auto"
          totalCount={list.total}
          currentPage={list.page}
          pageSize={list.pageSize}
          pageSizeOptions={[12, 24, 48]}
          loadedCount={list.items.length}
          hasMore={list.hasMore}
          loadingMore={list.loadingMore}
          onPageChange={(p) => reloadLeaves(p, false)}
          onPageSizeChange={(size) => {
            list.setPageSize(size)
            reloadLeaves(1)
          }}
          onLoadMore={list.loadMore}
          onModeChange={() => reloadLeaves(1)}
        />
      </ListPageBody>

      {canAdd ? (
        <StaffLeaveFormDialog
          open={addOpen}
          staffId={staff.id}
          onOpenChange={setAddOpen}
          onSubmit={async (body) => {
            await staffLeaveApi.create(staff.id, body)
            toast({ title: t('leaves.toastAdded') })
            reloadLeaves(1)
          }}
        />
      ) : null}
    </div>
  )
}
